// HALL SHARES: a pretend stock market for players 18+ on the website (Cloudflare Pages Functions + a free D1 database).
// Needs one setting in Cloudflare: Pages project -> Settings -> Bindings -> add a D1 database bound as HALL_DB.
//
// Hall Shares (HS) are earned by playing only. They can never be bought with money and never turn into cash, Gold Stars
// or anything sold in the store, so nothing here is gambling with real value. Every balance lives on this server, so a
// player can't edit theirs. Each stock's price follows how many shares all players hold together: buying pushes the
// price up for everyone, selling pushes it down, so players' trades move each other's portfolios.
//
// POST /api/hs  { op, ... }   ops: join, me, market, trade, earn, top
// Every op except join/market/top needs { id, tok } (the secret the server gave this browser on join).

const STOCKS = {
  PIZZA: { name: 'Cafeteria Pizza', icon: '🍕', base: 10, slope: 0.16 },
  BOOK: { name: 'Library Books', icon: '📚', base: 8, slope: 0.12 },
  GYM: { name: 'Gym Class', icon: '🏀', base: 12, slope: 0.2 },
  BAND: { name: 'Band Room', icon: '🎸', base: 9, slope: 0.14 },
  LAB: { name: 'Science Lab', icon: '🔬', base: 15, slope: 0.24 },
  BUS: { name: 'School Bus', icon: '🚌', base: 6, slope: 0.1 }
};
const START_HS = 100, DAY_CAP = 100, PER_RUN = 20, MAX_TRADE = 50, SELL_FEE = 0.02, JOINS_PER_IP_DAY = 3;
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const day = () => Math.floor(Date.now() / 86400000);
const hour = () => Math.floor(Date.now() / 3600000);
const price = (sym, s) => STOCKS[sym].base + STOCKS[sym].slope * s;
// cost of moving supply from s by n shares (sum of the price of each share on the way)
const span = (sym, s, n) => n * STOCKS[sym].base + STOCKS[sym].slope * (n * s + n * (n - 1) / 2);
const BAD = /(fuck|shit|cunt|nigg|fag|bitch|whore|slut|penis|vagina|porn|nazi|hitler|pussy|dildo|retard|rape|molest|bastard|asshole|jizz|cock|wanker|twat|blowjob|horny|sexy|nude|naked|kkk|pedo|onlyfans|instagram|snapchat|tiktok|discord)/;
function okName(n) {
  n = String(n || '').trim();
  if (!/^[A-Za-z0-9 ._'-]{1,14}$/.test(n) || /[0-9]{6,}/.test(n)) return 'Runner';
  const flat = n.toLowerCase().replace(/0/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[4@]/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't').replace(/[^a-z]/g, '');
  return BAD.test(flat) ? 'Runner' : n;
}
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
const rnd = n => [...crypto.getRandomValues(new Uint8Array(n))].map(x => x.toString(16).padStart(2, '0')).join('');

let ready = false;
async function setup(db) {
  if (ready) return;
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS acct (id TEXT PRIMARY KEY, tok TEXT NOT NULL, name TEXT NOT NULL, hs INTEGER NOT NULL CHECK (hs >= 0), created INTEGER, eday INTEGER, earned INTEGER, last INTEGER)'),
    db.prepare('CREATE TABLE IF NOT EXISTS hold (acct TEXT NOT NULL, sym TEXT NOT NULL, n INTEGER NOT NULL CHECK (n >= 0), PRIMARY KEY (acct, sym))'),
    db.prepare('CREATE TABLE IF NOT EXISTS stock (sym TEXT PRIMARY KEY, supply INTEGER NOT NULL CHECK (supply >= 0))'),
    db.prepare('CREATE TABLE IF NOT EXISTS hist (sym TEXT NOT NULL, h INTEGER NOT NULL, p REAL NOT NULL, PRIMARY KEY (sym, h))'),
    db.prepare('CREATE TABLE IF NOT EXISTS ipday (ip TEXT NOT NULL, d INTEGER NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (ip, d))'),
    db.prepare('CREATE TABLE IF NOT EXISTS guard (x INTEGER CHECK (x = 0))') // inserting 1 here fails the whole batch
  ].concat(Object.keys(STOCKS).map(s => db.prepare('INSERT OR IGNORE INTO stock (sym, supply) VALUES (?, 0)').bind(s))));
  ready = true;
}
async function auth(db, b) {
  const id = String(b.id || ''), tok = String(b.tok || '');
  if (!/^[a-f0-9]{24}$/.test(id) || !/^[a-f0-9]{48}$/.test(tok)) return null;
  const a = await db.prepare('SELECT * FROM acct WHERE id = ?').bind(id).first();
  return a && a.tok === await sha(tok) ? a : null;
}
async function market(db) {
  const rows = (await db.prepare('SELECT sym, supply FROM stock').all()).results, h0 = hour() - 24;
  const old = (await db.prepare('SELECT sym, p FROM hist WHERE h <= ? AND h > ? ORDER BY h ASC').bind(h0, h0 - 48).all()).results;
  const spark = (await db.prepare('SELECT sym, h, p FROM hist WHERE h > ? ORDER BY h ASC').bind(h0).all()).results;
  const out = {};
  for (const r of rows) if (STOCKS[r.sym]) {
    const S = STOCKS[r.sym], p = price(r.sym, r.supply), o = old.filter(x => x.sym === r.sym).pop();
    out[r.sym] = { name: S.name, icon: S.icon, supply: r.supply, price: Math.round(p * 100) / 100, buy: Math.ceil(span(r.sym, r.supply, 1)), sell: Math.floor(span(r.sym, r.supply - 1, 1) * (1 - SELL_FEE)),
      ch: o ? Math.round((p / o.p - 1) * 1000) / 10 : 0, spark: spark.filter(x => x.sym === r.sym).map(x => Math.round(x.p * 100) / 100) };
  }
  return out;
}
async function me(db, a) {
  const hold = (await db.prepare('SELECT sym, n FROM hold WHERE acct = ? AND n > 0').bind(a.id).all()).results, m = await market(db);
  let worth = a.hs; for (const h of hold) if (m[h.sym]) worth += Math.floor(span(h.sym, m[h.sym].supply - h.n, h.n) * (1 - SELL_FEE));
  const left = a.eday === day() ? Math.max(0, DAY_CAP - a.earned) : DAY_CAP;
  return { name: a.name, hs: a.hs, hold: Object.fromEntries(hold.map(h => [h.sym, h.n])), worth, earnLeft: left, market: m };
}

export async function onRequestPost({ request, env }) {
  const db = env.HALL_DB; if (!db) return json({ error: 'setup', msg: 'Hall Shares is opening soon' }, 503);
  let b; try { b = await request.json(); } catch (e) { return json({ error: 'Bad request' }, 400); }
  try {
    await setup(db);
    const op = String(b.op || '');
    if (op === 'market') return json({ market: await market(db) });
    if (op === 'top') {
      const rows = (await db.prepare('SELECT id, name, hs FROM acct ORDER BY hs DESC LIMIT 200').all()).results, m = await market(db);
      const holds = rows.length ? (await db.prepare('SELECT acct, sym, n FROM hold WHERE n > 0 AND acct IN (' + rows.map(() => '?').join(',') + ')').bind(...rows.map(r => r.id)).all()).results : [];
      const worth = r => r.hs + holds.filter(h => h.acct === r.id && m[h.sym]).reduce((t, h) => t + Math.floor(span(h.sym, m[h.sym].supply - h.n, h.n) * (1 - SELL_FEE)), 0);
      return json({ top: rows.map(r => ({ n: r.name, w: worth(r), me: r.id === b.id })).sort((x, y) => y.w - x.w).slice(0, 20) });
    }
    if (op === 'join') {
      const ip = await sha('ip:' + (request.headers.get('CF-Connecting-IP') || 'none')), d = day();
      const used = await db.prepare('SELECT n FROM ipday WHERE ip = ? AND d = ?').bind(ip, d).first();
      if (used && used.n >= JOINS_PER_IP_DAY) return json({ error: 'Too many new accounts from here today. Try again tomorrow.' }, 429);
      const id = rnd(12), tok = rnd(24);
      await db.batch([
        db.prepare('INSERT INTO acct (id, tok, name, hs, created, eday, earned, last) VALUES (?, ?, ?, ?, ?, ?, 0, 0)').bind(id, await sha(tok), okName(b.name), START_HS, Date.now(), d),
        db.prepare('INSERT INTO ipday (ip, d, n) VALUES (?, ?, 1) ON CONFLICT (ip, d) DO UPDATE SET n = n + 1').bind(ip, d)
      ]);
      return json({ id, tok, hs: START_HS });
    }
    const a = await auth(db, b); if (!a) return json({ error: 'auth' }, 401);
    if (op === 'me') { if (b.name !== undefined && okName(b.name) !== a.name) { a.name = okName(b.name); await db.prepare('UPDATE acct SET name = ? WHERE id = ?').bind(a.name, a.id).run(); } return json(await me(db, a)); }
    if (op === 'earn') { // one finished run: up to 20 HS (1 per 100 m), 100 a day, at most one run every 25 seconds
      const d = day(), now = Date.now(), dist = Math.max(0, Math.min(20000, Math.floor(+b.dist || 0)));
      const earned = a.eday === d ? a.earned : 0, got = Math.min(PER_RUN, Math.floor(dist / 100), DAY_CAP - earned);
      if (got <= 0 || now - (a.last || 0) < 25000) return json({ got: 0, earnLeft: Math.max(0, DAY_CAP - earned) });
      const r = await db.prepare('UPDATE acct SET hs = hs + ?, eday = ?, earned = ?, last = ? WHERE id = ? AND (last IS NULL OR last < ?)').bind(got, d, earned + got, now, a.id, now - 25000).run();
      if (!r.meta || !r.meta.changes) return json({ got: 0, earnLeft: Math.max(0, DAY_CAP - earned) });
      return json({ got, earnLeft: DAY_CAP - earned - got });
    }
    if (op === 'trade') {
      const sym = String(b.sym || ''), n = Math.floor(+b.n || 0); if (!STOCKS[sym] || !n || Math.abs(n) > MAX_TRADE) return json({ error: 'Bad trade' }, 400);
      for (let tries = 0; tries < 3; tries++) {
        const st = await db.prepare('SELECT supply FROM stock WHERE sym = ?').bind(sym).first(), s = st.supply;
        if (n < 0) { const h = await db.prepare('SELECT n FROM hold WHERE acct = ? AND sym = ?').bind(a.id, sym).first(); if (!h || h.n < -n || s + n < 0) return json({ error: 'You don\'t have that many shares' }, 400); }
        const cost = n > 0 ? Math.ceil(span(sym, s, n)) : -Math.floor(span(sym, s + n, -n) * (1 - SELL_FEE)); // sells pay a 2% fee
        try {
          await db.batch([
            db.prepare('INSERT INTO guard (x) SELECT 1 WHERE (SELECT supply FROM stock WHERE sym = ?) != ?').bind(sym, s), // someone traded first: retry
            db.prepare('UPDATE stock SET supply = supply + ? WHERE sym = ?').bind(n, sym),
            db.prepare('UPDATE acct SET hs = hs - ? WHERE id = ?').bind(cost, a.id), // CHECK (hs >= 0) stops overspending
            n > 0 ? db.prepare('INSERT INTO hold (acct, sym, n) VALUES (?, ?, ?) ON CONFLICT (acct, sym) DO UPDATE SET n = n + excluded.n').bind(a.id, sym, n)
              : db.prepare('UPDATE hold SET n = n + ? WHERE acct = ? AND sym = ?').bind(n, a.id, sym), // CHECK (n >= 0) stops overselling
            db.prepare('INSERT INTO hist (sym, h, p) VALUES (?, ?, ?) ON CONFLICT (sym, h) DO UPDATE SET p = excluded.p').bind(sym, hour(), price(sym, s + n))
          ]);
          const a2 = await db.prepare('SELECT * FROM acct WHERE id = ?').bind(a.id).first();
          return json(Object.assign({ ok: true, cost }, await me(db, a2)));
        } catch (e) {
          const msg = String(e && e.message || e);
          if (/x = 0|guard/i.test(msg)) continue;
          if (/CHECK/i.test(msg)) return json({ error: n > 0 ? 'Not enough Hall Shares' : 'You don\'t have that many shares' }, 400);
          throw e;
        }
      }
      return json({ error: 'The market is busy, try again' }, 409);
    }
    return json({ error: 'Unknown op' }, 400);
  } catch (e) { return json({ error: 'Server error' }, 500); }
}
export const onRequest = () => json({ error: 'Use POST' }, 405);

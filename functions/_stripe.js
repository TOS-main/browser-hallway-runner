// Shared helpers for the website's card checkout (Cloudflare Pages Functions + Stripe Checkout).
// Needs one setting in Cloudflare: Pages project -> Settings -> Variables and Secrets -> STRIPE_SECRET_KEY (sk_live_... or sk_test_...).
// Prices live here on the server, so a player can't change what they pay.
export const ITEMS = {
  starter_pack: { cents: 99, name: 'Starter Pack', desc: '$12,000 cash, 5 Heel Wheels, 15 Outfit Tokens, no ads between runs' },
  no_ads: { cents: 199, name: 'No Ads', desc: 'No ads between runs, forever' },
  coin_doubler: { cents: 299, name: 'Coin Doubler', desc: 'Every coin counts twice, forever' },
  pass_gold: { cents: 299, name: 'Gold Track', desc: "A second reward on every tier of this season's School Year Pass" },
  coins_2: { cents: 199, name: '$30K Cash', desc: '30,000 in-game cash' },
  coins_3: { cents: 399, name: '$75K Cash', desc: '75,000 in-game cash' },
  coins_4: { cents: 799, name: '$180K Cash', desc: '180,000 in-game cash' },
  stars_2: { cents: 199, name: '25 Gold Stars', desc: '25 Gold Stars' },
  stars_3: { cents: 399, name: '60 Gold Stars', desc: '60 Gold Stars' }
};
export const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export async function stripe(env, method, path, form) {
  const r = await fetch('https://api.stripe.com/v1/' + path, {
    method, headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form ? new URLSearchParams(form).toString() : undefined
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Stripe error ' + r.status);
  return j;
}
export const cleanPid = s => String(s || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 40);

// GET /api/verify?session_id=cs_...&pid=... -> {paid, sku}
// Asks Stripe whether this checkout was really paid. The first player save that claims it is written on the payment, so
// the same receipt link can't be reused to unlock items on other saves (the same save can check again safely).
import { ITEMS, json, stripe, cleanPid } from '../_stripe.js';
export async function onRequestGet({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Card payments are not set up yet' }, 503);
  const q = new URL(request.url).searchParams, id = String(q.get('session_id') || ''), pid = cleanPid(q.get('pid'));
  if (!/^cs_[A-Za-z0-9_]{8,200}$/.test(id)) return json({ error: 'Bad session' }, 400);
  try {
    const s = await stripe(env, 'GET', 'checkout/sessions/' + encodeURIComponent(id));
    const sku = s.metadata && s.metadata.sku;
    if (s.payment_status !== 'paid' || !ITEMS[sku]) return json({ paid: false, error: 'This payment is not complete' }, 402);
    if (s.payment_intent) {
      const pi = await stripe(env, 'GET', 'payment_intents/' + encodeURIComponent(s.payment_intent));
      const claimed = pi.metadata && pi.metadata.claimed_by;
      if (claimed && pid && claimed !== pid) return json({ paid: false, error: 'This purchase was already added to another save' }, 409);
      if (!claimed && pid) await stripe(env, 'POST', 'payment_intents/' + encodeURIComponent(s.payment_intent), { 'metadata[claimed_by]': pid });
    }
    return json({ paid: true, sku });
  } catch (e) { return json({ error: 'Could not check the payment right now' }, 502); }
}
export const onRequest = () => json({ error: 'Use GET' }, 405);

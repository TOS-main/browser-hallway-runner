// POST /api/checkout {sku, pid} -> {url}: a Stripe Checkout page for one store item.
import { ITEMS, json, stripe, cleanPid } from '../_stripe.js';
export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Card payments are not set up yet' }, 503);
  let body = {}; try { body = await request.json(); } catch (e) {}
  const sku = String(body.sku || ''), item = ITEMS[sku], pid = cleanPid(body.pid);
  if (!item) return json({ error: 'Unknown item' }, 400);
  const origin = new URL(request.url).origin;
  try {
    const s = await stripe(env, 'POST', 'checkout/sessions', {
      mode: 'payment',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': String(item.cents),
      'line_items[0][price_data][product_data][name]': 'Hallway Dash: ' + item.name,
      'line_items[0][price_data][product_data][description]': item.desc,
      'metadata[sku]': sku, 'metadata[pid]': pid,
      'payment_intent_data[metadata][sku]': sku, 'payment_intent_data[metadata][pid]': pid,
      success_url: origin + '/?paid={CHECKOUT_SESSION_ID}',
      cancel_url: origin + '/?paid=cancel'
    });
    return json({ url: s.url });
  } catch (e) { return json({ error: 'Checkout is not available right now' }, 502); }
}
export const onRequest = () => json({ error: 'Use POST' }, 405);

// src/utils.js — All helper and analytics functions
import { CARD_DB, MARKET_PULSE } from './data.js';

// ─── FORMATTING ───────────────────────────────────────────────────────────────
export const CURRENCIES = {
  USD: { symbol: '$',    rate: 1 },
  EUR: { symbol: '€',   rate: 0.92 },
  GBP: { symbol: '£',   rate: 0.79 },
  JPY: { symbol: '¥',   rate: 149.5 },
  CAD: { symbol: 'CA$', rate: 1.36 },
  AUD: { symbol: 'A$',  rate: 1.53 },
};

export const fmtAmt = (n, currency = 'USD') => {
  if (n == null) return '—';
  const { symbol, rate } = CURRENCIES[currency] || CURRENCIES.USD;
  const converted = Math.round(n * rate);
  return symbol + converted.toLocaleString();
};

export const fmt       = n => n == null ? '—' : '$' + Math.round(n).toLocaleString();
export const fmtPct    = n => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
export const cx        = (...xs) => xs.filter(Boolean).join(' ');
export const todayStr  = () => new Date().toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);

// ─── CARD HELPERS ─────────────────────────────────────────────────────────────
export const getLots = c =>
  c.lots?.length ? c.lots
  : c.acquiredPrice != null ? [{ id:'leg', price:c.acquiredPrice, date:c.acquiredDate, qty:1 }]
  : [];

export const getTotalQty  = c => getLots(c).reduce((s, l) => s + (l.qty || 1), 0);
export const getTotalCost = c => getLots(c).reduce((s, l) => s + l.price * (l.qty || 1), 0);
export const getBlended   = c => { const q = getTotalQty(c); return q > 0 ? getTotalCost(c) / q : 0; };
export const getFirstDate = c => { const d = getLots(c).map(l => l.date).filter(Boolean).sort(); return d[0] || null; };

export const getCardValue = c => {
  const db = CARD_DB[c.dbId]; if (!db) return 0;
  return c.condition.startsWith('PSA')
    ? db.pricing.psa[parseInt(c.condition.replace('PSA', ''), 10)] || db.pricing.raw.NM
    : db.pricing.raw[c.condition] || db.pricing.raw.NM;
};

export const wantlistPrice = w => {
  const db = CARD_DB[w.dbId]; if (!db) return 0;
  return w.condition.startsWith('PSA')
    ? db.pricing.psa[parseInt(w.condition.slice(3), 10)] || db.pricing.raw.NM
    : db.pricing.raw[w.condition] || db.pricing.raw.NM;
};

export const unrealizedPL = c => {
  const cur = getCardValue(c), qty = getTotalQty(c), cost = getTotalCost(c), mkt = cur * qty;
  return { absolute: mkt - cost, pct: cost ? ((mkt - cost) / cost) * 100 : 0, current: cur, totalMarket: mkt, totalCost: cost, qty };
};

export const realizedPL = c => {
  if (c.status !== 'sold') return null;
  const qty = getTotalQty(c), cost = getTotalCost(c), proceeds = c.sellPrice * qty;
  return { absolute: proceeds - cost, pct: cost ? ((proceeds - cost) / cost) * 100 : 0, qty, totalCost: cost, totalProceeds: proceeds };
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
const seededRand = seed => {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
};

export const generateHistory = (card, days = 365) => {
  const db = CARD_DB[card.dbId]; if (!db) return [];
  const rand = seededRand(card.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const target = getCardValue(card);
  let price = target * (db.trend === 'up' ? 0.72 : 1.18);
  const tMult = db.trend === 'up' ? 1 : -1;
  const out = [];
  for (let i = days; i >= 0; i--) {
    price = Math.max(1, price + (rand() - 0.5) * db.volatility * price * 0.12 + tMult * db.volatility * price * 0.003);
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0, 10), price: Math.round(price * 100) / 100 });
  }
  const scale = target / out[out.length - 1].price;
  return out.map(p => ({ ...p, price: Math.round(p.price * scale * 100) / 100 }));
};

export const card24hDelta = card => {
  const h = generateHistory(card, 365);
  if (h.length < 2) return { abs: 0, pct: 0 };
  const cur = h[h.length - 1].price, prev = h[h.length - 2].price;
  return { abs: cur - prev, pct: prev ? ((cur - prev) / prev) * 100 : 0 };
};

export const calcRSI = (h, p = 14) => {
  if (h.length < p + 1) return 50;
  let g = 0, l = 0;
  for (let i = h.length - p; i < h.length; i++) {
    const d = h[i].price - h[i - 1].price;
    if (d > 0) g += d; else l -= d;
  }
  const ag = g / p, al = l / p;
  if (al === 0) return 100;
  return Math.round(100 - 100 / (1 + ag / al));
};

export const calcMomentum = (h, d = 30) =>
  h.length < d ? 0 : ((h[h.length - 1].price - h[h.length - d].price) / h[h.length - d].price) * 100;

export const calcVolatility = (h, d = 30) => {
  if (h.length < d) return 0;
  const sl = h.slice(-d), rets = sl.slice(1).map((p, i) => (p.price - sl[i].price) / sl[i].price);
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  return Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length) * Math.sqrt(365) * 100;
};

export const calcLiquidity = db => {
  if (!db?.sold30d || !db?.listed) return { score: 0, band: 'unknown' };
  const score = Math.round(Math.min(100, Math.min(db.sold30d / 5, 100) * 0.6 + (db.sold30d / db.listed) * 100 * 0.8));
  const band = score >= 70 ? 'deep' : score >= 40 ? 'liquid' : score >= 20 ? 'moderate' : 'thin';
  return { score, band };
};

export const calcMarketCap = db => db?.pop10 && db?.pricing?.psa?.[10] ? db.pop10 * db.pricing.psa[10] : null;
export const calcSpread    = db => {
  if (!db?.pricing?.tcg) return null;
  const lo = db.pricing.tcg * 0.85, hi = db.pricing.tcg * 1.18;
  return { low: lo, high: hi, pct: ((hi - lo) / db.pricing.tcg) * 100 };
};

export const LIQ_COLORS = { deep:'text-emerald-400', liquid:'text-cyan-400', moderate:'text-amber-400', thin:'text-red-400', unknown:'text-zinc-400' };

export const gradeProbDist = pg => {
  const { centering = 8, surface = 8, edges = 8, corners = 8 } = pg || {};
  const eff = Math.min((centering + surface + edges + corners) / 4, Math.min(centering, surface, edges, corners) + 0.5);
  const d = { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0 };
  if      (eff >= 9.3) { d[10]=0.55; d[9]=0.35; d[8]=0.08; d[7]=0.02; }
  else if (eff >= 8.7) { d[10]=0.25; d[9]=0.50; d[8]=0.20; d[7]=0.05; }
  else if (eff >= 8.0) { d[10]=0.08; d[9]=0.35; d[8]=0.40; d[7]=0.15; d[6]=0.02; }
  else if (eff >= 7.0) { d[10]=0.02; d[9]=0.12; d[8]=0.38; d[7]=0.35; d[6]=0.13; }
  else                  { d[9]=0.05; d[8]=0.20; d[7]=0.40; d[6]=0.35; }
  return d;
};

export const calcGradeROI = (card, preGrade, tier = 'value') => {
  const db = CARD_DB[card.dbId], raw = getCardValue(card);
  const cost = { economy: 19, value: 39, regular: 85, express: 175 }[tier];
  const dist = gradeProbDist(preGrade);
  let ev = 0; const bd = [];
  Object.keys(dist).forEach(g => {
    const p = dist[g], pr = db.pricing.psa[g] || raw * 0.5;
    ev += p * pr;
    if (p > 0) bd.push({ grade: g, prob: p, price: pr, contribution: p * pr });
  });
  return { raw, ev: Math.round(ev), netEV: Math.round(ev - cost), delta: Math.round(ev - cost - raw), tierCost: cost, breakdown: bd };
};

// ─── AI INSIGHTS (rule-based) ─────────────────────────────────────────────────
import { AlertCircle, Trophy, Timer, TrendingUp } from 'lucide-react';

const INS_STYLES = {
  warning:     { bg:'from-amber-500/10',   border:'border-amber-500/25',   icon:'text-amber-400 bg-amber-500/15' },
  opportunity: { bg:'from-emerald-500/10', border:'border-emerald-500/25', icon:'text-emerald-400 bg-emerald-500/15' },
  milestone:   { bg:'from-purple-500/10',  border:'border-purple-500/25',  icon:'text-purple-400 bg-purple-500/15' },
};
export { INS_STYLES };

export const genInsights = cards => {
  const ins = [];
  const holdings = cards.filter(c => c.status === 'holding');
  const sold = cards.filter(c => c.status === 'sold');
  const tv = holdings.reduce((s, c) => s + getCardValue(c) * getTotalQty(c), 0);

  if (tv > 0) {
    const top = [...holdings].sort((a, b) => getCardValue(b) * getTotalQty(b) - getCardValue(a) * getTotalQty(a))[0];
    const w = getCardValue(top) * getTotalQty(top) / tv;
    if (w > 0.25) ins.push({ id:'conc', type:'warning', icon:AlertCircle, title:'Concentration risk', body:`${CARD_DB[top.dbId].name} is ${(w * 100).toFixed(0)}% of your portfolio.`, cardId:top.id });
  }
  const winners = sold.filter(c => realizedPL(c).absolute > 0);
  const wr = sold.length ? winners.length / sold.length : 0;
  if (sold.length >= 3 && wr >= 0.75) ins.push({ id:'wr', type:'milestone', icon:Trophy, title:`${(wr * 100).toFixed(0)}% win rate`, body:`Profitable on ${winners.length} of ${sold.length} closed positions.` });

  const losers = holdings.filter(c => { const g = unrealizedPL(c), d = getFirstDate(c); return g.pct < -10 && d && daysBetween(d, todayStr()) > 180; });
  if (losers.length > 0) {
    const w2 = [...losers].sort((a, b) => unrealizedPL(a).pct - unrealizedPL(b).pct)[0];
    const g = unrealizedPL(w2);
    ins.push({ id:'loser', type:'warning', icon:Timer, title:'Long-held underperformer', body:`${CARD_DB[w2.dbId].name} is down ${fmtPct(g.pct)} after ${daysBetween(getFirstDate(w2), todayStr())} days.`, cardId:w2.id });
  }
  const trending = holdings.find(c => MARKET_PULSE[c.dbId]?.change7d > 8);
  if (trending) {
    const db = CARD_DB[trending.dbId], p = MARKET_PULSE[trending.dbId];
    ins.push({ id:'trend', type:'opportunity', icon:TrendingUp, title:`${db.name} is running`, body:`${p.summary.split('.')[0]}. You own ${getTotalQty(trending)} — consider setting a profit-take alert.`, cardId:trending.id });
  }
  return ins.slice(0, 4);
};

// ─── TRADE HELPERS (module-level for stable references) ───────────────────────
export const BLANK_TC = () => ({ id: 'tc-' + Date.now() + Math.random(), dbId: '', condition: 'NM', customPrice: '' });

export const tradeCardVal = c => {
  if (c.customPrice !== '') return parseFloat(c.customPrice) || 0;
  if (!c.dbId) return 0;
  const db = CARD_DB[c.dbId]; if (!db) return 0;
  return c.condition.startsWith('PSA')
    ? db.pricing.psa[parseInt(c.condition.slice(3), 10)] || db.pricing.raw.NM
    : db.pricing.raw[c.condition] || db.pricing.raw.NM;
};

export const tradeSideTotal = s => {
  const cv = s.cards.reduce((x, c) => x + tradeCardVal(c), 0);
  return { cv, adj: cv * (parseFloat(s.pct) / 100 || 1) + (parseFloat(s.cash) || 0) };
};


// src/components/modals.jsx
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, ReferenceLine, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Plus, X, Bell, DollarSign, Calculator, Archive, CircleDot, Check, AlertCircle, Trash2, Layers, Search, Heart, ShoppingBag, PenLine, Brain, Sparkles, Droplet, Coins, Activity, ChevronRight, Settings, Sun, Moon, Download, Upload, RotateCcw } from 'lucide-react';
import { CARD_DB, SEALED_DB, DRIVER_LABELS, MARKET_PULSE, ALL_CONDITIONS, RAW_CONDITIONS, LINE_COLORS } from '../data.js';
import { fmt, fmtPct, cx, todayStr, getCardValue, getTotalQty, getTotalCost, getBlended, getLots, unrealizedPL, realizedPL, wantlistPrice, calcLiquidity, calcMarketCap, calcSpread, calcRSI, calcVolatility, calcGradeROI, gradeProbDist, LIQ_COLORS, CURRENCIES } from '../utils.js';
import { CardImg, SealedTile } from './ui.jsx';
import { generateHistory } from '../utils.js';

// ─── GRADING SERVICE DATA ─────────────────────────────────────────────────────
const GRADERS = [
  { name:'PSA', color:'text-blue-400',    bg:'bg-blue-500/10',    border:'border-blue-500/20',
    tiers:[{l:'Economy',fee:19},{l:'Value',fee:39},{l:'Regular',fee:85},{l:'Express',fee:175}], mult:1.0 },
  { name:'BGS', color:'text-purple-400',  bg:'bg-purple-500/10',  border:'border-purple-500/20',
    tiers:[{l:'Economy',fee:24},{l:'Value',fee:50},{l:'Regular',fee:100},{l:'Express',fee:200}], mult:0.88 },
  { name:'CGC', color:'text-emerald-400', bg:'bg-emerald-500/10', border:'border-emerald-500/20',
    tiers:[{l:'Economy',fee:14},{l:'Standard',fee:35},{l:'Express',fee:75},{l:'Walk-thru',fee:150}], mult:0.75 },
  { name:'TAG', color:'text-amber-400',   bg:'bg-amber-500/10',   border:'border-amber-500/20',
    tiers:[{l:'Economy',fee:15},{l:'Standard',fee:35},{l:'Express',fee:75}], mult:0.72 },
];

// ─── CARD DETAIL MODAL ────────────────────────────────────────────────────────
export function CardDetailModal({ cardId, cards, lines, alerts, onClose, onGradeROI, onSell, onBuyMore, onAddLine, onRemoveLine, onAddAlert, onDelete }) {
  const [tab, setTab] = useState('overview');
  const [priceTab, setPriceTab] = useState('ebay');
  const [activeLines, setActiveLines] = useState(['raw', 'psa10']);
  const card = cards.find(c => c.id === cardId); if (!card) return null;
  const db=CARD_DB[card.dbId], g=unrealizedPL(card);
  const hist=useMemo(()=>generateHistory(card),[card.id]);
  const h90=hist.slice(-90), cardLines=lines[card.id]||[], cardAlerts=alerts.filter(a=>a.cardId===card.id);
  const isSold=card.status==='sold', lots=getLots(card), blended=getBlended(card), qty=getTotalQty(card);
  const liq=calcLiquidity(db), mktCap=calcMarketCap(db), spread=calcSpread(db), pulse=MARKET_PULSE[card.dbId];
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full my-auto overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 bg-gradient-to-br from-zinc-950 to-zinc-900 p-5 flex items-center justify-center relative">
            <button onClick={onClose} className="absolute top-3 right-3 md:hidden w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button>
            <CardImg dbId={card.dbId} className="w-full max-w-[220px]"/>
          </div>
          <div className="flex-1 p-5 md:p-6 overflow-y-auto max-h-[85vh]">
            <div className="flex items-start justify-between mb-4">
              <div><div className="text-xs text-zinc-500 uppercase tracking-wider">{db.set} · {db.number}</div><div className="text-2xl font-bold text-white mt-1">{db.name}</div><div className="flex items-center gap-2 mt-1.5 flex-wrap"><span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">{db.rarity}</span><span className="text-[10px] font-bold text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded">{card.condition}</span>{isSold&&<span className="text-[10px] font-bold text-red-300 bg-red-500/15 px-1.5 py-0.5 rounded">SOLD</span>}</div></div>
              <button onClick={onClose} className="hidden md:flex w-8 h-8 rounded-full bg-zinc-800 items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button>
            </div>
            <div className="flex gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 mb-4">
              {[{id:'overview',label:'Overview'},{id:'pricing',label:'Pricing'},{id:'chart',label:'Chart'},...(!isSold&&!card.condition.startsWith('PSA')?[{id:'grading',label:'Grading'}]:[])].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} className={cx('flex-1 px-2 py-1.5 text-xs font-semibold rounded transition',tab===t.id?'bg-zinc-800 text-white':'text-zinc-500 hover:text-zinc-300')}>{t.label}</button>
              ))}
            </div>

            {tab==='overview'&&(<>
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 mb-4">
                <div className="flex items-center justify-between mb-1"><div className="text-xs text-zinc-500 uppercase tracking-wider">{isSold?'Sold Price':'Current Value'}</div>{qty>1&&<div className="text-[10px] font-bold text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded">× {qty}</div>}</div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <div className="text-3xl font-bold text-white">{fmt(isSold?card.sellPrice*qty:g.totalMarket)}</div>
                  {!isSold&&<div className={cx('text-sm font-semibold',g.pct>=0?'text-emerald-400':'text-red-400')}>{g.absolute>=0?'+':''}{fmt(g.absolute)} ({fmtPct(g.pct)})</div>}
                  {isSold&&(()=>{const r=realizedPL(card);return<div className={cx('text-sm font-semibold',r.absolute>=0?'text-emerald-400':'text-red-400')}>Realized {r.absolute>=0?'+':''}{fmt(r.absolute)} ({fmtPct(r.pct)})</div>;})()}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">{lots.length===1?'Acquired '+fmt(blended)+' · '+lots[0].date:'Blended cost '+fmt(blended)+' across '+qty+' lots'}{isSold&&' · Sold '+card.sellDate}</div>
                {!isSold&&lots.length>1&&(<details className="mt-3 pt-3 border-t border-zinc-800"><summary className="text-[11px] text-zinc-400 cursor-pointer font-semibold">View lot breakdown ↓</summary><div className="mt-2 space-y-1.5">{lots.map((lot,i)=>{const cur=getCardValue(card),lotQ=lot.qty||1,lotPL=(cur-lot.price)*lotQ,lotPct=((cur-lot.price)/lot.price)*100;return(<div key={lot.id} className="flex items-center justify-between text-[11px] tabular-nums"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center text-[9px] font-bold">{i+1}</div><span className="text-zinc-400">{lot.date}</span><span className="text-zinc-300">{lotQ>1?lotQ+'× @ '+fmt(lot.price):fmt(lot.price)}</span></div><div className={cx('font-semibold',lotPL>=0?'text-emerald-400':'text-red-400')}>{lotPL>=0?'+':''}{fmt(lotPL)} ({fmtPct(lotPct)})</div></div>);})}</div></details>)}
              </div>
              {pulse&&(<div className="bg-gradient-to-br from-purple-500/10 via-zinc-950 to-zinc-950 border border-purple-500/30 rounded-xl p-4 mb-4"><div className="flex items-start gap-3"><div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0"><Brain className="w-4 h-4 text-purple-300"/></div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1 flex-wrap"><div className="text-xs font-bold text-purple-300 uppercase tracking-wider">Why this moved</div><div className={cx('text-[11px] font-bold',pulse.change7d>=0?'text-emerald-400':'text-red-400')}>{fmtPct(pulse.change7d)} 7d</div><div className={cx('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase',DRIVER_LABELS[pulse.driver].color)}>{DRIVER_LABELS[pulse.driver].label}</div></div><div className="text-xs text-zinc-300 leading-relaxed">{pulse.summary}</div></div></div></div>)}
              {/* Grade ROI teaser — only for raw, non-sold cards */}
              {!isSold&&!card.condition.startsWith('PSA')&&(()=>{
                const roi=calcGradeROI(card,{centering:8.5,surface:9,edges:8.5,corners:8.5},'value');
                const rec=roi.delta>40,marg=roi.delta>0&&roi.delta<=40;
                return(
                  <div onClick={()=>setTab('grading')} className={cx('rounded-xl p-3 border mb-4 flex items-center gap-3 cursor-pointer transition hover:brightness-110',rec?'bg-emerald-500/[0.08] border-emerald-500/30':marg?'bg-amber-500/[0.08] border-amber-500/30':'bg-zinc-950 border-zinc-800')}>
                    <div className={cx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',rec?'bg-emerald-500/20':marg?'bg-amber-500/20':'bg-zinc-800')}><Calculator className={cx('w-4 h-4',rec?'text-emerald-400':marg?'text-amber-400':'text-zinc-500')}/></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Grading ROI Preview</div>
                      <div className={cx('text-sm font-bold mt-0.5',rec?'text-emerald-300':marg?'text-amber-300':'text-zinc-300')}>{rec?'Worth grading':marg?'Marginal — your call':'Keep raw'} · PSA Value → {roi.delta>=0?'+':''}{fmt(roi.delta)} est.</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 flex-shrink-0"/>
                  </div>
                );
              })()}
              <div className="mb-4"><div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">Market Metrics</div><div className="grid grid-cols-3 gap-2">
                <div className={cx('bg-zinc-950 border rounded-lg p-2.5',liq.band==='deep'?'border-emerald-500/30':liq.band==='thin'?'border-red-500/30':'border-zinc-800')}><div className="flex items-center gap-1 mb-1"><Droplet className="w-3 h-3 text-zinc-500"/><div className="text-[9px] text-zinc-500 uppercase font-semibold">Liquidity</div></div><div className="text-base font-bold text-white">{liq.score}<span className="text-[10px] text-zinc-500">/100</span></div><div className={cx('text-[10px] font-semibold uppercase',LIQ_COLORS[liq.band])}>{liq.band}</div><div className="text-[10px] text-zinc-500">{db.sold30d} sold/30d</div></div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5"><div className="flex items-center gap-1 mb-1"><Coins className="w-3 h-3 text-zinc-500"/><div className="text-[9px] text-zinc-500 uppercase font-semibold">Mkt Cap PSA10</div></div><div className="text-base font-bold text-white">{mktCap?(mktCap>=1e6?'$'+(mktCap/1e6).toFixed(1)+'M':'$'+Math.round(mktCap/1000)+'K'):'—'}</div><div className="text-[10px] text-zinc-500">pop {db.pop10?.toLocaleString()}</div></div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5"><div className="flex items-center gap-1 mb-1"><Activity className="w-3 h-3 text-zinc-500"/><div className="text-[9px] text-zinc-500 uppercase font-semibold">Spread</div></div><div className="text-base font-bold text-white">{spread?spread.pct.toFixed(1)+'%':'—'}</div><div className="text-[10px] text-zinc-500">{spread?fmt(spread.low)+'–'+fmt(spread.high):'—'}</div></div>
              </div></div>
            </>)}

            {tab==='pricing'&&(<div className="mb-4">
              <div className="flex gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1 mb-3">{[{id:'ebay',label:'eBay'},{id:'tcg',label:'TCGplayer'},{id:'graded',label:'Graded'}].map(t=>(<button key={t.id} onClick={()=>setPriceTab(t.id)} className={cx('flex-1 px-2 py-1.5 text-xs font-semibold rounded transition',priceTab===t.id?'bg-zinc-800 text-white':'text-zinc-500 hover:text-zinc-300')}>{t.label}</button>))}</div>
              <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-3">
                {priceTab==='ebay'&&<div className="grid grid-cols-3 sm:grid-cols-5 gap-2">{RAW_CONDITIONS.map(cond=><div key={cond} className={cx('p-2 rounded-lg text-center',card.condition===cond?'bg-emerald-500/10 border border-emerald-500/30':'bg-zinc-900')}><div className="text-[10px] text-zinc-500 uppercase">{cond}</div><div className="text-sm font-bold text-white">{fmt(db.pricing.raw[cond])}</div></div>)}</div>}
                {priceTab==='tcg'&&<div className="flex items-center justify-between p-2"><div><div className="text-[10px] text-zinc-500 uppercase">TCGplayer Market</div><div className="text-2xl font-bold text-white">{fmt(db.pricing.tcg)}</div></div><div className="text-[11px] text-zinc-500 text-right">Low: {fmt(db.pricing.tcg*0.85)}<br/>High: {fmt(db.pricing.tcg*0.18 + db.pricing.tcg)}</div></div>}
                {priceTab==='graded'&&(()=>{
                  const grades = Object.keys(db.pricing.psa).sort((a,b)=>b-a);
                  const services = [
                    { name:'PSA', color:'text-blue-400',    mult:1.00 },
                    { name:'BGS', color:'text-purple-400',  mult:0.88 },
                    { name:'CGC', color:'text-emerald-400', mult:0.75 },
                    { name:'TAG', color:'text-amber-400',   mult:0.72 },
                  ];
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            <th className="text-left text-zinc-500 font-semibold pb-2 pr-3 uppercase">Grade</th>
                            {services.map(s=><th key={s.name} className={cx('text-center font-bold pb-2 px-2', s.color)}>{s.name}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {grades.map(gr=>{
                            const psaPrice = db.pricing.psa[gr];
                            const isOwned = card.condition === 'PSA'+gr;
                            return (
                              <tr key={gr} className={cx('transition', isOwned && 'bg-emerald-500/5')}>
                                <td className={cx('py-2 pr-3 font-bold', isOwned?'text-emerald-400':'text-white')}>
                                  {isOwned && <span className="mr-1 text-emerald-500">▶</span>}{gr}
                                </td>
                                {services.map(s=>{
                                  const price = Math.round(psaPrice * s.mult);
                                  return <td key={s.name} className="py-2 px-2 text-center text-white font-semibold tabular-nums">{fmt(price)}</td>;
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] text-zinc-600">BGS / CGC / TAG estimated relative to PSA · PSA pricing is source data</div>
                    </div>
                  );
                })()}
              </div>
            </div>)}

            {tab==='chart'&&(()=>{
              const OVERLAYS = [
                { key:'raw',   label:'Raw',    color:'#34d399', dash:'' },
                { key:'psa10', label:'PSA 10', color:'#60a5fa', dash:'' },
                { key:'psa9',  label:'PSA 9',  color:'#818cf8', dash:'4 2' },
                { key:'bgs10', label:'BGS 10', color:'#c084fc', dash:'' },
                { key:'cgc10', label:'CGC 10', color:'#2dd4bf', dash:'4 2' },
                { key:'tag10', label:'TAG 10', color:'#fb923c', dash:'4 2' },
              ];
              const cur = g.current || 1;
              const ratios = {
                raw:   1,
                psa10: (db.pricing.psa?.[10] || cur) / cur,
                psa9:  (db.pricing.psa?.[9]  || cur) / cur,
              };
              ratios.bgs10 = ratios.psa10 * 0.88;
              ratios.cgc10 = ratios.psa10 * 0.75;
              ratios.tag10 = ratios.psa10 * 0.72;
              const chartData = h90.map(p => ({
                date:  p.date,
                raw:   Math.round(p.price),
                psa10: Math.round(p.price * ratios.psa10),
                psa9:  Math.round(p.price * ratios.psa9),
                bgs10: Math.round(p.price * ratios.bgs10),
                cgc10: Math.round(p.price * ratios.cgc10),
                tag10: Math.round(p.price * ratios.tag10),
              }));
              const toggleLine = key => setActiveLines(ls => ls.includes(key) ? ls.filter(x => x !== key) : [...ls, key]);
              return (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">90-Day Overlay</div>
                    <div className="text-[11px] text-zinc-400">RSI <span className="text-white font-semibold">{calcRSI(hist)}</span> · Vol <span className="text-white font-semibold">{calcVolatility(hist).toFixed(0)}%</span></div>
                  </div>
                  {/* Overlay toggles */}
                  <div className="text-[10px] text-zinc-600 mb-1.5">Tap a service to show or hide its price line</div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {OVERLAYS.map(o => (
                      <button key={o.key} onClick={() => toggleLine(o.key)}
                        className={cx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition border',
                          activeLines.includes(o.key) ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300')}>
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition" style={{background: activeLines.includes(o.key) ? o.color : '#3f3f46'}}/>
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <div className="h-52 bg-zinc-950 rounded-lg border border-zinc-800 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <YAxis hide domain={['auto','auto']}/>
                        <Tooltip
                          contentStyle={{background:'#18181b',border:'1px solid #3f3f46',borderRadius:'8px',padding:'8px 12px',fontSize:11}}
                          itemStyle={{padding:'1px 0'}}
                          formatter={(val, key) => [fmt(val), OVERLAYS.find(o=>o.key===key)?.label || key]}
                          labelFormatter={() => ''}
                        />
                        {OVERLAYS.map(o => activeLines.includes(o.key) ? (
                          <Line key={o.key} type="monotone" dataKey={o.key} stroke={o.color} strokeWidth={o.key==='raw'?2.5:1.5} dot={false} strokeDasharray={o.dash}/>
                        ) : null)}
                        {cardLines.map(l=><ReferenceLine key={l.id} y={l.price} stroke={LINE_COLORS[l.color].stroke} strokeDasharray="4 3" strokeWidth={1.5} label={{value:l.label+' '+fmt(l.price),position:'insideTopRight',fill:LINE_COLORS[l.color].stroke,fontSize:10,fontWeight:600}}/>)}
                        {cardAlerts.filter(a=>!a.triggered).map(a=><ReferenceLine key={a.id} y={a.target} stroke="#fbbf24" strokeDasharray="2 4" strokeWidth={1} label={{value:'🔔 '+fmt(a.target),position:'insideBottomRight',fill:'#fbbf24',fontSize:10}}/>)}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {cardLines.map(l=>(<div key={l.id} className={cx('inline-flex items-center gap-1.5 rounded-md pl-2 pr-1 py-1 text-[11px]',LINE_COLORS[l.color].bg)}><div className={cx('w-2 h-2 rounded-full',LINE_COLORS[l.color].dot)}/><span className={cx('font-medium',LINE_COLORS[l.color].text)}>{l.label}</span><span className="text-zinc-400">{fmt(l.price)}</span><button onClick={()=>onRemoveLine(card.id,l.id)} className="ml-0.5 w-4 h-4 rounded hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400"><X className="w-3 h-3"/></button></div>))}
                    <button onClick={()=>onAddLine(card.id,g.current)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300"><PenLine className="w-3 h-3"/>Add line</button>
                    <button onClick={()=>onAddAlert(card.id,g.current)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-[11px] text-amber-300"><Bell className="w-3 h-3"/>Set alert</button>
                  </div>
                </div>
              );
            })()}

            {tab==='grading'&&(<div className="mb-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">Grading Service Comparison · Est. grade 10 value vs. raw</div>
              <div className="grid grid-cols-2 gap-2">
                {GRADERS.map(gr=>{
                  const p10 = db.pricing.psa?.[10] || g.current * 3;
                  const est = Math.round(p10 * gr.mult);
                  const tiers = gr.tiers.map(t=>({...t, profit: est - t.fee - g.current}));
                  const best = [...tiers].sort((a,b)=>b.profit-a.profit)[0];
                  return (
                    <div key={gr.name} className={cx('rounded-xl border p-3', gr.bg, gr.border)}>
                      <div className={cx('text-sm font-black mb-1', gr.color)}>{gr.name}</div>
                      <div className="text-[10px] text-zinc-500 mb-0.5">Est. Grade 10</div>
                      <div className="text-base font-bold text-white mb-2">{fmt(est)}</div>
                      <div className="space-y-1.5">
                        {tiers.map(t=>(
                          <div key={t.l} className={cx('flex items-center justify-between text-[11px] px-2 py-1 rounded-lg', best.l===t.l?'bg-white/10':'')}>
                            <span className="text-zinc-400">{t.l} <span className="text-zinc-600">${t.fee}</span></span>
                            <span className={cx('font-bold tabular-nums', t.profit>0?'text-emerald-400':'text-red-400')}>
                              {t.profit>0?'+':''}{fmt(t.profit)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-500">
                Raw value: <span className="text-white font-semibold">{fmt(g.current)}</span> · BGS/CGC/TAG estimated at a discount to PSA 10 · Highlighted row = best ROI per service
              </div>
            </div>)}

            <div className="flex gap-2 flex-wrap pt-3 border-t border-zinc-800">
              {!isSold&&<button onClick={()=>onBuyMore(card.id)} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg hover:bg-zinc-700"><Plus className="w-4 h-4"/>Buy More</button>}
              {!isSold&&!card.condition.startsWith('PSA')&&<button onClick={()=>onGradeROI(card.id)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold rounded-lg"><Calculator className="w-4 h-4"/>Should I grade this?</button>}
              {!isSold&&<button onClick={()=>onSell(card.id)} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/15 text-red-300 text-sm font-semibold rounded-lg hover:bg-red-500/25"><DollarSign className="w-4 h-4"/>Mark as Sold</button>}
              {isSold&&<div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 text-zinc-400 text-sm rounded-lg"><Archive className="w-4 h-4 text-red-400"/>Closed Position</div>}
              <button onClick={()=>onDelete(card.id)} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 text-sm font-semibold rounded-lg ml-auto"><Trash2 className="w-4 h-4"/>Delete</button>
            </div>
            {/* Affiliate buy links */}
            <div className="flex gap-2 pt-2">
              <a href={`https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(db.name)}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold rounded-lg transition">🛒 TCGPlayer</a>
              <a href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(db.name + ' pokemon card')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold rounded-lg transition">🔍 eBay</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({ title, body, confirmLabel = 'Delete', onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-5" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0"><AlertCircle className="w-5 h-5 text-red-400"/></div><div><div className="text-lg font-bold text-white">{title}</div>{body&&<div className="text-sm text-zinc-400 mt-1">{body}</div>}</div></div>
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Cancel</button><button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-bold rounded-lg">{confirmLabel}</button></div>
      </div>
    </div>
  );
}

export function CollectionEditModal({ mode, id, name: initial = '', onClose, onConfirm, onDelete }) {
  const [name, setName] = useState(initial);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center"><Layers className="w-5 h-5 text-white"/></div><div className="text-lg font-bold text-white">{mode==='rename'?'Rename Binder':'New Binder'}</div></div><button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button></div>
        <div className="p-5 space-y-4">
          <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Name</div><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Vintage Holos" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"/></div>
          <div className="flex gap-2">{mode==='rename'&&<button onClick={()=>onDelete(id)} className="px-4 py-2.5 bg-red-500/15 text-red-300 text-sm font-semibold rounded-lg hover:bg-red-500/25 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5"/>Delete</button>}<button onClick={onClose} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg ml-auto">Cancel</button><button onClick={()=>onConfirm({id,name:name.trim()})} disabled={!name.trim()} className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold rounded-lg disabled:opacity-50">{mode==='rename'?'Save':'Create'}</button></div>
        </div>
      </div>
    </div>
  );
}

export function WantlistAddModal({ onClose, onAdd }) {
  const [query,setQuery]=useState(''), [selId,setSelId]=useState(null), [cond,setCond]=useState('NM'), [target,setTarget]=useState(''), [notes,setNotes]=useState('');
  const results=useMemo(()=>{const q=query.toLowerCase();return q?Object.entries(CARD_DB).filter(([,d])=>d.name.toLowerCase().includes(q)||d.set.toLowerCase().includes(q)).slice(0,8):Object.entries(CARD_DB).slice(0,6);},[query]);
  const sel=selId?CARD_DB[selId]:null, market=sel?(cond.startsWith('PSA')?sel.pricing.psa[parseInt(cond.slice(3),10)]||sel.pricing.raw.NM:sel.pricing.raw[cond]||sel.pricing.raw.NM):0;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full my-auto" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center"><Heart className="w-5 h-5 text-pink-400"/></div><div><div className="text-lg font-bold text-white">Add to Wantlist</div><div className="text-xs text-zinc-400">Get alerted when it drops below target.</div></div></div><button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button></div>
        <div className="p-5 space-y-4">
          {!sel?(<div><div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search card…" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/></div><div className="space-y-1 max-h-72 overflow-y-auto">{results.map(([id,db])=>(<button key={id} onClick={()=>setSelId(id)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 text-left"><div className="w-10 h-14 flex-shrink-0"><CardImg dbId={id} className="w-full h-full"/></div><div className="flex-1 min-w-0"><div className="text-sm font-medium text-white truncate">{db.name}</div><div className="text-[11px] text-zinc-500">{db.set}</div></div><div className="text-xs text-zinc-400">{fmt(db.pricing.raw.NM)}</div></button>))}</div></div>):(
            <><div className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl"><div className="w-14 h-20 flex-shrink-0"><CardImg dbId={selId} className="w-full h-full"/></div><div className="flex-1 min-w-0"><div className="text-sm font-bold text-white">{sel.name}</div><div className="text-[11px] text-zinc-500">{sel.set}</div></div><button onClick={()=>setSelId(null)} className="text-xs text-zinc-400 hover:text-white">Change</button></div>
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Condition</div><div className="grid grid-cols-5 gap-1.5">{ALL_CONDITIONS.map(c=><button key={c} onClick={()=>setCond(c)} className={cx('py-1.5 text-xs font-semibold rounded-lg',cond===c?'bg-pink-500/15 border border-pink-500/40 text-pink-300':'bg-zinc-950 border border-zinc-800 text-zinc-400')}>{c}</button>)}</div></div>
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Target Price <span className="normal-case text-zinc-600">· market: {fmt(market)}</span></div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span><input type="number" value={target} onChange={e=>setTarget(e.target.value)} placeholder={String(Math.round(market*0.85))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/></div></div>
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Notes (optional)</div><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Grail card" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/></div>
            <div className="flex gap-2"><button onClick={onClose} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Cancel</button><button onClick={()=>onAdd({id:'w-'+Date.now(),dbId:selId,condition:cond,targetPrice:parseFloat(target),notes,addedDate:todayStr()})} disabled={!target} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold rounded-lg disabled:opacity-50">Add to Wantlist</button></div></>
          )}
        </div>
      </div>
    </div>
  );
}

export function SealedAddModal({ onClose, onAdd }) {
  const [selId,setSelId]=useState(null), [qty,setQty]=useState('1'), [cost,setCost]=useState(''), [date,setDate]=useState(todayStr());
  const sel=selId?SEALED_DB[selId]:null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full my-auto" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-cyan-400"/></div><div className="text-lg font-bold text-white">Add Sealed Product</div></div><button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button></div>
        <div className="p-5 space-y-4">
          {!sel?(<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto">{Object.entries(SEALED_DB).map(([id,p])=>(<button key={id} onClick={()=>{setSelId(id);setCost(String(Math.round(p.currentPrice*0.6)));}} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-left"><div className="w-12 h-16 flex-shrink-0"><SealedTile productId={id} className="w-full h-full"/></div><div className="flex-1 min-w-0"><div className="text-sm font-semibold text-white truncate">{p.name}</div><div className="text-[11px] text-zinc-500">{p.year} · {p.type}</div><div className="text-[11px] text-zinc-400 mt-0.5">{fmt(p.currentPrice)}</div></div></button>))}</div>):(
            <><div className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl"><div className="w-14 h-20 flex-shrink-0"><SealedTile productId={selId} className="w-full h-full"/></div><div className="flex-1 min-w-0"><div className="text-sm font-bold text-white">{sel.name}</div><div className="text-[11px] text-zinc-500">{sel.set} · Market {fmt(sel.currentPrice)}</div></div><button onClick={()=>setSelId(null)} className="text-xs text-zinc-400 hover:text-white">Change</button></div>
            <div className="grid grid-cols-2 gap-3"><div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Quantity</div><input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"/></div><div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Cost/unit</div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span><input type="number" value={cost} onChange={e=>setCost(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none"/></div></div></div>
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Date</div><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"/></div>
            <div className="flex gap-2"><button onClick={onClose} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Cancel</button><button onClick={()=>onAdd({id:'sp-'+Date.now(),productId:selId,qty:parseInt(qty,10),cost:parseFloat(cost),date})} disabled={!cost||!qty} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold rounded-lg disabled:opacity-50">Add to Binder</button></div></>
          )}
        </div>
      </div>
    </div>
  );
}

export function GradeROIModal({ cardId, cards, preGrades, onClose }) {
  const card = cards.find(c => c.id === cardId); if (!card) return null;
  const db = CARD_DB[card.dbId], raw = getCardValue(card);
  const [cg, setCg] = useState(preGrades[cardId] || { centering:8.5, surface:9, edges:8.5, corners:8.5 });
  const [tier, setTier] = useState('value');

  const dist = gradeProbDist(cg);
  const roi = calcGradeROI(card, cg, tier);
  const rec = roi.delta > 40, marg = roi.delta > 0 && roi.delta <= 40;
  const avg = (cg.centering + cg.surface + cg.edges + cg.corners) / 4;

  const SLIDERS = [
    { key:'centering', label:'Centering' },
    { key:'surface',   label:'Surface'   },
    { key:'edges',     label:'Edges'     },
    { key:'corners',   label:'Corners'   },
  ];
  const TIERS = [
    { id:'economy', label:'Economy', fee:19  },
    { id:'value',   label:'Value',   fee:39  },
    { id:'regular', label:'Regular', fee:85  },
    { id:'express', label:'Express', fee:175 },
  ];
  const SERVICES = [
    { name:'PSA', color:'text-blue-400',    mult:1.00, fees:{economy:19,value:39,regular:85,express:175} },
    { name:'BGS', color:'text-purple-400',  mult:0.88, fees:{economy:24,value:50,regular:100,express:200} },
    { name:'CGC', color:'text-emerald-400', mult:0.75, fees:{economy:14,value:35,regular:75,express:150} },
    { name:'TAG', color:'text-amber-400',   mult:0.72, fees:{economy:15,value:35,regular:75} },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full my-auto" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Calculator className="w-5 h-5 text-emerald-400"/></div>
            <div><div className="text-lg font-bold text-white">Should I grade this?</div><div className="text-xs text-zinc-400">{db.name} · Raw {fmt(raw)}</div></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Live verdict */}
          <div className={cx('rounded-xl p-4 border-2 flex items-center gap-3',rec?'bg-emerald-500/10 border-emerald-500/40':marg?'bg-amber-500/10 border-amber-500/40':'bg-red-500/10 border-red-500/40')}>
            {rec?<Check className="w-5 h-5 text-emerald-400 flex-shrink-0"/>:marg?<AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0"/>:<X className="w-5 h-5 text-red-400 flex-shrink-0"/>}
            <div>
              <div className={cx('font-bold',rec?'text-emerald-300':marg?'text-amber-300':'text-red-300')}>{rec?'Grade it — good ROI':marg?'Marginal — your call':'Keep raw — not worth it'}</div>
              <div className="text-xs text-zinc-400 mt-0.5">PSA {TIERS.find(t=>t.id===tier)?.label} (${TIERS.find(t=>t.id===tier)?.fee}) · Expected vs raw: <span className="font-bold text-white">{roi.delta>=0?'+':''}{fmt(roi.delta)}</span></div>
            </div>
          </div>

          {/* Sliders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-zinc-500 uppercase font-semibold">Your Assessment</div>
              <div className="text-xs text-zinc-400">Avg <span className="font-bold text-white">{avg.toFixed(1)}</span></div>
            </div>
            <div className="space-y-3">
              {SLIDERS.map(s=>(
                <div key={s.key} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-zinc-300 flex-shrink-0">{s.label}</div>
                  <input type="range" min="1" max="10" step="0.5" value={cg[s.key]}
                    onChange={e=>setCg(c=>({...c,[s.key]:parseFloat(e.target.value)}))}
                    className="flex-1 h-1.5 rounded-full appearance-none bg-zinc-700 cursor-pointer accent-emerald-500"/>
                  <div className="w-8 text-right text-sm font-bold text-white tabular-nums">{cg[s.key].toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade probability bars */}
          <div>
            <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Predicted Grade Distribution</div>
            <div className="flex gap-2 items-end h-16">
              {Object.entries(dist).filter(([,p])=>p>0).sort((a,b)=>Number(b[0])-Number(a[0])).map(([g,p])=>(
                <div key={g} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[9px] text-zinc-400 tabular-nums">{Math.round(p*100)}%</div>
                  <div className="w-full bg-zinc-800 rounded-t-sm overflow-hidden" style={{height:'36px'}}>
                    <div className="w-full bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-t-sm transition-all duration-200" style={{height:Math.round(p*100)+'%',marginTop:'auto'}}/>
                  </div>
                  <div className="text-[10px] font-bold text-white">{g}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PSA fee tier */}
          <div>
            <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">PSA Fee Tier</div>
            <div className="grid grid-cols-4 gap-1.5">
              {TIERS.map(t=>(
                <button key={t.id} onClick={()=>setTier(t.id)} className={cx('p-2.5 rounded-lg border text-center transition',tier===t.id?'bg-emerald-500/10 border-emerald-500/40 text-emerald-300':'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200')}>
                  <div className="text-[11px] font-bold">{t.label}</div>
                  <div className="text-[10px] text-zinc-500">${t.fee}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Service comparison table */}
          <div>
            <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">All Services · Grade 10 estimate</div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-500 py-2 pl-3 font-semibold">Service</th>
                  <th className="text-center text-zinc-500 py-2 px-2 font-semibold">Est. G10</th>
                  <th className="text-center text-zinc-500 py-2 px-2 font-semibold">Best tier</th>
                  <th className="text-right text-zinc-500 py-2 pr-3 font-semibold">Net gain</th>
                </tr></thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {SERVICES.map(s=>{
                    const p10 = db.pricing.psa?.[10] || raw*3;
                    const est = Math.round(p10 * s.mult);
                    const best = Object.entries(s.fees).sort((a,b)=>(est-b[1]-raw)-(est-a[1]-raw))[0];
                    const profit = est - best[1] - raw;
                    return(
                      <tr key={s.name}>
                        <td className={cx('py-2.5 pl-3 font-black',s.color)}>{s.name}</td>
                        <td className="py-2.5 px-2 text-center text-white font-semibold tabular-nums">{fmt(est)}</td>
                        <td className="py-2.5 px-2 text-center text-zinc-400 capitalize">{best[0]} (${best[1]})</td>
                        <td className={cx('py-2.5 pr-3 text-right font-bold tabular-nums',profit>0?'text-emerald-400':'text-red-400')}>{profit>0?'+':''}{fmt(profit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SellModal({ cardId, cards, onClose, onConfirm }) {
  const card=cards.find(c=>c.id===cardId); if(!card) return null;
  const db=CARD_DB[card.dbId],cur=getCardValue(card),qty=getTotalQty(card),cost=getTotalCost(card);
  const [sp,setSp]=useState(String(cur)), [sd,setSd]=useState(todayStr());
  const pSell=parseFloat(sp)||0, pnl=pSell*qty-cost, pct=cost?(pnl/cost)*100:0;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center"><DollarSign className="w-5 h-5 text-red-400"/></div><div><div className="text-lg font-bold text-white">Mark as Sold</div><div className="text-xs text-zinc-400">{db.name} · {card.condition}{qty>1?' · '+qty+' copies':''}</div></div></div><button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button></div>
        <div className="p-5 space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm"><div className="flex justify-between mb-1"><span className="text-zinc-500">Blended cost</span><span className="text-white">{fmt(getBlended(card))} × {qty}</span></div><div className="flex justify-between"><span className="text-zinc-500">Current market</span><span className="text-white">{fmt(cur)}</span></div></div>
          <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Sell Price {qty>1&&<span className="normal-case text-zinc-600">· per copy</span>}</div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span><input type="number" value={sp} onChange={e=>setSp(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none"/></div></div>
          <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Sell Date</div><input type="date" value={sd} onChange={e=>setSd(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"/></div>
          {pSell>0&&<div className={cx('rounded-lg p-3 border',pnl>=0?'bg-emerald-500/10 border-emerald-500/30':'bg-red-500/10 border-red-500/30')}><div className="text-xs text-zinc-400 mb-0.5">Realized P&L</div><div className={cx('text-lg font-bold',pnl>=0?'text-emerald-300':'text-red-300')}>{pnl>=0?'+':''}{fmt(pnl)} ({fmtPct(pct)})</div></div>}
          <div className="flex gap-2"><button onClick={onClose} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Cancel</button><button onClick={()=>onConfirm(card.id,pSell,sd)} disabled={!pSell} className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-bold rounded-lg disabled:opacity-50">Confirm Sale</button></div>
        </div>
      </div>
    </div>
  );
}

export function BuyMoreModal({ cardId, cards, onClose, onConfirm }) {
  const card=cards.find(c=>c.id===cardId); if(!card) return null;
  const db=CARD_DB[card.dbId],cur=getCardValue(card),bl=getBlended(card),eq=getTotalQty(card);
  const [price,setPrice]=useState(String(cur)), [qty,setQty]=useState('1'), [date,setDate]=useState(todayStr());
  const pp=parseFloat(price)||0, pq=parseInt(qty,10)||0, nb=pp&&pq?(getTotalCost(card)+pp*pq)/(eq+pq):bl;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center"><Plus className="w-5 h-5 text-emerald-400"/></div><div><div className="text-lg font-bold text-white">Buy More</div><div className="text-xs text-zinc-400">{db.name}</div></div></div><button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button></div>
        <div className="p-5 space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm"><div className="flex justify-between mb-1"><span className="text-zinc-500">Existing lots</span><span className="text-white">{eq} copies · {fmt(bl)} avg</span></div><div className="flex justify-between"><span className="text-zinc-500">Current market</span><span className="text-white">{fmt(cur)}</span></div></div>
          <div className="grid grid-cols-2 gap-3"><div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Price Paid</div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span><input type="number" autoFocus value={price} onChange={e=>setPrice(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none"/></div></div><div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Quantity</div><input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"/></div></div>
          <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Date</div><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"/></div>
          {pp>0&&pq>0&&<div className="rounded-lg p-3 bg-cyan-500/10 border border-cyan-500/30"><div className="text-xs text-zinc-400 mb-0.5">New blended cost basis</div><div className="flex items-baseline gap-2"><div className="text-lg font-bold text-white">{fmt(nb)}</div><div className={cx('text-xs font-medium',nb>bl?'text-red-400':'text-emerald-400')}>{nb>bl?'averaging up':'averaging down'} {fmt(Math.abs(nb-bl))}</div></div><div className="text-[11px] text-zinc-500 mt-0.5">{eq+pq} total after purchase</div></div>}
          <div className="flex gap-2"><button onClick={onClose} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Cancel</button><button onClick={()=>onConfirm(card.id,{id:'L-'+Date.now(),price:pp,qty:pq,date})} disabled={!pp||!pq} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold rounded-lg disabled:opacity-50">Add Lot</button></div>
        </div>
      </div>
    </div>
  );
}

export function AlertModal({ cardId, currentPrice, onClose, onConfirm }) {
  const [target,setTarget]=useState(String(Math.round(currentPrice*1.15))), [dir,setDir]=useState('above'), [note,setNote]=useState('');
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center"><Bell className="w-5 h-5 text-amber-400"/></div><div><div className="text-lg font-bold text-white">Set Price Alert</div><div className="text-xs text-zinc-400">Current: {fmt(currentPrice)}</div></div></div><button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button></div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2"><button onClick={()=>setDir('above')} className={cx('p-3 rounded-lg border-2 text-sm font-semibold flex items-center justify-center gap-2',dir==='above'?'bg-emerald-500/10 border-emerald-500/50 text-emerald-300':'bg-zinc-950 border-zinc-800 text-zinc-400')}><TrendingUp className="w-4 h-4"/>Above</button><button onClick={()=>setDir('below')} className={cx('p-3 rounded-lg border-2 text-sm font-semibold flex items-center justify-center gap-2',dir==='below'?'bg-red-500/10 border-red-500/50 text-red-300':'bg-zinc-950 border-zinc-800 text-zinc-400')}><TrendingDown className="w-4 h-4"/>Below</button></div>
          <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Target Price</div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span><input type="number" autoFocus value={target} onChange={e=>setTarget(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none"/></div></div>
          <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Note (optional)</div><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Take profit target" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/></div>
          <div className="flex gap-2"><button onClick={onClose} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Cancel</button><button onClick={()=>onConfirm({cardId,target:parseFloat(target),direction:dir,note})} disabled={!target} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 text-sm font-bold rounded-lg disabled:opacity-50">Create Alert</button></div>
        </div>
      </div>
    </div>
  );
}

export function AddLineModal({ cardId, currentPrice, onClose, onConfirm }) {
  const [price,setPrice]=useState(String(Math.round(currentPrice))), [label,setLabel]=useState('Support'), [color,setColor]=useState('emerald');
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center"><PenLine className="w-5 h-5 text-white"/></div><div className="text-lg font-bold text-white">Draw Price Line</div></div><button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button></div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-4 gap-2">{[{label:'Support',color:'emerald'},{label:'Resistance',color:'red'},{label:'Target',color:'amber'},{label:'Entry',color:'cyan'}].map(p=>(<button key={p.label} onClick={()=>{setLabel(p.label);setColor(p.color);}} className={cx('py-2 rounded-lg border-2 text-xs font-semibold',label===p.label?cx('border-current',LINE_COLORS[p.color].text,LINE_COLORS[p.color].bg):'border-zinc-800 bg-zinc-950 text-zinc-400')}>{p.label}</button>))}</div>
          <div className="grid grid-cols-2 gap-3"><div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Label</div><input value={label} onChange={e=>setLabel(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"/></div><div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Price</div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span><input type="number" value={price} onChange={e=>setPrice(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none"/></div></div></div>
          <div className="flex gap-2"><button onClick={onClose} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Cancel</button><button onClick={()=>onConfirm(cardId,{id:'l-'+Date.now(),price:parseFloat(price),label,color})} disabled={!price||!label} className="flex-1 px-4 py-2.5 bg-white text-zinc-900 text-sm font-bold rounded-lg disabled:opacity-50">Add Line</button></div>
        </div>
      </div>
    </div>
  );
}

export function ManualAddModal({ collections, onClose, onAdd, seedQuery = '' }) {
  const [query,setQuery]=useState(seedQuery), [selId,setSelId]=useState(null), [cond,setCond]=useState('NM'), [price,setPrice]=useState(''), [date,setDate]=useState(todayStr()), [colId,setColId]=useState(collections[0]?.id||'');
  const results=useMemo(()=>{const q=query.toLowerCase();return q?Object.entries(CARD_DB).filter(([,d])=>d.name.toLowerCase().includes(q)||d.set.toLowerCase().includes(q)).slice(0,8):Object.entries(CARD_DB).slice(0,6);},[query]);
  const sel=selId?CARD_DB[selId]:null, suggested=sel?(cond.startsWith('PSA')?sel.pricing.psa[parseInt(cond.slice(3),10)]||0:sel.pricing.raw[cond]||0):0;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full my-auto" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Plus className="w-5 h-5 text-white"/></div><div><div className="text-lg font-bold text-white">Add Card</div><div className="text-xs text-zinc-400">Search · condition · price paid</div></div></div><button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button></div>
        <div className="p-5 space-y-4">
          {!sel?(<div><div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Charizard, Moonbreon, 4/102…" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"/></div><div className="space-y-1 max-h-80 overflow-y-auto">{results.map(([id,db])=>(<button key={id} onClick={()=>setSelId(id)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition text-left"><div className="w-10 h-14 flex-shrink-0"><CardImg dbId={id} className="w-full h-full"/></div><div className="flex-1 min-w-0"><div className="text-sm font-medium text-white truncate">{db.name}</div><div className="text-[11px] text-zinc-500">{db.set} · {db.number}</div></div><div className="text-xs text-zinc-400">{fmt(db.pricing.raw.NM)}</div></button>))}</div></div>):(
            <><div className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl"><div className="w-14 h-20 flex-shrink-0"><CardImg dbId={selId} className="w-full h-full"/></div><div className="flex-1 min-w-0"><div className="text-sm font-bold text-white">{sel.name}</div><div className="text-[11px] text-zinc-500">{sel.set} · {sel.rarity}</div></div><button onClick={()=>setSelId(null)} className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800">Change</button></div>
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Condition</div><div className="grid grid-cols-5 gap-1.5">{ALL_CONDITIONS.map(c=><button key={c} onClick={()=>setCond(c)} className={cx('py-1.5 text-xs font-semibold rounded-lg',cond===c?'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300':'bg-zinc-950 border border-zinc-800 text-zinc-400')}>{c}</button>)}</div></div>
            <div className="grid grid-cols-2 gap-3"><div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Price Paid <span className="normal-case text-zinc-600">· market: {fmt(suggested)}</span></div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span><input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder={String(Math.round(suggested*0.9))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"/></div></div><div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Date</div><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"/></div></div>
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Binder</div><select value={colId} onChange={e=>setColId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white">{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="flex gap-2"><button onClick={onClose} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Cancel</button><button onClick={()=>{if(!selId||!price||!colId)return;onAdd({id:'c-'+Date.now(),dbId:selId,condition:cond,lots:[{id:'L-'+Date.now(),price:parseFloat(price),date,qty:1}],status:'holding'},colId);}} disabled={!price||!colId} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold rounded-lg disabled:opacity-50">Add to {collections.find(c=>c.id===colId)?.name||'Portfolio'}</button></div></>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlertsPanel({ alerts, cards, onClose, onRemove, onSelectCard }) {
  const active=alerts.filter(a=>!a.triggered), triggered=alerts.filter(a=>a.triggered);
  const Row=({a,isTrig})=>{ const card=cards.find(c=>c.id===a.cardId); if(!card) return null; const db=CARD_DB[card.dbId],cur=getCardValue(card),dp=((a.target-cur)/cur)*100; return (
    <div className={cx('flex items-center gap-3 p-3 rounded-lg',isTrig?'bg-amber-500/5 border border-amber-500/20':'hover:bg-zinc-800/50')}>
      <button onClick={()=>onSelectCard(a.cardId)} className="w-9 h-12 flex-shrink-0"><CardImg dbId={card.dbId} className="w-full h-full"/></button>
      <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 text-sm"><span className="font-medium text-white truncate">{db.name}</span>{a.direction==='above'?<TrendingUp className="w-3 h-3 text-emerald-400"/>:<TrendingDown className="w-3 h-3 text-red-400"/>}<span className="text-zinc-400">{fmt(a.target)}</span></div><div className="text-[11px] text-zinc-500">{isTrig?'Triggered '+a.triggeredAt:Math.abs(dp).toFixed(1)+'% '+(dp>0?'away':'past')}{a.note&&' · '+a.note}</div></div>
      <button onClick={()=>onRemove(a.id)} className="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
    </div>
  );};
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-end p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full mt-14 mr-2" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center"><Bell className="w-5 h-5 text-amber-400"/></div><div><div className="text-lg font-bold text-white">Price Alerts</div><div className="text-xs text-zinc-400">{active.length} active · {triggered.length} triggered</div></div></div><button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button></div>
        <div className="p-3 max-h-[70vh] overflow-y-auto">{!alerts.length?<div className="py-10 text-center"><Bell className="w-8 h-8 mx-auto text-zinc-700 mb-2"/><div className="text-sm text-zinc-400">No alerts yet</div><div className="text-xs text-zinc-600">Open a card and tap "Set alert"</div></div>:(<>{triggered.length>0&&<div className="mb-3"><div className="px-2 py-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">Triggered</div><div className="space-y-1">{triggered.map(a=><Row key={a.id} a={a} isTrig/>)}</div></div>}{active.length>0&&<div><div className="px-2 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Active</div><div className="space-y-1">{active.map(a=><Row key={a.id} a={a} isTrig={false}/>)}</div></div>}</>)}</div>
      </div>
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-24 right-4 z-[60] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className="bg-zinc-900 border border-amber-500/40 shadow-2xl rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0"><Bell className="w-4 h-4 text-amber-400"/></div>
          <div className="flex-1 min-w-0"><div className="text-sm font-bold text-white">{t.title||'Alert triggered'}</div><div className="text-xs text-zinc-300 mt-0.5">{t.message}</div></div>
          <button onClick={() => onDismiss(t.id)} className="w-6 h-6 rounded hover:bg-zinc-800 flex items-center justify-center text-zinc-500"><X className="w-3.5 h-3.5"/></button>
        </div>
      ))}
    </div>
  );
}

// ─── SETTINGS MODAL ──────────────────────────────────────────────────────────
export function SettingsModal({ settings, collections, onClose, onSave, onExport, onReset }) {
  const [s, setS] = useState(settings);
  const set = (k, v) => setS(p => ({ ...p, [k]: v }));
  const setNotif = (k, v) => setS(p => ({ ...p, notifications: { ...p.notifications, [k]: v } }));

  const Section = ({ title, children }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800"><div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{title}</div></div>
      <div className="divide-y divide-zinc-800">{children}</div>
    </div>
  );
  const Row = ({ label, sub, children }) => (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <div><div className="text-sm font-medium text-white">{label}</div>{sub&&<div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>}</div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)} className={cx('w-11 h-6 rounded-full transition-colors relative', value ? 'bg-emerald-500' : 'bg-zinc-700')}>
      <div className={cx('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', value ? 'translate-x-6' : 'translate-x-1')}/>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full my-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center"><Settings className="w-5 h-5 text-white"/></div><div className="text-lg font-bold text-white">Settings</div></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button>
        </div>
        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Display */}
          <Section title="Display">
            <Row label="Theme" sub={s.theme === 'dark' ? 'Dark mode' : 'Light mode'}>
              <button onClick={() => set('theme', s.theme === 'dark' ? 'light' : 'dark')}
                className={cx('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition', s.theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30')}>
                {s.theme === 'dark' ? <Moon className="w-3.5 h-3.5"/> : <Sun className="w-3.5 h-3.5"/>}
                {s.theme === 'dark' ? 'Dark' : 'Light'}
              </button>
            </Row>
          </Section>

          {/* Currency */}
          <Section title="Currency">
            <Row label="Display currency" sub="All prices converted at fixed rates">
              <select value={s.currency} onChange={e => set('currency', e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none">
                {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Row>
          </Section>

          {/* Defaults */}
          <Section title="Add Card Defaults">
            <Row label="Default condition">
              <select value={s.defaultCondition} onChange={e => set('defaultCondition', e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none">
                {ALL_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Row>
            <Row label="Default binder">
              <select value={s.defaultBinder} onChange={e => set('defaultBinder', e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none">
                <option value="">First available</option>
                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Row>
          </Section>

          {/* Notifications */}
          <Section title="Notifications">
            <Row label="Price alerts" sub="Alert when target price is hit"><Toggle value={s.notifications.priceAlerts} onChange={v => setNotif('priceAlerts', v)}/></Row>
            <Row label="News & creator drops"><Toggle value={s.notifications.news} onChange={v => setNotif('news', v)}/></Row>
            <Row label="Set release reminders"><Toggle value={s.notifications.releases} onChange={v => setNotif('releases', v)}/></Row>
          </Section>

          {/* Data */}
          <Section title="Data">
            <Row label="Export portfolio" sub="Download all your data as JSON">
              <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-white text-xs font-semibold rounded-lg hover:bg-zinc-700 transition"><Download className="w-3.5 h-3.5"/>Export</button>
            </Row>
            <Row label="Reset all data" sub="Wipes everything — cannot be undone">
              <button onClick={() => { onReset(); onClose(); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/25 border border-red-500/20 transition"><RotateCcw className="w-3.5 h-3.5"/>Reset</button>
            </Row>
          </Section>

          <button onClick={() => { onSave(s); onClose(); }}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold rounded-xl">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BULK IMPORT MODAL ────────────────────────────────────────────────────────
import Fuse from 'fuse.js';
const _fuseImport = new Fuse(
  Object.entries(CARD_DB).map(([id, db]) => ({ id, name: db.name, set: db.set })),
  { keys: ['name', 'set'], threshold: 0.4 }
);

export function BulkImportModal({ collections, onClose, onImport }) {
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState([]);
  const [parsed, setParsed] = useState(false);

  const parseCSV = () => {
    const lines = csv.trim().split('\n').filter(Boolean);
    const rows = lines[0]?.toLowerCase().includes('name') ? lines.slice(1) : lines;
    const results = rows.map((line, i) => {
      const parts = line.split(',').map(s => s.trim());
      const [rawName, cond, price, date, binderName] = parts;
      if (!rawName) return null;
      const match = _fuseImport.search(rawName)[0];
      const defaultCol = collections[0];
      const binder = binderName ? (collections.find(c => c.name.toLowerCase().includes(binderName.toLowerCase())) || defaultCol) : defaultCol;
      return {
        _row: i + 1, _name: rawName,
        dbId: match?.item.id || null,
        dbName: match ? CARD_DB[match.item.id]?.name : null,
        condition: ALL_CONDITIONS.includes(cond?.toUpperCase()) ? cond.toUpperCase() : 'NM',
        price: parseFloat(price) || null,
        date: date || todayStr(),
        colId: binder?.id || defaultCol?.id,
        colName: binder?.name || defaultCol?.name,
        matched: !!match,
      };
    }).filter(Boolean);
    setPreview(results);
    setParsed(true);
  };

  const doImport = () => {
    const valid = preview.filter(r => r.matched && r.price);
    valid.forEach(r => {
      const card = { id: 'c-' + Date.now() + Math.random(), dbId: r.dbId, condition: r.condition, lots: [{ id: 'L-' + Date.now() + Math.random(), price: r.price, date: r.date, qty: 1 }], status: 'holding' };
      onImport(card, r.colId);
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full my-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center"><Upload className="w-5 h-5 text-white"/></div><div><div className="text-lg font-bold text-white">Bulk Import</div><div className="text-xs text-zinc-400 mt-0.5">Paste CSV · one card per line</div></div></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button>
        </div>
        <div className="p-5 space-y-4">
          {!parsed ? (
            <>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                <div className="text-[11px] text-zinc-500 font-mono mb-1">Format: card name, condition, price paid, date, binder (all optional except name)</div>
                <div className="text-[11px] text-emerald-400 font-mono">Charizard, NM, 520, 2024-01-15, Vintage</div>
                <div className="text-[11px] text-emerald-400 font-mono">Moonbreon, LP, 500, 2024-02-20</div>
              </div>
              <textarea value={csv} onChange={e => setCsv(e.target.value)} rows={8} placeholder="Paste your card list here…" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono resize-none"/>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Cancel</button>
                <button onClick={parseCSV} disabled={!csv.trim()} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold rounded-lg disabled:opacity-40">Parse Cards</button>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-zinc-500 mb-1">{preview.filter(r=>r.matched&&r.price).length} of {preview.length} rows ready to import</div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {preview.map((r, i) => (
                  <div key={i} className={cx('flex items-center gap-3 p-3 rounded-xl text-sm', r.matched && r.price ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-red-500/5 border border-red-500/20')}>
                    <div className={cx('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold', r.matched && r.price ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                      {r.matched && r.price ? '✓' : '!'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{r.matched ? r.dbName : r._name}</div>
                      <div className="text-[11px] text-zinc-500">{r.matched ? `${r.condition} · $${r.price} · ${r.colName}` : 'Card not found in database'}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setParsed(false); setPreview([]); }} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Back</button>
                <button onClick={doImport} disabled={!preview.some(r=>r.matched&&r.price)} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold rounded-lg disabled:opacity-40">
                  Import {preview.filter(r=>r.matched&&r.price).length} Cards
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


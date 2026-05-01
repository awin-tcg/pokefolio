// src/components/binder.jsx
import React, { useState, useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { Plus, Trash2, Heart, ShoppingBag, Layers, Package, Wallet, Calculator, TrendingUp, ChevronRight, Pencil, CheckCircle2, Circle, LayoutGrid } from 'lucide-react';
import { CARD_DB, SEALED_DB } from '../data.js';
import { fmt, fmtPct, cx, getCardValue, getTotalQty, getTotalCost, wantlistPrice, generateHistory } from '../utils.js';
import { CardImg, SealedTile, StatChip, EmptyState } from './ui.jsx';
import { CardGrid } from './dashboard.jsx';

// ─── BINDER PERFORMANCE CHART ────────────────────────────────────────────────
function BinderChart({ cards }) {
  const [range, setRange] = useState(90);
  const chartData = useMemo(() => {
    if (!cards.length) return [];
    const entries = cards.map(card => ({ hist: generateHistory(card, 365), qty: getTotalQty(card) }));
    const ref = entries[0].hist;
    return Array.from({ length: range }, (_, i) => {
      const refIdx = ref.length - range + i;
      const total = entries.reduce((sum, { hist, qty }) => {
        const idx = hist.length - range + i;
        return sum + (idx >= 0 ? hist[idx].price * qty : 0);
      }, 0);
      return { date: refIdx >= 0 ? ref[refIdx].date : '', value: Math.round(total) };
    });
  }, [cards, range]);

  if (!cards.length) return null;
  const first = chartData[0]?.value || 0;
  const last = chartData[chartData.length - 1]?.value || 0;
  const gain = last - first, pct = first ? (gain / first) * 100 : 0;
  const color = gain >= 0 ? '#34d399' : '#f87171';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
      <div className="px-4 pt-4 pb-1 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Binder Performance</div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <div className="text-xl font-bold text-white">{fmt(last)}</div>
            <div className={cx('text-sm font-semibold', gain >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {gain >= 0 ? '+' : ''}{fmt(gain)} ({fmtPct(pct)})
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {[{r:30,l:'30D'},{r:90,l:'90D'},{r:365,l:'1Y'}].map(({r,l})=>(
            <button key={r} onClick={()=>setRange(r)} className={cx('px-2.5 py-1 text-xs font-semibold rounded-lg transition', range===r?'bg-zinc-700 text-white':'text-zinc-500 hover:text-zinc-300')}>{l}</button>
          ))}
        </div>
      </div>
      <div className="h-28 px-1 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis hide domain={['auto','auto']}/>
            <Tooltip contentStyle={{background:'#18181b',border:'1px solid #3f3f46',borderRadius:'8px',padding:'6px 10px',fontSize:11}} formatter={val=>[fmt(val),'Value']} labelFormatter={()=>''}/>
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── SORT / FILTER BAR ───────────────────────────────────────────────────────
function SortFilterBar({ sortBy, setSortBy, filterCond, setFilterCond, count, total }) {
  const conditions = ['All','NM','LP','MP','HP','DMG','PSA10','PSA9','PSA8'];
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer">
        <option value="value-desc">Value ↓</option>
        <option value="value-asc">Value ↑</option>
        <option value="name-asc">Name A–Z</option>
        <option value="date-desc">Newest first</option>
        <option value="date-asc">Oldest first</option>
      </select>
      <div className="flex gap-1.5 flex-wrap">
        {conditions.map(c=>(
          <button key={c} onClick={()=>setFilterCond(c)} className={cx('flex-shrink-0 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition', filterCond===c?'bg-zinc-700 text-white':'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200')}>
            {c}
          </button>
        ))}
      </div>
      {total > 0 && count !== total && <span className="text-[11px] text-zinc-500 ml-auto">{count} of {total}</span>}
    </div>
  );
}

function applySortFilter(cards, sortBy, filterCond) {
  let result = filterCond === 'All' ? cards : cards.filter(c => c.condition === filterCond);
  switch (sortBy) {
    case 'value-asc':  return [...result].sort((a,b) => getCardValue(a)*getTotalQty(a) - getCardValue(b)*getTotalQty(b));
    case 'name-asc':   return [...result].sort((a,b) => (CARD_DB[a.dbId]?.name||'').localeCompare(CARD_DB[b.dbId]?.name||''));
    case 'date-desc':  return [...result].sort((a,b) => (b.lots?.[0]?.date||'').localeCompare(a.lots?.[0]?.date||''));
    case 'date-asc':   return [...result].sort((a,b) => (a.lots?.[0]?.date||'').localeCompare(b.lots?.[0]?.date||''));
    default:           return [...result].sort((a,b) => getCardValue(b)*getTotalQty(b) - getCardValue(a)*getTotalQty(a));
  }
}

function SetCompletionView({ cards, onBack, onQuickAdd }) {
  const holdings = cards.filter(c => c.status === 'holding');
  const ownedDbIds = new Set(holdings.map(c => c.dbId));

  // Group CARD_DB by set
  const bySet = {};
  Object.entries(CARD_DB).forEach(([id, db]) => {
    if (!bySet[db.set]) bySet[db.set] = { set: db.set, year: db.year, cards: [] };
    bySet[db.set].cards.push({ id, ...db });
  });
  const sets = Object.values(bySet).sort((a, b) => b.year - a.year);
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="max-w-7xl mx-auto px-5 py-6 pb-28">
      <button onClick={onBack} className="text-sm text-zinc-400 hover:text-white mb-5 flex items-center gap-1 group">
        <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition"/>Binders
      </button>
      <div className="mb-6">
        <div className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Progress</div>
        <div className="text-3xl font-bold text-white">Set Completion</div>
        <div className="text-sm text-zinc-400 mt-1">
          {[...ownedDbIds].length} unique card{[...ownedDbIds].length !== 1 ? 's' : ''} across {sets.length} sets in the database
        </div>
      </div>
      <div className="space-y-3">
        {sets.map(s => {
          const total = s.cards.length;
          const owned = s.cards.filter(c => ownedDbIds.has(c.id)).length;
          const pct = total ? Math.round((owned / total) * 100) : 0;
          const isExpanded = expanded === s.set;
          return (
            <div key={s.set} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : s.set)} className="w-full flex items-center gap-4 p-4 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{s.set}</span>
                    <span className="text-[10px] text-zinc-500">{s.year}</span>
                    {pct === 100 && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded uppercase">Complete!</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all" style={{ width: pct + '%' }}/>
                    </div>
                    <span className="text-xs text-zinc-400 tabular-nums flex-shrink-0">{owned}/{total}</span>
                  </div>
                </div>
                <ChevronRight className={cx('w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform', isExpanded && 'rotate-90')}/>
              </button>
              {isExpanded && (
                <div className="border-t border-zinc-800 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {s.cards.map(c => {
                      const have = ownedDbIds.has(c.id);
                      return (
                        <div key={c.id} className={cx('flex items-center gap-2 p-2 rounded-lg', have ? 'bg-emerald-500/5' : 'bg-zinc-950')}>
                          {have ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0"/> : <Circle className="w-4 h-4 text-zinc-600 flex-shrink-0"/>}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white truncate">{c.name}</div>
                            <div className="text-[10px] text-zinc-500">{c.number} · {fmt(c.pricing.raw.NM)}</div>
                          </div>
                          {!have && <button onClick={() => onQuickAdd(c.id)} className="w-6 h-6 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 transition"><Plus className="w-3 h-3"/></button>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BinderView({ cards, collections, selectCard, setView, wantlist, sealed, onManageCollection, onAddWantlist, onRemoveWantlist, onAddSealed, onRemoveSealed }) {
  const [active, setActive] = useState(null);
  const [quickAddId, setQuickAddId] = useState(null);
  const [sortBy, setSortBy] = useState('value-desc');
  const [filterCond, setFilterCond] = useState('All');

  if (active === 'sets') {
    return (
      <>
        <SetCompletionView cards={cards} onBack={() => setActive(null)} onQuickAdd={setQuickAddId}/>
        {quickAddId && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setQuickAddId(null)}>
            <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-2xl w-full max-w-lg p-5" onClick={e => e.stopPropagation()}>
              <div className="text-sm font-bold text-white mb-2">Add {CARD_DB[quickAddId]?.name}</div>
              <button onClick={() => { setView('scan'); setQuickAddId(null); }} className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold rounded-xl">Go to Search tab to add</button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (active === 'all') {
    const allHoldings = cards.filter(c => c.status === 'holding');
    const tot = allHoldings.reduce((s,c) => s + getCardValue(c)*getTotalQty(c), 0);
    const cost = allHoldings.reduce((s,c) => s + getTotalCost(c), 0);
    const pct = cost ? ((tot-cost)/cost)*100 : 0;
    const displayed = applySortFilter(allHoldings, sortBy, filterCond);
    return (
      <div className="max-w-7xl mx-auto px-5 py-6 pb-28">
        <button onClick={() => setActive(null)} className="text-sm text-zinc-400 hover:text-white mb-5 flex items-center gap-1 group">
          <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition"/>Binders
        </button>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Portfolio</div>
            <div className="text-3xl font-bold text-white">All Cards</div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-sm text-zinc-400">{allHoldings.length} card{allHoldings.length!==1?'s':''}</span>
              <span className="text-xl font-bold text-white">{fmt(tot)}</span>
              <span className={cx('text-sm font-semibold', pct>=0?'text-emerald-400':'text-red-400')}>{fmtPct(pct)}</span>
            </div>
          </div>
          <button onClick={() => setView('scan')} className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-200"><Plus className="w-4 h-4"/>Add Card</button>
        </div>
        <SortFilterBar sortBy={sortBy} setSortBy={setSortBy} filterCond={filterCond} setFilterCond={setFilterCond} count={displayed.length} total={allHoldings.length}/>
        {allHoldings.length > 0
          ? displayed.length > 0 ? <CardGrid cards={displayed} onSelect={selectCard}/> : <div className="text-center py-10 text-zinc-500 text-sm">No cards match that filter.</div>
          : <EmptyState icon={Package} title="No cards yet" body="Add cards from the Search tab." ctaLabel="Add a card" onCta={() => setView('scan')}/>
        }
      </div>
    );
  }

  if (active && active !== 'wantlist' && active !== 'sealed') {
    const col = collections.find(c => c.id === active);
    if (!col) { setActive(null); return null; }
    const cc = cards.filter(c => col.cardIds.includes(c.id) && c.status === 'holding');
    const tot = cc.reduce((s,c)=>s+getCardValue(c)*getTotalQty(c),0), cost = cc.reduce((s,c)=>s+getTotalCost(c),0), pct = cost?((tot-cost)/cost)*100:0;
    const displayed = applySortFilter(cc, sortBy, filterCond);
    return (
      <div className="max-w-7xl mx-auto px-5 py-6 pb-28">
        <button onClick={()=>setActive(null)} className="text-sm text-zinc-400 hover:text-white mb-5 flex items-center gap-1 group"><ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition"/>Binders</button>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div><div className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Binder</div><div className="text-3xl font-bold text-white">{col.name}</div><div className="flex items-center gap-3 mt-2 flex-wrap"><span className="text-sm text-zinc-400">{cc.length} card{cc.length!==1?'s':''}</span><span className="text-xl font-bold text-white">{fmt(tot)}</span><span className={cx('text-sm font-semibold',pct>=0?'text-emerald-400':'text-red-400')}>{fmtPct(pct)}</span></div></div>
          <div className="flex gap-2"><button onClick={()=>onManageCollection({mode:'rename',id:col.id,name:col.name})} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 text-white text-sm font-semibold rounded-lg hover:bg-zinc-700"><Pencil className="w-3.5 h-3.5"/>Rename</button><button onClick={()=>setView('scan')} className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-200"><Plus className="w-4 h-4"/>Add Card</button></div>
        </div>
        {cc.length > 0 && <BinderChart cards={cc}/>}
        {cc.length > 0 && <SortFilterBar sortBy={sortBy} setSortBy={setSortBy} filterCond={filterCond} setFilterCond={setFilterCond} count={displayed.length} total={cc.length}/>}
        {cc.length>0 ? (displayed.length > 0 ? <CardGrid cards={displayed} onSelect={selectCard}/> : <div className="text-center py-10 text-zinc-500 text-sm">No cards match that filter.</div>) : <EmptyState icon={Package} title="This binder is empty" body="Add cards from the Search tab and select this binder." ctaLabel="Add a card" onCta={()=>setView('scan')}/>}
      </div>
    );
  }

  if (active === 'wantlist') {
    return (
      <div className="max-w-7xl mx-auto px-5 py-6 pb-28">
        <button onClick={()=>setActive(null)} className="text-sm text-zinc-400 hover:text-white mb-5 flex items-center gap-1 group"><ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition"/>Binders</button>
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3"><div><div className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Special</div><div className="text-3xl font-bold text-white">Wantlist</div><div className="text-sm text-zinc-400 mt-1">{wantlist.length} card{wantlist.length!==1?'s':''} tracked</div></div><button onClick={onAddWantlist} className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-200"><Plus className="w-4 h-4"/>Add Want</button></div>
        {wantlist.length===0?<EmptyState icon={Heart} title="Your wantlist is empty" body="Track cards you're hunting and get alerted when they drop below your target price." ctaLabel="Add a want" onCta={onAddWantlist}/>:(
          <div className="space-y-2">{wantlist.map(w=>{const db=CARD_DB[w.dbId];if(!db)return null;const cur=wantlistPrice(w),hit=cur<=w.targetPrice,away=((cur-w.targetPrice)/w.targetPrice*100);return(
            <div key={w.id} className={cx('flex items-center gap-3 bg-zinc-900 border rounded-xl p-3',hit?'border-emerald-500/40 bg-emerald-500/5':'border-zinc-800')}>
              <div className="w-12 h-16 flex-shrink-0"><CardImg dbId={w.dbId} className="w-full h-full"/></div>
              <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><div className="text-sm font-bold text-white truncate">{db.name}</div><span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">{w.condition}</span>{hit&&<span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded uppercase">Target hit!</span>}</div><div className="text-[11px] text-zinc-500 mt-0.5">{db.set} · added {w.addedDate}</div>{w.notes&&<div className="text-[11px] text-zinc-400 italic mt-0.5">{w.notes}</div>}</div>
              <div className="text-right flex-shrink-0"><div className="text-sm font-bold text-white tabular-nums">{fmt(cur)}</div><div className="text-[11px] text-zinc-500">target {fmt(w.targetPrice)}</div><div className={cx('text-[10px] font-semibold',hit?'text-emerald-400':'text-amber-400')}>{hit?'✓ below target':'+'+away.toFixed(1)+'% away'}</div></div>
              <button onClick={()=>onRemoveWantlist(w.id)} className="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 flex-shrink-0"><Trash2 className="w-3.5 h-3.5"/></button>
            </div>
          );})}
          </div>
        )}
      </div>
    );
  }

  if (active === 'sealed') {
    const totV=sealed.reduce((s,i)=>{const p=SEALED_DB[i.productId];return s+(p?p.currentPrice*i.qty:0);},0);
    const totC=sealed.reduce((s,i)=>s+i.cost*i.qty,0), gain=totV-totC, pct=totC?(gain/totC)*100:0;
    return (
      <div className="max-w-7xl mx-auto px-5 py-6 pb-28">
        <button onClick={()=>setActive(null)} className="text-sm text-zinc-400 hover:text-white mb-5 flex items-center gap-1 group"><ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition"/>Binders</button>
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3"><div><div className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Special</div><div className="text-3xl font-bold text-white">Sealed Products</div><div className="flex items-center gap-3 mt-2"><span className="text-sm text-zinc-400">{sealed.reduce((s,i)=>s+i.qty,0)} units</span><span className="text-xl font-bold text-white">{fmt(totV)}</span><span className={cx('text-sm font-semibold',gain>=0?'text-emerald-400':'text-red-400')}>{fmtPct(pct)}</span></div></div><button onClick={onAddSealed} className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-200"><Plus className="w-4 h-4"/>Add Sealed</button></div>
        {sealed.length===0?<EmptyState icon={ShoppingBag} title="No sealed products yet" body="Track booster boxes, ETBs, and packs alongside your singles." ctaLabel="Add sealed" onCta={onAddSealed}/>:(<>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <StatChip label="Units" value={sealed.reduce((s,i)=>s+i.qty,0)} sub={sealed.length+' products'} icon={Package}/>
            <StatChip label="Value" value={fmt(totV)} sub="at market" icon={Wallet}/>
            <StatChip label="Cost" value={fmt(totC)} sub="invested" icon={Calculator}/>
            <StatChip label="Gain" value={(gain>=0?'+':'')+fmt(gain)} sub={fmtPct(pct)} tone={gain>=0?'up':'down'} icon={TrendingUp}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{sealed.map(item=>{const p=SEALED_DB[item.productId];if(!p)return null;const tC=item.cost*item.qty,tM=p.currentPrice*item.qty,g=tM-tC,pc=tC?(g/tC)*100:0;return(
            <div key={item.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <div className="w-14 h-20 flex-shrink-0"><SealedTile productId={item.productId} className="w-full h-full"/></div>
              <div className="flex-1 min-w-0"><div className="text-sm font-bold text-white truncate">{p.name}</div><div className="text-[11px] text-zinc-500">{p.year} · {p.type} · ×{item.qty}</div><div className="text-[11px] text-zinc-500 mt-0.5">{item.date} · {fmt(item.cost)}/ea</div></div>
              <div className="text-right flex-shrink-0"><div className="text-sm font-bold text-white tabular-nums">{fmt(tM)}</div><div className={cx('text-[11px] tabular-nums font-medium',g>=0?'text-emerald-400':'text-red-400')}>{g>=0?'+':''}{fmt(g)} ({fmtPct(pc)})</div></div>
              <button onClick={()=>onRemoveSealed(item.id)} className="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 flex-shrink-0"><Trash2 className="w-3.5 h-3.5"/></button>
            </div>
          );})}
          </div>
        </>)}
      </div>
    );
  }

  // Shelf view
  const allHoldings = cards.filter(c => c.status === 'holding');
  const allTot = allHoldings.reduce((s,c) => s + getCardValue(c)*getTotalQty(c), 0);
  const wantlistVal=wantlist.reduce((s,w)=>s+wantlistPrice(w),0);
  const sealedVal=sealed.reduce((s,i)=>{const p=SEALED_DB[i.productId];return s+(p?p.currentPrice*i.qty:0);},0);
  return (
    <div className="max-w-7xl mx-auto px-5 py-6 pb-28">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3"><div><div className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Your Collection</div><div className="text-3xl font-bold text-white">Binders</div></div><button onClick={()=>onManageCollection({mode:'create'})} className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-200 transition"><Plus className="w-4 h-4"/>New Binder</button></div>
      {/* All Cards shortcut */}
      <button onClick={() => setActive('all')} className="w-full mb-4 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-2xl p-4 text-left transition flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center flex-shrink-0"><LayoutGrid className="w-5 h-5 text-zinc-300"/></div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">All Cards</div>
          <div className="text-[11px] text-zinc-500">{allHoldings.length} card{allHoldings.length!==1?'s':''} · {fmt(allTot)} total</div>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-500"/>
      </button>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={()=>setActive('sealed')} className="bg-gradient-to-br from-cyan-500/10 via-zinc-900 to-zinc-900 border border-cyan-500/20 hover:border-cyan-500/40 rounded-2xl p-4 text-left transition"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0"><ShoppingBag className="w-5 h-5 text-cyan-400"/></div><div><div className="text-sm font-bold text-white">Sealed</div><div className="text-[11px] text-zinc-500">{sealed.reduce((s,i)=>s+i.qty,0)} unit{sealed.reduce((s,i)=>s+i.qty,0)!==1?'s':''}</div></div></div><div className="text-lg font-bold text-white">{fmt(sealedVal)}</div><div className="text-[10px] text-zinc-500 mt-0.5">total market value</div></button>
        <button onClick={()=>setActive('wantlist')} className="bg-gradient-to-br from-pink-500/10 via-zinc-900 to-zinc-900 border border-pink-500/20 hover:border-pink-500/40 rounded-2xl p-4 text-left transition"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center flex-shrink-0"><Heart className="w-5 h-5 text-pink-400"/></div><div><div className="text-sm font-bold text-white">Wantlist</div><div className="text-[11px] text-zinc-500">{wantlist.length} card{wantlist.length!==1?'s':''} tracked</div></div></div><div className="text-lg font-bold text-white">{fmt(wantlistVal)}</div><div className="text-[10px] text-zinc-500 mt-0.5">total market value</div></button>
        <button onClick={()=>setActive('sets')} className="col-span-2 bg-gradient-to-br from-violet-500/10 via-zinc-900 to-zinc-900 border border-violet-500/20 hover:border-violet-500/40 rounded-2xl p-4 text-left transition flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-5 h-5 text-violet-400"/></div>
          <div className="flex-1"><div className="text-sm font-bold text-white">Set Completion</div><div className="text-[11px] text-zinc-500">Track which cards you own per set</div></div>
          <ChevronRight className="w-4 h-4 text-zinc-500"/>
        </button>
      </div>
      {collections.length===0?<EmptyState icon={Layers} title="No binders yet" body="Create binders to organize your cards." ctaLabel="Create your first binder" onCta={()=>onManageCollection({mode:'create'})}/>:(
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{collections.map(col=>{const cc=cards.filter(c=>col.cardIds.includes(c.id)&&c.status==='holding');const tot=cc.reduce((s,c)=>s+getCardValue(c)*getTotalQty(c),0),cost=cc.reduce((s,c)=>s+getTotalCost(c),0),pct=cost?((tot-cost)/cost)*100:0;return(
          <button key={col.id} onClick={()=>setActive(col.id)} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 transition text-left group relative">
            <button onClick={e=>{e.stopPropagation();onManageCollection({mode:'rename',id:col.id,name:col.name});}} className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-zinc-400 hover:text-white"><Pencil className="w-3 h-3"/></button>
            <div className="bg-zinc-950 p-2">{cc.length>0?(<div className="grid grid-cols-2 gap-1" style={{aspectRatio:'3/2'}}>{cc.slice(0,4).map(c=><div key={c.id} className="overflow-hidden rounded-sm" style={{aspectRatio:'2.5/3.5'}}><CardImg dbId={c.dbId} className="w-full h-full"/></div>)}{[...Array(Math.max(0,4-cc.slice(0,4).length))].map((_,i)=><div key={i} className="bg-zinc-900 rounded-sm" style={{aspectRatio:'2.5/3.5'}}/>)}</div>):(<div className="flex items-center justify-center bg-zinc-900 rounded-lg" style={{aspectRatio:'3/2'}}><Layers className="w-8 h-8 text-zinc-700"/></div>)}</div>
            <div className="px-3 py-2.5"><div className="text-sm font-bold text-white group-hover:text-cyan-400 transition truncate mb-1">{col.name}</div><div className="flex items-center justify-between"><div className="text-xs text-zinc-500">{cc.length} card{cc.length!==1?'s':''}</div><div className="text-right"><div className="text-sm font-bold text-white tabular-nums">{fmt(tot)}</div>{cost>0&&<div className={cx('text-[10px] tabular-nums font-medium',pct>=0?'text-emerald-400':'text-red-400')}>{fmtPct(pct)}</div>}</div></div></div>
          </button>
        );})}
        </div>
      )}
    </div>
  );
}


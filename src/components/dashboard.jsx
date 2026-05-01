// src/components/dashboard.jsx
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Plus, X, BarChart3, AlertCircle, Sparkles, Target, Package, Calculator, Activity, Layers, ArrowUpRight, ArrowDownRight, DollarSign, History, Droplet, Coins, Flame, Clock, Brain, Trophy, Crown, Timer, Heart, Camera, Archive, CircleDot, ChevronRight } from 'lucide-react';
import { CARD_DB, MARKET_PULSE, DRIVER_LABELS, SEED_RECENT_SALES, RELEASE_CALENDAR, INDEX_IDS, LINE_COLORS } from '../data.js';
import { fmt, fmtPct, cx, todayStr, daysBetween, getCardValue, getTotalQty, getTotalCost, getLots, unrealizedPL, realizedPL, getFirstDate, generateHistory, calcRSI, calcMomentum, calcLiquidity, calcMarketCap, calcSpread, LIQ_COLORS, genInsights, INS_STYLES, card24hDelta } from '../utils.js';
import { CardImg, StatChip, EmptyState, InfoTooltip, Sparkline } from './ui.jsx';

// ─── TICKER TAPE ─────────────────────────────────────────────────────────────
export function TickerTape({ cards, onSelectCard }) {
  const ownedIds = new Set(cards.filter(c => c.status === 'holding').map(c => c.dbId));
  const tickers = Object.entries(MARKET_PULSE)
    .sort((a, b) => Math.abs(b[1].change7d) - Math.abs(a[1].change7d))
    .map(([dbId, pulse]) => ({
      dbId, name: CARD_DB[dbId]?.name || dbId,
      price: CARD_DB[dbId]?.pricing?.raw?.NM,
      change: pulse.change7d,
      owned: ownedIds.has(dbId),
      cardId: cards.find(c => c.dbId === dbId && c.status === 'holding')?.id,
    }));
  if (!tickers.length) return null;
  return (
    <div className="overflow-hidden bg-zinc-950 border-b border-zinc-800">
      <style>{`@keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.ticker-track{animation:tickerScroll 32s linear infinite;display:flex;width:max-content}.ticker-track:hover{animation-play-state:paused}`}</style>
      <div className="ticker-track">
        {[...tickers, ...tickers].map((t, i) => {
          const pos = t.change >= 0;
          return (
            <button key={i} onClick={() => t.cardId && onSelectCard(t.cardId)} disabled={!t.cardId}
              className="flex items-center gap-2.5 px-5 py-2 border-r border-zinc-800 hover:bg-zinc-800/50 transition flex-shrink-0">
              {t.owned && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse"/>}
              <span className="text-[11px] font-bold text-white whitespace-nowrap">{t.name}</span>
              <span className={cx('text-[11px] font-bold tabular-nums whitespace-nowrap flex items-center gap-0.5', pos ? 'text-emerald-400' : 'text-red-400')}>
                {pos ? <TrendingUp className="w-2.5 h-2.5"/> : <TrendingDown className="w-2.5 h-2.5"/>}
                {Math.abs(t.change).toFixed(1)}%
              </span>
              <span className="text-[11px] text-zinc-500 tabular-nums whitespace-nowrap">{fmt(t.price)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── INSIGHTS PANEL ──────────────────────────────────────────────────────────
export function InsightsPanel({ cards, dismissed, onDismiss, onSelectCard }) {
  const insights = useMemo(() => genInsights(cards).filter(i => !dismissed.includes(i.id)), [cards, dismissed]);
  if (!insights.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center"><Sparkles className="w-3.5 h-3.5 text-purple-300"/></div>
          <div><div className="text-sm font-semibold text-white">AI Insights</div><div className="text-[11px] text-zinc-500">Personalized · refreshed daily</div></div>
        </div>
        <div className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">{insights.length}</div>
      </div>
      <div className="p-3 space-y-2">
        {insights.map(ins => {
          const Icon = ins.icon; const st = INS_STYLES[ins.type] || INS_STYLES.milestone;
          return (
            <div key={ins.id} className={cx('relative rounded-xl border p-3 bg-gradient-to-br to-zinc-900', st.bg, st.border)}>
              <button onClick={() => onDismiss(ins.id)} className="absolute top-2 right-2 w-5 h-5 rounded hover:bg-zinc-800 flex items-center justify-center text-zinc-600 hover:text-zinc-300"><X className="w-3 h-3"/></button>
              <div className="flex items-start gap-3">
                <div className={cx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', st.icon)}><Icon className="w-4 h-4"/></div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="text-sm font-bold text-white mb-0.5">{ins.title}</div>
                  <div className="text-xs text-zinc-300 leading-relaxed">{ins.body}</div>
                  {ins.cardId && <button onClick={() => onSelectCard(ins.cardId)} className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 mt-2 flex items-center gap-1">View card <ChevronRight className="w-3 h-3"/></button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MARKET PULSE FEED (carousel) ────────────────────────────────────────────
export function MarketPulseFeed({ cards, onSelectCard }) {
  const [idx, setIdx] = useState(0);
  const heldIds = new Set(cards.filter(c => c.status === 'holding').map(c => c.dbId));
  const entries = Object.entries(MARKET_PULSE).sort((a, b) => Math.abs(b[1].change7d) - Math.abs(a[1].change7d));
  const [dbId, pulse] = entries[idx] || [];
  if (!dbId) return null;
  const db = CARD_DB[dbId], owned = heldIds.has(dbId), cardId = cards.find(c => c.dbId === dbId && c.status === 'holding')?.id;
  const pos = pulse.change7d >= 0, dr = DRIVER_LABELS[pulse.driver];
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-cyan-400"/><div><div className="text-sm font-semibold text-white">Market Pulse</div><div className="text-[11px] text-zinc-500">Why cards moved · AI analysis</div></div></div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">{entries.map((_,i) => <div key={i} onClick={() => setIdx(i)} className={cx('w-1.5 h-1.5 rounded-full cursor-pointer transition-all', i===idx?'bg-cyan-400':'bg-zinc-700 hover:bg-zinc-500')}/>)}</div>
          <div className="flex gap-1 ml-1">
            <button onClick={() => setIdx(i => (i-1+entries.length)%entries.length)} className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"><ChevronRight className="w-3.5 h-3.5 rotate-180"/></button>
            <button onClick={() => setIdx(i => (i+1)%entries.length)} className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"><ChevronRight className="w-3.5 h-3.5"/></button>
          </div>
        </div>
      </div>
      <button onClick={() => cardId && onSelectCard(cardId)} disabled={!cardId} className={cx('w-full flex items-start gap-4 p-4 text-left', cardId?'hover:bg-zinc-800/40':'cursor-default')}>
        <div className="w-16 h-20 flex-shrink-0"><CardImg dbId={dbId} className="w-full h-full"/></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap"><span className="text-base font-bold text-white">{db.name}</span>{owned&&<span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded uppercase">Owned</span>}<span className={cx('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', dr.color)}>{dr.label}</span></div>
          <div className="text-xs text-zinc-300 leading-relaxed mb-2">{pulse.summary}</div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5"/>AI-generated · updated daily</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={cx('text-lg font-bold tabular-nums flex items-center gap-1', pos?'text-emerald-400':'text-red-400')}>{pos?<TrendingUp className="w-4 h-4"/>:<TrendingDown className="w-4 h-4"/>}{fmtPct(pulse.change7d)}</div>
          <div className="text-[10px] text-zinc-500">7d · {idx+1}/{entries.length}</div>
        </div>
      </button>
    </div>
  );
}

// ─── MARKET INTELLIGENCE (PKMN-10 + Buy/Sell tabs) ──────────────────────────
function PokeIndexChart({ cards }) {
  const holdings = cards.filter(c => c.status === 'holding');
  const data = useMemo(() => {
    const pH = holdings.map(c => { const h=generateHistory(c),q=getTotalQty(c); return h.map(p=>({...p,price:p.price*q})); });
    const iH = INDEX_IDS.map(dbId => generateHistory({ id:'idx-'+dbId, dbId, condition:'NM' }));
    if (!pH.length || !iH.length) return null;
    const lb=90, start=iH[0].length-lb;
    const ps=pH.reduce((s,h)=>s+(h[start]?.price||0),0), is=iH.reduce((s,h)=>s+(h[start]?.price||0),0);
    return Array.from({length:lb},(_,i)=>{const idx=start+i;return{day:i,portfolio:ps?((pH.reduce((s,h)=>s+(h[idx]?.price||0),0)-ps)/ps)*100:0,index:is?((iH.reduce((s,h)=>s+(h[idx]?.price||0),0)-is)/is)*100:0};});
  },[holdings]);
  if (!data?.length) return <div className="p-6 text-sm text-zinc-500 text-center">Add holdings to compare against the PKMN-10.</div>;
  const last=data[data.length-1], alpha=last.portfolio-last.index, win=alpha>=0;
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex gap-6 text-xs"><div><div className="text-zinc-500">Your portfolio</div><div className={cx('text-base font-bold tabular-nums',last.portfolio>=0?'text-emerald-400':'text-red-400')}>{fmtPct(last.portfolio)}</div></div><div><div className="text-zinc-500">PKMN-10</div><div className={cx('text-base font-bold tabular-nums',last.index>=0?'text-zinc-200':'text-zinc-400')}>{fmtPct(last.index)}</div></div></div>
        <div className="text-right"><div className={cx('text-xs font-bold tabular-nums flex items-center gap-1',win?'text-emerald-400':'text-red-400')}>{win?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>}{alpha>=0?'+':''}{alpha.toFixed(2)}% alpha</div><div className="text-[10px] text-zinc-500">{win?'beating the market':'underperforming'}</div></div>
      </div>
      <div className="h-36"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{top:5,right:0,left:0,bottom:0}}><XAxis dataKey="day" hide/><YAxis hide domain={['auto','auto']}/><ReferenceLine y={0} stroke="#52525b" strokeDasharray="2 3"/><Tooltip contentStyle={{background:'#18181b',border:'1px solid #3f3f46',borderRadius:8,fontSize:11}} formatter={(v,n)=>[fmtPct(v),n==='portfolio'?'You':'PKMN-10']}/><Line type="monotone" dataKey="index" stroke="#71717a" strokeWidth={1.5} dot={false}/><Line type="monotone" dataKey="portfolio" stroke={win?'#34d399':'#f87171'} strokeWidth={2.5} dot={false}/></LineChart></ResponsiveContainer></div>
    </div>
  );
}

function BuySellZones({ cards, onSelect }) {
  const holdings = cards.filter(c => c.status === 'holding');
  const scored = useMemo(() => holdings.map(c => { const h=generateHistory(c); return {card:c,rsi:calcRSI(h),mom:calcMomentum(h)}; }),[holdings]);
  if (!scored.length) return <div className="p-6 text-sm text-zinc-500 text-center">No holdings to score yet.</div>;
  const buys=[...scored].sort((a,b)=>a.rsi-b.rsi).slice(0,3), sells=[...scored].sort((a,b)=>b.rsi-a.rsi).slice(0,3);
  const Row=({s,buy})=>{ const db=CARD_DB[s.card.dbId]; return (
    <button onClick={()=>onSelect(s.card.id)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-800/50 transition text-left">
      <div className="w-10 h-14 flex-shrink-0"><CardImg dbId={s.card.dbId} className="w-full h-full"/></div>
      <div className="flex-1 min-w-0"><div className="text-sm font-medium text-white truncate">{db.name}</div><div className="text-[11px] text-zinc-500">{db.set} · {s.card.condition}</div></div>
      <div className="text-right"><div className={cx('text-xs font-bold tabular-nums',buy?'text-emerald-400':'text-red-400')}>RSI {s.rsi}</div><div className={cx('text-[10px] tabular-nums',s.mom>=0?'text-emerald-500':'text-red-500')}>{fmtPct(s.mom)}</div></div>
    </button>
  );};
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
      <div className="p-2"><div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-emerald-400 uppercase tracking-wider"><ArrowDownRight className="w-3 h-3"/>Buy Zone</div>{buys.map(s=><Row key={s.card.id} s={s} buy/>)}</div>
      <div className="p-2"><div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-red-400 uppercase tracking-wider"><ArrowUpRight className="w-3 h-3"/>Sell Zone</div>{sells.map(s=><Row key={s.card.id} s={s} buy={false}/>)}</div>
    </div>
  );
}

export function MarketIntelligence({ cards, onSelect }) {
  const [tab, setTab] = useState('index');
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400"/><div className="text-sm font-semibold text-white">Market Intelligence</div></div>
        <div className="flex gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
          <button onClick={() => setTab('index')} className={cx('px-3 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition',tab==='index'?'bg-zinc-800 text-white':'text-zinc-500 hover:text-zinc-300')}>
            PKMN-10 <InfoTooltip title="PKMN-10 Index" body="Equal-weighted basket of the top 10 chase Pokémon cards. Your portfolio's 90-day performance is compared against this benchmark."/>
          </button>
          <button onClick={() => setTab('zones')} className={cx('px-3 py-1 text-xs font-semibold rounded transition',tab==='zones'?'bg-zinc-800 text-white':'text-zinc-500 hover:text-zinc-300')}>Buy / Sell Zones</button>
        </div>
      </div>
      {tab === 'index' ? <PokeIndexChart cards={cards}/> : <BuySellZones cards={cards} onSelect={onSelect}/>}
    </div>
  );
}

// ─── P&L PANEL ───────────────────────────────────────────────────────────────
export function PnLPanel({ cards }) {
  const h=cards.filter(c=>c.status==='holding'), s=cards.filter(c=>c.status==='sold');
  const hv=h.reduce((x,c)=>x+getCardValue(c)*getTotalQty(c),0), hc=h.reduce((x,c)=>x+getTotalCost(c),0);
  const rv=s.reduce((x,c)=>x+realizedPL(c).absolute,0), rc=s.reduce((x,c)=>x+getTotalCost(c),0);
  const un=hv-hc, re=rv, tot=un+re;
  const PCell=({label,icon:Icon,amount,pct,sub})=>(
    <div className="bg-zinc-900 p-4">
      <div className="flex items-center gap-2 mb-2"><Icon className="w-3.5 h-3.5 text-zinc-500"/><span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{label}</span></div>
      <div className={cx('text-xl font-bold tabular-nums',amount>=0?'text-emerald-400':'text-red-400')}>{amount>=0?'+':''}{fmt(amount)}</div>
      <div className="flex items-center gap-2 mt-0.5"><span className={cx('text-xs tabular-nums font-medium',pct>=0?'text-emerald-500':'text-red-500')}>{fmtPct(pct)}</span>{sub&&<span className="text-[11px] text-zinc-500">· {sub}</span>}</div>
    </div>
  );
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2"><Calculator className="w-4 h-4 text-cyan-400"/><div className="text-sm font-semibold text-white">P&L Breakdown</div></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800">
        <PCell label="Unrealized"   icon={CircleDot}  amount={un}  pct={hc?(un/hc)*100:0} sub={h.length+' open'}/>
        <PCell label="Realized"     icon={Archive}    amount={re}  pct={rc?(re/rc)*100:0} sub={s.length+' closed'}/>
        <PCell label="Total Return" icon={TrendingUp} amount={tot} pct={(hc+rc)?tot/(hc+rc)*100:0} sub="all-time"/>
      </div>
    </div>
  );
}

// ─── COST BASIS OVER TIME ─────────────────────────────────────────────────────
export function CostBasisChart({ cards }) {
  const data = useMemo(() => {
    const allLots = cards.flatMap(c => getLots(c).map(l => ({date:l.date,cost:l.price*(l.qty||1)}))).filter(l=>l.date).sort((a,b)=>new Date(a.date)-new Date(b.date));
    if (!allLots.length) return [];
    let cum = 0; return allLots.map(l => { cum += l.cost; return { date:l.date, invested:Math.round(cum) }; });
  },[cards]);
  if (data.length < 2) return null;
  const total=data[data.length-1].invested;
  const curVal=cards.filter(c=>c.status==='holding').reduce((s,c)=>s+getCardValue(c)*getTotalQty(c),0);
  const gain=curVal-total, pct=total?(gain/total)*100:0;
  // getLots is imported from utils.js
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-400"/><div><div className="text-sm font-semibold text-white">Cost Basis Over Time</div><div className="text-[11px] text-zinc-500">Cumulative investment vs current value</div></div></div>
        <div className="text-right"><div className={cx('text-xs font-bold tabular-nums',gain>=0?'text-emerald-400':'text-red-400')}>{gain>=0?'+':''}{fmt(gain)}</div><div className={cx('text-[10px] tabular-nums',gain>=0?'text-emerald-500':'text-red-500')}>{fmtPct(pct)} return</div></div>
      </div>
      <div className="p-4">
        <div className="flex gap-4 mb-3 text-xs"><div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-cyan-400"/><span className="text-zinc-500">Invested</span><span className="font-bold text-white">{fmt(total)}</span></div><div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-emerald-400"/><span className="text-zinc-500">Value</span><span className="font-bold text-white">{fmt(curVal)}</span></div></div>
        <div className="h-44"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:5,right:0,left:0,bottom:0}}><defs><linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.25}/><stop offset="100%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="date" hide/><YAxis hide domain={['dataMin - 100','dataMax + 200']}/><Tooltip contentStyle={{background:'#18181b',border:'1px solid #3f3f46',borderRadius:8,fontSize:11}} formatter={(v,n)=>[fmt(v),n==='invested'?'Invested':'Value']}/><ReferenceLine y={curVal} stroke="#34d399" strokeDasharray="4 3" strokeWidth={1.5} label={{value:fmt(curVal),position:'insideTopRight',fill:'#34d399',fontSize:10,fontWeight:600}}/><Area type="stepAfter" dataKey="invested" stroke="#22d3ee" strokeWidth={2} fill="url(#cg1)" dot={data.length<20?{fill:'#22d3ee',r:3,strokeWidth:0}:false}/></AreaChart></ResponsiveContainer></div>
      </div>
    </div>
  );
}

// ─── DIVERSIFICATION SCORE ───────────────────────────────────────────────────
export function DiversificationScore({ cards }) {
  const holdings = cards.filter(c => c.status === 'holding');
  if (!holdings.length) return null;
  const score = useMemo(() => {
    const sets=new Set(holdings.map(c=>CARD_DB[c.dbId]?.set)).size, types=new Set(holdings.map(c=>CARD_DB[c.dbId]?.type)).size;
    const eras=new Set(holdings.map(c=>{const y=CARD_DB[c.dbId]?.year;return y<2010?'vintage':y<2020?'classic':'modern';})).size;
    const graded=holdings.filter(c=>c.condition.startsWith('PSA')).length,gPct=holdings.length?graded/holdings.length:0;
    const setS=Math.min(100,sets*18),typeS=Math.min(100,types*16),eraS=Math.min(100,eras*33),mixS=gPct>0&&gPct<1?100:70;
    const total=Math.round(setS*0.35+typeS*0.25+eraS*0.25+mixS*0.15);
    const grade=total>=85?'A':total>=70?'B':total>=55?'C':total>=40?'D':'F';
    const color=total>=85?'text-emerald-400':total>=70?'text-cyan-400':total>=55?'text-amber-400':'text-red-400';
    return {total,grade,color,factors:[{label:'Set variety',score:setS,detail:sets+' sets'},{label:'Type spread',score:typeS,detail:types+' types'},{label:'Era mix',score:eraS,detail:eras+' era'+(eras!==1?'s':'')},{label:'Raw vs graded',score:mixS,detail:graded+' graded'}]};
  },[holdings]);
  const barColor=s=>s>=85?'bg-emerald-400':s>=70?'bg-cyan-400':s>=55?'bg-amber-400':'bg-red-400';
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2"><Target className="w-4 h-4 text-cyan-400"/><div><div className="text-sm font-semibold text-white">Diversification Score</div><div className="text-[11px] text-zinc-500">How balanced is your collection</div></div></div>
        <div className="flex items-baseline gap-1.5"><div className={cx('text-4xl font-black',score.color)}>{score.grade}</div><div className="text-sm text-zinc-500">{score.total}/100</div></div>
      </div>
      <div className="p-4 space-y-3">
        {score.factors.map(f => (
          <div key={f.label}>
            <div className="flex items-center justify-between mb-1"><div className="text-xs font-medium text-zinc-300">{f.label}</div><div className="flex items-center gap-2"><span className="text-[11px] text-zinc-500">{f.detail}</span><span className="text-xs font-bold text-white">{f.score}</span></div></div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className={cx('h-full rounded-full',barColor(f.score))} style={{width:f.score+'%'}}/></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SET ROTATION WARNINGS ───────────────────────────────────────────────────
export function SetRotationWarnings({ cards }) {
  const holdings = cards.filter(c => c.status === 'holding');
  const warnings = useMemo(() => {
    const atRisk=holdings.filter(c=>{const db=CARD_DB[c.dbId];if(!db)return false;return new Date().getFullYear()-db.year>=3&&db.trend==='down'&&MARKET_PULSE[c.dbId]?.sentiment==='bearish';});
    const upcoming=RELEASE_CALENDAR.filter(r=>{const days=Math.ceil((new Date(r.date)-new Date())/864e5);return days>0&&days<=90&&r.hype==='high';});
    return {atRisk,upcoming};
  },[holdings]);
  if (!warnings.atRisk.length && !warnings.upcoming.length) return null;
  return (
    <div className="bg-zinc-900 border border-amber-500/25 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-400"/><div><div className="text-sm font-semibold text-white">Set Rotation Warnings</div><div className="text-[11px] text-zinc-500">Cards that may face downward pressure</div></div></div>
      <div className="p-3 space-y-2">
        {warnings.atRisk.map(c=>{const db=CARD_DB[c.dbId],pulse=MARKET_PULSE[c.dbId];return(
          <div key={c.id} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
            <div className="w-10 h-14 flex-shrink-0"><CardImg dbId={c.dbId} className="w-full h-full"/></div>
            <div className="flex-1 min-w-0"><div className="text-sm font-bold text-white truncate">{db.name}</div><div className="text-[11px] text-zinc-500">{db.set} · {db.year}</div>{pulse&&<div className="text-[11px] text-amber-300 mt-0.5">{pulse.summary.split('.')[0]}.</div>}</div>
            <div className="text-right flex-shrink-0"><div className="text-xs font-bold text-red-400 flex items-center gap-0.5"><TrendingDown className="w-3 h-3"/>{fmtPct(MARKET_PULSE[c.dbId]?.change7d||0)}</div><div className="text-[10px] text-zinc-500">7d</div></div>
          </div>
        );})}
        {warnings.upcoming.map(r=>(
          <div key={r.id} className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0"><Flame className="w-5 h-5 text-red-400"/></div>
            <div className="flex-1 min-w-0"><div className="text-sm font-bold text-white">{r.title} dropping soon</div><div className="text-[11px] text-zinc-400">{r.notes}</div></div>
            <div className="text-[11px] font-bold text-amber-400 flex-shrink-0">in {Math.ceil((new Date(r.date)-new Date())/864e5)}d</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RECENT SALES FEED ────────────────────────────────────────────────────────
export function RecentSalesFeed({ cards, onSelectCard }) {
  const ownedIds = new Set(cards.filter(c=>c.status==='holding').map(c=>c.dbId));
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400"/><div><div className="text-sm font-semibold text-white">Recent Sales</div><div className="text-[11px] text-zinc-500">Last 7 days · live marketplace activity</div></div></div>
      <div className="divide-y divide-zinc-800">
        {SEED_RECENT_SALES.map(s=>{const db=CARD_DB[s.dbId],owned=ownedIds.has(s.dbId),cardId=cards.find(c=>c.dbId===s.dbId&&c.status==='holding')?.id;return(
          <button key={s.id} onClick={()=>cardId&&onSelectCard(cardId)} disabled={!cardId} className={cx('w-full flex items-center gap-3 p-3 text-left',cardId?'hover:bg-zinc-800/50':'cursor-default')}>
            <div className="w-9 h-12 flex-shrink-0"><CardImg dbId={s.dbId} className="w-full h-full"/></div>
            <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-medium text-white truncate">{db.name}</span>{owned&&<span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1 py-0.5 rounded uppercase">Owned</span>}</div><div className="text-[11px] text-zinc-500">{s.condition} · {s.source} · {s.date}</div></div>
            <div className="text-sm font-bold text-white tabular-nums">{fmt(s.price)}</div>
          </button>
        );})}
      </div>
    </div>
  );
}

// ─── REALIZED LEDGER ─────────────────────────────────────────────────────────
export function RealizedLedger({ cards }) {
  const sold = [...cards.filter(c=>c.status==='sold')].sort((a,b)=>new Date(b.sellDate)-new Date(a.sellDate));
  if (!sold.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2"><History className="w-4 h-4 text-cyan-400"/><div className="text-sm font-semibold text-white">Realized Ledger</div></div>
      <div className="divide-y divide-zinc-800">
        {sold.slice(0,5).map(c=>{const db=CARD_DB[c.dbId],r=realizedPL(c),q=getTotalQty(c);return(
          <div key={c.id} className="flex items-center gap-3 p-3">
            <div className="w-9 h-12 flex-shrink-0"><CardImg dbId={c.dbId} className="w-full h-full"/></div>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium text-white truncate">{db.name}{q>1&&<span className="text-zinc-500"> × {q}</span>}</div><div className="text-[11px] text-zinc-500">{db.set} · {c.condition} · Sold {c.sellDate}</div></div>
            <div className="text-right"><div className="text-sm font-bold text-white tabular-nums">{fmt(c.sellPrice*q)}</div><div className={cx('text-[11px] tabular-nums font-medium',r.absolute>=0?'text-emerald-400':'text-red-400')}>{r.absolute>=0?'+':''}{fmt(r.absolute)} ({fmtPct(r.pct)})</div></div>
          </div>
        );})}
      </div>
    </div>
  );
}

// ─── ANALYTICS VIEW ──────────────────────────────────────────────────────────
export function AnalyticsView({ cards, onClose }) {
  const sold=cards.filter(c=>c.status==='sold');
  const winners=sold.filter(c=>realizedPL(c).absolute>0), losers=sold.filter(c=>realizedPL(c).absolute<0);
  const wr=sold.length?winners.length/sold.length:0;
  const avgW=winners.length?winners.reduce((s,c)=>s+realizedPL(c).absolute,0)/winners.length:0;
  const avgL=losers.length?losers.reduce((s,c)=>s+realizedPL(c).absolute,0)/losers.length:0;
  const monthly=useMemo(()=>{const byM={};sold.forEach(c=>{if(!c.sellDate)return;const m=c.sellDate.slice(0,7);byM[m]=(byM[m]||0)+realizedPL(c).absolute;});return Object.entries(byM).sort().map(([m,pnl])=>({month:new Date(m+'-01').toLocaleString('en',{month:'short',year:'2-digit'}),pnl:Math.round(pnl)}));},[sold]);
  const sortedClosed=[...sold].sort((a,b)=>realizedPL(b).absolute-realizedPL(a).absolute);
  const TradeList=({title,icon:Icon,color,trades})=>(
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2"><Icon className={cx('w-4 h-4',color)}/><div className="text-sm font-semibold text-white">{title}</div></div>
      <div className="divide-y divide-zinc-800">{trades.length>0?trades.map(c=>{const db=CARD_DB[c.dbId],r=realizedPL(c);return(<div key={c.id} className="flex items-center gap-3 p-3"><div className="w-9 h-12 flex-shrink-0"><CardImg dbId={c.dbId} className="w-full h-full"/></div><div className="flex-1 min-w-0"><div className="text-sm font-medium text-white truncate">{db.name}</div><div className="text-[11px] text-zinc-500">{c.condition} · {c.sellDate}</div></div><div className="text-right"><div className={cx('text-sm font-bold tabular-nums',r.absolute>=0?'text-emerald-400':'text-red-400')}>{r.absolute>=0?'+':''}{fmt(r.absolute)}</div><div className="text-[10px] text-zinc-500">{fmtPct(r.pct)}</div></div></div>)}):<div className="p-6 text-center text-xs text-zinc-500">No closed positions yet</div>}</div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-40 bg-zinc-950 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-5 py-3 flex items-center gap-3">
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><X className="w-4 h-4"/></button>
        <div><div className="text-xs text-zinc-500 uppercase tracking-widest">Analytics</div><div className="text-lg font-bold text-white">Trading Performance</div></div>
      </div>
      <div className="max-w-5xl mx-auto px-5 py-6 pb-28 space-y-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-cyan-400"/><div className="text-sm font-semibold text-white">Monthly P&L</div></div>
          <div className="p-4 h-52">{monthly.length>0?(<ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}><XAxis dataKey="month" tick={{fill:'#71717a',fontSize:11}} axisLine={{stroke:'#27272a'}} tickLine={false}/><YAxis tick={{fill:'#71717a',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>'$'+v}/><Tooltip contentStyle={{background:'#18181b',border:'1px solid #3f3f46',borderRadius:8,fontSize:12}} formatter={v=>[fmt(v),'P&L']}/><ReferenceLine y={0} stroke="#52525b"/><Bar dataKey="pnl">{monthly.map((e,i)=><Cell key={i} fill={e.pnl>=0?'#34d399':'#f87171'}/>)}</Bar></BarChart></ResponsiveContainer>):<div className="h-full flex items-center justify-center text-sm text-zinc-500">Close positions to see monthly P&L</div>}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatChip label="Win Rate" value={sold.length?wr.toFixed(0)+'%':'—'} sub={`${winners.length}/${sold.length} profitable`} tone={wr>=0.6?'up':'default'} icon={Trophy}/>
          <StatChip label="Avg Winner" value={fmt(avgW)} sub={winners.length+' wins'} tone="up" icon={TrendingUp}/>
          <StatChip label="Avg Loser" value={fmt(avgL)} sub={losers.length+' losses'} tone="down" icon={TrendingDown}/>
          <StatChip label="Closed" value={sold.length} sub="all-time" icon={Archive}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TradeList title="Best Trades" icon={Crown} color="text-emerald-400" trades={sortedClosed.slice(0,3)}/>
          <TradeList title="Worst Trades" icon={TrendingDown} color="text-red-400" trades={sortedClosed.slice(-3).reverse()}/>
        </div>
      </div>
    </div>
  );
}

// ─── CARD GRID ────────────────────────────────────────────────────────────────
export function CardGrid({ cards, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {cards.map(c => {
        const db=CARD_DB[c.dbId], g=unrealizedPL(c), h=generateHistory(c);
        return (
          <button key={c.id} onClick={() => onSelect(c.id)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-left hover:border-zinc-700 transition group">
            <div className="aspect-[2.5/3.5] mb-2 relative"><CardImg dbId={c.dbId} className="w-full h-full group-hover:scale-[1.02] transition-transform duration-300"/>{c.condition.startsWith('PSA')&&<div className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">{c.condition}</div>}</div>
            <div className="text-xs font-medium text-white truncate">{db.name}</div>
            <div className="text-[10px] text-zinc-500 truncate mb-1.5">{db.set}</div>
            <div className="flex items-end justify-between"><div><div className="text-sm font-bold text-white">{fmt(g.current)}</div><div className={cx('text-[10px] font-medium',g.pct>=0?'text-emerald-400':'text-red-400')}>{fmtPct(g.pct)}</div></div><div className="w-12 h-6"><Sparkline data={h.slice(-30)} color={g.pct>=0?'#34d399':'#f87171'} height={24}/></div></div>
          </button>
        );
      })}
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
export function Dashboard({ cards, selectCard, onManualAdd, dismissedInsights, onDismissInsight, onOpenAnalytics, setView }) {
  const [range, setRange] = useState('1M');
  const [compact, setCompact] = useState(false);
  const holdings = cards.filter(c => c.status === 'holding');
  const tv=holdings.reduce((s,c)=>s+getCardValue(c)*getTotalQty(c),0), tc=holdings.reduce((s,c)=>s+getTotalCost(c),0);
  const gain=tv-tc, gainPct=tc?(gain/tc)*100:0;
  const hists = useMemo(() => holdings.map(c => generateHistory(c)), [holdings]);
  const d1=hists.reduce((s,h)=>s+(h[h.length-2]?.price||0),0), ch24=tv-d1, ch24p=d1?(ch24/d1)*100:0;
  const wg=holdings.map(c=>({c,...unrealizedPL(c),d24:card24hDelta(c)}));
  const topG=[...wg].sort((a,b)=>b.pct-a.pct)[0], topL=[...wg].sort((a,b)=>a.pct-b.pct)[0];
  const chartData=useMemo(()=>{if(!hists.length)return[];const dMap={'1W':7,'1M':30,'3M':90,'1Y':365,'ALL':365};const days=dMap[range],start=Math.max(0,hists[0].length-days-1);return hists[0].slice(start).map((_,i)=>{const ri=start+i;return{date:hists[0][ri].date,value:Math.round(hists.reduce((s,h)=>s+(h[ri]?.price||0),0))};});},[hists,range]);
  const up=chartData.length?chartData[chartData.length-1].value>=chartData[0].value:true, clr=up?'#34d399':'#f87171';

  if (!holdings.length) return (
    <div className="max-w-5xl mx-auto px-5 py-12 pb-28">
      <EmptyState icon={Package} title="Your portfolio is empty" body="Add your first card to start tracking market value, P&L, and performance over time." ctaLabel="Add your first card" onCta={onManualAdd}/>
      <div className="mt-8 flex items-center justify-center gap-4 text-xs text-zinc-500 flex-wrap">
        <button onClick={() => setView('scan')} className="hover:text-white transition flex items-center gap-1"><Camera className="w-3.5 h-3.5"/>Scan a card</button>
        <span>·</span>
        <button onClick={() => setView('binder')} className="hover:text-white transition flex items-center gap-1"><Heart className="w-3.5 h-3.5"/>Start a wantlist</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-5 pb-28 space-y-5">
      <div className="-mx-5"><TickerTape cards={cards} onSelectCard={selectCard}/></div>
      <div className="pt-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1"><div className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Portfolio Value</div><div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>LIVE</div></div>
            <div className="flex items-baseline gap-3 flex-wrap"><div className="text-5xl font-bold text-white tabular-nums">{fmt(tv)}</div><div className={cx('flex items-center gap-1 text-sm font-semibold',ch24>=0?'text-emerald-400':'text-red-400')}>{ch24>=0?<TrendingUp className="w-4 h-4"/>:<TrendingDown className="w-4 h-4"/>}{fmt(Math.abs(ch24))} ({fmtPct(ch24p)}) <span className="text-zinc-500 font-normal">· 24h</span></div></div>
            <div className={cx('text-xs mt-1',gain>=0?'text-emerald-500':'text-red-500')}>Unrealized {gain>=0?'+':''}{fmt(gain)} ({fmtPct(gainPct)})</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={onOpenAnalytics} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border border-zinc-700 text-white text-sm font-semibold rounded-lg hover:bg-zinc-700 transition"><BarChart3 className="w-4 h-4"/>Analytics</button>
            <button onClick={onManualAdd} className="flex items-center gap-1.5 px-3 py-2 bg-white text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-100 transition"><Plus className="w-4 h-4"/>Add Card</button>
            <div className="flex gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">{['1W','1M','3M','1Y','ALL'].map(r=>(<button key={r} onClick={()=>setRange(r)} className={cx('px-3 py-1 text-xs font-semibold rounded transition',range===r?'bg-zinc-700 text-white':'text-zinc-500 hover:text-zinc-300')}>{r}</button>))}</div>
            <button onClick={() => setCompact(c=>!c)} className={cx('flex items-center gap-1.5 px-3 py-2 border text-xs font-semibold rounded-lg transition',compact?'bg-zinc-700 border-zinc-600 text-white':'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white')}>{compact?'Full View':'Summary'}</button>
          </div>
        </div>
        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:10,right:0,left:0,bottom:0}}><defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={clr} stopOpacity={0.35}/><stop offset="100%" stopColor={clr} stopOpacity={0}/></linearGradient></defs><XAxis dataKey="date" hide/><YAxis domain={['dataMin - 100','dataMax + 100']} hide/><Tooltip contentStyle={{background:'#18181b',border:'1px solid #3f3f46',borderRadius:8,fontSize:12}} formatter={v=>[fmt(v),'Portfolio']}/><Area type="monotone" dataKey="value" stroke={clr} strokeWidth={2.5} fill="url(#pg)"/></AreaChart></ResponsiveContainer></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip label="Holdings" value={holdings.length} sub={new Set(holdings.map(c=>CARD_DB[c.dbId]?.set)).size+' sets'} icon={Package} onClick={()=>setView('binder')}/>
        <StatChip label="24h Change" value={fmt(Math.abs(ch24))} sub={ch24>=0?'gained':'dropped'} tone={ch24>=0?'up':'down'} icon={Activity} delta24h={ch24p} onClick={onOpenAnalytics}/>
        <StatChip label="Top Gainer" value={topG?fmtPct(topG.pct):'—'} sub={topG?CARD_DB[topG.c.dbId]?.name:''} tone="up" icon={TrendingUp} delta24h={topG?topG.d24.pct:null} onClick={topG?()=>selectCard(topG.c.id):undefined}/>
        <StatChip label="Top Loser" value={topL?fmtPct(topL.pct):'—'} sub={topL?CARD_DB[topL.c.dbId]?.name:''} tone={topL&&topL.pct<0?'down':'default'} icon={TrendingDown} delta24h={topL?topL.d24.pct:null} onClick={topL?()=>selectCard(topL.c.id):undefined}/>
      </div>
      <PnLPanel cards={cards}/>
      <CostBasisChart cards={cards}/>
      {!compact && <>
        <SetRotationWarnings cards={cards}/>
        <DiversificationScore cards={cards}/>
        <MarketIntelligence cards={cards} onSelect={selectCard}/>
        <RecentSalesFeed cards={cards} onSelectCard={selectCard}/>
        <RealizedLedger cards={cards}/>
      </>}
    </div>
  );
}


// src/components/tools.jsx
import React, { useState, useMemo } from 'react';
import { Plus, X, Trash2, Calculator, Brain, Award, Search, DollarSign, Package, TrendingUp, TrendingDown, Check, AlertCircle, Loader2, Camera, ChevronRight } from 'lucide-react';
import { CARD_DB, ALL_CONDITIONS, SCAN_LIMIT } from '../data.js';
import { fmt, fmtPct, cx, todayStr, getCardValue, getTotalQty, getTotalCost, BLANK_TC, tradeCardVal, tradeSideTotal } from '../utils.js';
import { CardImg } from './ui.jsx';
import { calcGradeROI, gradeProbDist } from '../utils.js';

// ─── TRADE SIDE (module-level — prevents remount on keystroke) ────────────────
function TradeSide({ side, setSide, label, accentClass }) {
  const addCard = () => setSide(s => ({ ...s, cards: [...s.cards, BLANK_TC()] }));
  const removeCard = id => setSide(s => ({ ...s, cards: s.cards.filter(c => c.id !== id) }));
  const updateCard = (id, field, val) => setSide(s => ({ ...s, cards: s.cards.map(c => c.id===id?{...c,[field]:val}:c) }));
  const totals = tradeSideTotal(side);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex-1">
      <div className={cx('px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between', accentClass)}>
        <div className="text-sm font-bold text-white">{label}</div>
        <div className="text-xl font-bold text-white tabular-nums">{fmt(totals.adj)}</div>
      </div>
      <div className="p-3 space-y-2">
        {side.cards.map(card => {
          const db = card.dbId ? CARD_DB[card.dbId] : null;
          const mktPrice = db ? (card.condition.startsWith('PSA') ? db.pricing.psa[parseInt(card.condition.slice(3),10)]||db.pricing.raw.NM : db.pricing.raw[card.condition]||db.pricing.raw.NM) : 0;
          return (
            <div key={card.id} className="bg-zinc-950 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <select value={card.dbId} onChange={e => updateCard(card.id,'dbId',e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none min-w-0">
                  <option value="">Select card…</option>
                  {Object.entries(CARD_DB).map(([id,d]) => <option key={id} value={id}>{d.name}</option>)}
                </select>
                {side.cards.length > 1 && <button onClick={() => removeCard(card.id)} className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:text-red-400 flex-shrink-0"><X className="w-3.5 h-3.5"/></button>}
              </div>
              {card.dbId && (
                <div className="flex gap-2">
                  <select value={card.condition} onChange={e => updateCard(card.id,'condition',e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none w-24">
                    {ALL_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">$</span>
                    <input type="number" value={card.customPrice} onChange={e => updateCard(card.id,'customPrice',e.target.value)} placeholder={String(mktPrice)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-5 pr-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none"/>
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center tabular-nums w-16 text-right">{fmt(tradeCardVal(card))}</div>
                </div>
              )}
            </div>
          );
        })}
        <button onClick={addCard} className="w-full py-1.5 border border-dashed border-zinc-700 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition flex items-center justify-center gap-1"><Plus className="w-3 h-3"/>Add card</button>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Cash (+/-)</div><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">$</span><input type="number" value={side.cash} onChange={e => setSide(s=>({...s,cash:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-5 pr-2 py-1.5 text-xs text-white focus:outline-none"/></div></div>
          <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Value % of cards</div><div className="relative"><input type="number" value={side.pct} min="0" max="200" onChange={e => setSide(s=>({...s,pct:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 pr-6 py-1.5 text-xs text-white focus:outline-none"/><span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">%</span></div></div>
        </div>
        <div className="text-xs text-zinc-500 flex justify-between pt-1 border-t border-zinc-800"><span>Cards total</span><span className="text-zinc-300 tabular-nums">{fmt(totals.cv)}</span></div>
        <div className="text-xs font-bold flex justify-between"><span className="text-zinc-300">Side total</span><span className="text-white tabular-nums">{fmt(totals.adj)}</span></div>
      </div>
    </div>
  );
}

// ─── TRADE CALCULATOR ────────────────────────────────────────────────────────
function TradeCalculator() {
  const [left, setLeft] = useState({ cards:[BLANK_TC()], cash:'0', pct:'100' });
  const [right, setRight] = useState({ cards:[BLANK_TC()], cash:'0', pct:'100' });
  const lt = tradeSideTotal(left), rt = tradeSideTotal(right);
  const diff = lt.adj - rt.adj, fair = Math.abs(diff) < 5;
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <TradeSide side={left} setSide={setLeft} label="You Give" accentClass="bg-red-500/10"/>
        <TradeSide side={right} setSide={setRight} label="You Get" accentClass="bg-emerald-500/10"/>
      </div>
      <div className={cx('rounded-xl p-4 border-2 text-center', fair?'bg-emerald-500/10 border-emerald-500/40':Math.abs(diff)<20?'bg-amber-500/10 border-amber-500/40':'bg-red-500/10 border-red-500/40')}>
        <div className={cx('text-lg font-black mb-1', fair?'text-emerald-300':Math.abs(diff)<20?'text-amber-300':'text-red-300')}>{fair?'Fair Trade!':Math.abs(diff)<20?'Close enough':diff>0?'You\'re overpaying':'You\'re getting the better deal'}</div>
        {!fair && <div className="text-sm text-zinc-300">Difference: <span className="font-bold">{fmt(Math.abs(diff))}</span> {diff > 0 ? '— add cash or remove cards from your side' : '— ask for cash or more cards'}</div>}
        <div className="text-xs text-zinc-500 mt-1 tabular-nums">Give {fmt(lt.adj)} · Get {fmt(rt.adj)}</div>
      </div>
    </div>
  );
}

// ─── AI PRE-GRADE TAB ─────────────────────────────────────────────────────────
function AIPreGradeTab({ scanCount, onScanUsed }) {
  const [stage, setStage] = useState('idle'), [result, setResult] = useState(null), [preview, setPreview] = useState(null), [error, setError] = useState(null);
  const [fileRef] = useState(() => { if (typeof document !== 'undefined') { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; return i; } return null; });
  const remaining = Math.max(0, SCAN_LIMIT - scanCount), atLimit = remaining === 0;

  const handleFile = async file => {
    if (!file || atLimit) return;
    const reader = new FileReader();
    reader.onload = async e => {
      const b64 = e.target.result.split(',')[1]; setPreview(e.target.result); setStage('analyzing'); setError(null);
      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:file.type||'image/jpeg',data:b64}},{type:'text',text:'Expert Pokémon TCG grader. Respond ONLY with valid JSON:\n{"cardName":"","set":"","centering":0,"surface":0,"edges":0,"corners":0,"estimatedGrade":"PSA 9","estimatedValueRaw":0,"estimatedValueGraded":0,"notes":"","flaws":[]}'}]}]})});
        const data = await resp.json(); const text = data.content.filter(b=>b.type==='text').map(b=>b.text).join('');
        setResult(JSON.parse(text.replace(/```json|```/g,'').trim())); setStage('result'); onScanUsed();
      } catch(err) { setError('Analysis failed. '+err.message); setStage('error'); }
    };
    reader.readAsDataURL(file);
  };

  const demoScan = () => {
    if (atLimit) return; setPreview(null); setStage('analyzing');
    setTimeout(()=>{ setResult({cardName:'Moonbreon — Umbreon VMAX Alt Art',set:'Evolving Skies',centering:8.5,surface:9.0,edges:8.5,corners:9.0,estimatedGrade:'PSA 9',estimatedValueRaw:640,estimatedValueGraded:860,notes:'Light centering left-to-right. Surface and corners excellent.',flaws:['Slight left centering','Minor edge nick bottom-right']}); setStage('result'); onScanUsed(); },1800);
  };

  const inputRef = React.useRef(null);

  return (
    <div className="space-y-4">
      <div className={cx('rounded-xl border p-4 text-center', atLimit?'bg-red-500/5 border-red-500/20':'bg-zinc-900 border-zinc-800')}>
        <div className="text-sm font-semibold text-white mb-1">AI Pre-Grade</div>
        <div className="text-xs text-zinc-400 mb-3">{atLimit?'Scan limit reached. Upgrade to Pro for unlimited.': `${remaining} of ${SCAN_LIMIT} credits remaining`}</div>
        <div className="flex gap-2 justify-center">
          <button onClick={() => inputRef.current?.click()} disabled={atLimit} className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-100 disabled:opacity-40 transition"><Camera className="w-4 h-4"/>Upload Card</button>
          <button onClick={demoScan} disabled={atLimit} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white text-sm font-semibold rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition">Demo</button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])}/>
      </div>

      {stage==='analyzing'&&(<div className="text-center py-12">{preview&&<img src={preview} alt="" className="w-28 h-40 object-cover rounded-xl mx-auto mb-4 opacity-60"/>}<Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3"/><div className="text-sm font-semibold text-white">Grading your card…</div><div className="text-xs text-zinc-500 mt-1">AI analyzing centering, surface, edges, corners</div></div>)}
      {stage==='error'&&(<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-center"><div className="text-sm font-bold text-red-300 mb-2">Scan failed</div><div className="text-xs text-zinc-400 mb-3">{error}</div><button onClick={()=>setStage('idle')} className="px-4 py-2 bg-zinc-800 text-white text-sm rounded-lg">Try again</button></div>)}

      {stage==='result'&&result&&(<div className="space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-base font-bold text-white mb-0.5">{result.cardName}</div>
          <div className="text-xs text-zinc-400 mb-3">{result.set}</div>
          <div className="grid grid-cols-4 gap-2 mb-3">{['centering','surface','edges','corners'].map(k=>{const v=result[k];const color=v>=9?'text-emerald-400':v>=8?'text-cyan-400':v>=7?'text-amber-400':'text-red-400';return(<div key={k} className="bg-zinc-950 rounded-lg p-2 text-center"><div className="text-[9px] text-zinc-500 uppercase mb-1">{k}</div><div className={cx('text-2xl font-black',color)}>{v?.toFixed(1)}</div></div>);})}</div>
          <div className="flex items-center justify-between mb-2"><div className="text-sm text-zinc-400">Estimated Grade</div><div className="text-xl font-black text-white">{result.estimatedGrade}</div></div>
          <div className="grid grid-cols-2 gap-2 text-sm"><div className="bg-zinc-950 rounded-lg p-2"><div className="text-[10px] text-zinc-500 uppercase">Raw value</div><div className="font-bold text-white">{fmt(result.estimatedValueRaw)}</div></div><div className="bg-emerald-500/10 rounded-lg p-2"><div className="text-[10px] text-emerald-400 uppercase">Graded est.</div><div className="font-bold text-white">{fmt(result.estimatedValueGraded)}</div></div></div>
          {result.notes&&<div className="mt-3 text-xs text-zinc-300 leading-relaxed">{result.notes}</div>}
          {result.flaws?.length>0&&(<div className="mt-2"><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Notable flaws</div><div className="space-y-0.5">{result.flaws.map((f,i)=><div key={i} className="text-xs text-amber-300 flex items-center gap-1"><AlertCircle className="w-3 h-3 flex-shrink-0"/>{f}</div>)}</div></div>)}
        </div>
        <button onClick={()=>{setStage('idle');setResult(null);setPreview(null);}} className="w-full py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg hover:bg-zinc-700 transition">Grade another card</button>
      </div>)}
    </div>
  );
}

// ─── GRADING TRACKER ─────────────────────────────────────────────────────────
const STATUS_OPTS = ['submitted','shipped','received','grading','shipped_back','returned'];
const STATUS_COLORS = { submitted:'text-zinc-400 bg-zinc-500/10', shipped:'text-amber-400 bg-amber-500/10', received:'text-cyan-400 bg-cyan-500/10', grading:'text-purple-400 bg-purple-500/10', shipped_back:'text-blue-400 bg-blue-500/10', returned:'text-emerald-400 bg-emerald-500/10' };

function AddSubModal({ onClose, onAdd }) {
  const [dbId,setDbId]=useState(''), [company,setCompany]=useState('PSA'), [tier,setTier]=useState('Value'), [subDate,setSubDate]=useState(todayStr()), [returnDate,setReturnDate]=useState(''), [cost,setCost]=useState(''), [notes,setNotes]=useState('');
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full my-auto" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between"><div className="text-lg font-bold text-white">Log Submission</div><button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button></div>
        <div className="p-5 space-y-3">
          <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-1.5">Card</div><select value={dbId} onChange={e=>setDbId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"><option value="">Select card…</option>{Object.entries(CARD_DB).map(([id,d])=><option key={id} value={id}>{d.name} — {d.set}</option>)}</select></div>
          <div className="grid grid-cols-3 gap-2">
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-1.5">Company</div><select value={company} onChange={e=>setCompany(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none">{['PSA','BGS','CGC','SGC'].map(c=><option key={c}>{c}</option>)}</select></div>
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-1.5">Tier</div><select value={tier} onChange={e=>setTier(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none">{['Economy','Value','Regular','Express','Walkthrough'].map(t=><option key={t}>{t}</option>)}</select></div>
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-1.5">Cost ($)</div><input type="number" value={cost} onChange={e=>setCost(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none"/></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-1.5">Submitted</div><input type="date" value={subDate} onChange={e=>setSubDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none"/></div>
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-1.5">Expected Return</div><input type="date" value={returnDate} onChange={e=>setReturnDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none"/></div>
          </div>
          <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-1.5">Notes</div><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Hoping for PSA 9…" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none"/></div>
          <div className="flex gap-2 pt-1"><button onClick={onClose} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Cancel</button><button onClick={()=>{if(!dbId||!cost)return;onAdd({id:'gs-'+Date.now(),dbId,company,tier,submittedDate:subDate,expectedReturn:returnDate,cost:parseFloat(cost),status:'submitted',notes,result:null});}} disabled={!dbId||!cost} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold rounded-lg disabled:opacity-50">Add Submission</button></div>
        </div>
      </div>
    </div>
  );
}

function GradingTracker({ submissions, onAdd, onUpdate, onDelete }) {
  const [addOpen, setAddOpen] = useState(false);
  const active = submissions.filter(s => s.status !== 'returned');
  const returned = submissions.filter(s => s.status === 'returned');
  const SubCard = ({ s }) => {
    const db = CARD_DB[s.dbId];
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          {db&&<div className="w-10 h-14 flex-shrink-0"><CardImg dbId={s.dbId} className="w-full h-full"/></div>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-bold text-white truncate">{db?.name||s.dbId}</span>
              <span className="text-[9px] font-bold text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded">{s.company} · {s.tier}</span>
            </div>
            <div className="text-[11px] text-zinc-500">Submitted {s.submittedDate}{s.expectedReturn&&` · Est. return ${s.expectedReturn}`}</div>
            {s.notes&&<div className="text-[11px] text-zinc-400 italic mt-0.5">{s.notes}</div>}
          </div>
          <button onClick={()=>onDelete(s.id)} className="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 flex-shrink-0"><Trash2 className="w-3.5 h-3.5"/></button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-zinc-500">Status:</div>
          <select value={s.status} onChange={e=>onUpdate(s.id,{status:e.target.value})} className={cx('text-xs font-bold px-2 py-1 rounded-lg border-0 focus:outline-none cursor-pointer',STATUS_COLORS[s.status])}>
            {STATUS_OPTS.map(o=><option key={o} value={o}>{o.replace('_',' ')}</option>)}
          </select>
          <div className="text-xs text-zinc-500 ml-auto">Fee: {fmt(s.cost)}</div>
        </div>
        {s.status==='returned'&&!s.result&&(
          <div className="flex gap-2 items-center">
            <div className="text-xs text-zinc-500">Grade received:</div>
            <select defaultValue="" onChange={e=>{if(e.target.value)onUpdate(s.id,{result:{grade:e.target.value,date:todayStr()}});}} className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none">
              <option value="">Log grade…</option>{['10','9.5','9','8.5','8','7','6','5'].map(g=><option key={g} value={g}>{s.company} {g}</option>)}
            </select>
          </div>
        )}
        {s.result&&(<div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-2"><Check className="w-4 h-4 text-emerald-400"/><div className="text-sm font-bold text-white">{s.company} {s.result.grade}</div><div className="text-xs text-zinc-400 ml-auto">Returned {s.result.date}</div></div>)}
      </div>
    );
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div className="text-sm text-zinc-400">{active.length} active · {returned.length} returned</div><button onClick={()=>setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-100 transition"><Plus className="w-3.5 h-3.5"/>Log Submission</button></div>
      {submissions.length===0&&(<div className="text-center py-10 text-zinc-500"><Award className="w-10 h-10 mx-auto mb-3 text-zinc-700"/><div className="text-sm font-semibold text-white mb-1">No submissions yet</div><div className="text-xs">Track cards you've sent to PSA, BGS, or CGC.</div></div>)}
      {active.length>0&&(<div className="space-y-3"><div className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">In Progress</div>{active.map(s=><SubCard key={s.id} s={s}/>)}</div>)}
      {returned.length>0&&(<div className="space-y-3"><div className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Returned</div>{returned.map(s=><SubCard key={s.id} s={s}/>)}</div>)}
      {addOpen&&<AddSubModal onClose={()=>setAddOpen(false)} onAdd={sub=>{onAdd(sub);setAddOpen(false);}}/>}
    </div>
  );
}

// ─── DEAL SCANNER ─────────────────────────────────────────────────────────────
function DealScanner() {
  const [query,setQuery]=useState(''), [dbId,setDbId]=useState(null), [condition,setCondition]=useState('NM'), [listing,setListing]=useState('');
  const results=useMemo(()=>{const q=query.toLowerCase();return q?Object.entries(CARD_DB).filter(([,d])=>d.name.toLowerCase().includes(q)||d.set.toLowerCase().includes(q)).slice(0,6):[];},[ query]);
  const db=dbId?CARD_DB[dbId]:null;
  const market=db?(condition.startsWith('PSA')?db.pricing.psa[parseInt(condition.slice(3),10)]||db.pricing.raw.NM:db.pricing.raw[condition]||db.pricing.raw.NM):0;
  const lp=parseFloat(listing)||0, diff=lp?((lp-market)/market)*100:null;
  const verdict=diff===null?null:diff<=-15?{label:'Great Deal',color:'text-emerald-400',bg:'bg-emerald-500/10 border-emerald-500/30'}:diff<=-5?{label:'Good Deal',color:'text-emerald-300',bg:'bg-emerald-500/5 border-emerald-500/20'}:diff<=5?{label:'Fair Price',color:'text-zinc-300',bg:'bg-zinc-800 border-zinc-700'}:diff<=15?{label:'Slightly High',color:'text-amber-400',bg:'bg-amber-500/10 border-amber-500/30'}:{label:'Overpriced',color:'text-red-400',bg:'bg-red-500/10 border-red-500/30'};
  return (
    <div className="space-y-4">
      {!dbId?(<div><div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search card to scan…" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none"/></div><div className="space-y-2">{results.map(([id,d])=><button key={id} onClick={()=>{setDbId(id);setQuery('');}} className="w-full flex items-center gap-3 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 text-left"><div className="w-10 h-14 flex-shrink-0"><CardImg dbId={id} className="w-full h-full"/></div><div className="flex-1 min-w-0"><div className="text-sm font-bold text-white truncate">{d.name}</div><div className="text-[11px] text-zinc-500">{d.set}</div></div><div className="text-xs text-zinc-400">{fmt(d.pricing.raw.NM)}</div></button>)}</div></div>):(
      <><div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl"><div className="w-12 h-16 flex-shrink-0"><CardImg dbId={dbId} className="w-full h-full"/></div><div className="flex-1 min-w-0"><div className="text-sm font-bold text-white">{db.name}</div><div className="text-[11px] text-zinc-500">{db.set}</div></div><button onClick={()=>{setDbId(null);setListing('');}} className="text-xs text-zinc-400 hover:text-white">Change</button></div>
      <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Condition</div><div className="grid grid-cols-5 gap-1.5">{['NM','LP','MP','HP','DMG','PSA10','PSA9','PSA8','PSA7'].map(c=><button key={c} onClick={()=>setCondition(c)} className={cx('py-1.5 text-[10px] font-semibold rounded-lg',condition===c?'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300':'bg-zinc-950 border border-zinc-800 text-zinc-400')}>{c}</button>)}</div></div>
      <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Listing Price <span className="normal-case text-zinc-600">· market: {fmt(market)}</span></div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span><input type="number" value={listing} onChange={e=>setListing(e.target.value)} placeholder="Enter listing price…" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/></div></div>
      {verdict&&(<div className={cx('rounded-xl p-4 border',verdict.bg)}><div className={cx('text-xl font-black mb-1',verdict.color)}>{verdict.label}</div><div className="text-sm text-zinc-300">{diff<0?`Save ${fmt(Math.abs(lp-market))} (${Math.abs(diff).toFixed(1)}% below market)`:`Paying ${fmt(lp-market)} (${Math.abs(diff).toFixed(1)}% above market)`}</div><div className="text-xs text-zinc-500 mt-1 tabular-nums">Listing {fmt(lp)} · Market {fmt(market)}</div></div>)}
      </>)}
    </div>
  );
}

// ─── BUNDLE EVALUATOR ─────────────────────────────────────────────────────────
function BundleEvaluator() {
  const [items,setItems]=useState([]), [asking,setAsking]=useState(''), [query,setQuery]=useState('');
  const results=useMemo(()=>{const q=query.toLowerCase();return q?Object.entries(CARD_DB).filter(([,d])=>d.name.toLowerCase().includes(q)||d.set.toLowerCase().includes(q)).slice(0,5):[];},[ query]);
  const addItem=id=>{setItems(it=>[...it,{id:'bi-'+Date.now(),dbId:id,condition:'NM'}]);setQuery('');};
  const removeItem=id=>setItems(it=>it.filter(i=>i.id!==id));
  const updateItem=(id,cond)=>setItems(it=>it.map(i=>i.id===id?{...i,condition:cond}:i));
  const totalMarket=items.reduce((s,i)=>{const db=CARD_DB[i.dbId];if(!db)return s;return s+(i.condition.startsWith('PSA')?db.pricing.psa[parseInt(i.condition.slice(3),10)]||db.pricing.raw.NM:db.pricing.raw[i.condition]||db.pricing.raw.NM);},0);
  const ap=parseFloat(asking)||0, diff=ap&&totalMarket?((ap-totalMarket)/totalMarket)*100:null;
  const verdict=diff===null?null:diff<=-20?'Great Bundle':diff<=-10?'Good Deal':diff<=0?'Fair':diff<=15?'Slightly High':'Overpriced';
  return (
    <div className="space-y-4">
      <div><div className="relative mb-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Add cards to bundle…" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none"/></div>{query&&<div className="space-y-1">{results.map(([id,d])=><button key={id} onClick={()=>addItem(id)} className="w-full flex items-center gap-3 p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 text-left"><div className="w-8 h-10 flex-shrink-0"><CardImg dbId={id} className="w-full h-full"/></div><div className="flex-1 min-w-0"><div className="text-sm font-medium text-white truncate">{d.name}</div><div className="text-[10px] text-zinc-500">{d.set}</div></div><Plus className="w-4 h-4 text-emerald-400"/></button>)}</div>}</div>
      {items.length>0&&(<>
        <div className="space-y-2">{items.map(item=>{const db=CARD_DB[item.dbId];const mv=item.condition.startsWith('PSA')?db.pricing.psa[parseInt(item.condition.slice(3),10)]||db.pricing.raw.NM:db.pricing.raw[item.condition]||db.pricing.raw.NM;return(
          <div key={item.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-2.5">
            <div className="w-9 h-12 flex-shrink-0"><CardImg dbId={item.dbId} className="w-full h-full"/></div>
            <div className="flex-1 min-w-0"><div className="text-xs font-bold text-white truncate">{db.name}</div></div>
            <select value={item.condition} onChange={e=>updateItem(item.id,e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none">{['NM','LP','MP','HP','DMG','PSA10','PSA9','PSA8','PSA7'].map(c=><option key={c}>{c}</option>)}</select>
            <div className="text-xs font-bold text-white tabular-nums w-16 text-right">{fmt(mv)}</div>
            <button onClick={()=>removeItem(item.id)} className="text-zinc-500 hover:text-red-400"><X className="w-3.5 h-3.5"/></button>
          </div>
        );})}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm"><span className="text-zinc-400">Bundle market value</span><span className="font-bold text-white">{fmt(totalMarket)}</span></div>
          <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-1.5">Asking price</div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span><input type="number" value={asking} onChange={e=>setAsking(e.target.value)} placeholder="What are they asking?" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/></div></div>
          {verdict&&(<div className={cx('rounded-xl p-3 border text-center',diff<=-10?'bg-emerald-500/10 border-emerald-500/30':diff<=0?'bg-zinc-800 border-zinc-700':'bg-red-500/10 border-red-500/30')}><div className={cx('text-lg font-black',diff<=-10?'text-emerald-400':diff<=0?'text-zinc-200':'text-red-400')}>{verdict}</div><div className="text-xs text-zinc-400 mt-0.5">{diff<0?`Save ${fmt(totalMarket-ap)} vs buying separately`:`Paying ${fmt(ap-totalMarket)} extra vs market`}</div></div>)}
        </div>
      </>)}
      {items.length===0&&query===''&&(<div className="text-center py-8 text-zinc-500 text-sm">Search for cards above to start building the bundle.</div>)}
    </div>
  );
}

// ─── VENDOR MODE ─────────────────────────────────────────────────────────────
function VendorMode({ inventory, onAdd, onSell, onRemove }) {
  const [addOpen, setAddOpen] = useState(false);
  const [sellItem, setSellItem] = useState(null);
  const FEE_RATE = 0.13;

  const active = inventory.filter(i => i.status === 'holding');
  const sold   = inventory.filter(i => i.status === 'sold');
  const totalCost    = active.reduce((s, i) => s + i.costPrice * i.qty, 0);
  const totalMarket  = active.reduce((s, i) => { const db = CARD_DB[i.dbId]; if (!db) return s; const mv = i.condition.startsWith('PSA') ? db.pricing.psa[parseInt(i.condition.slice(3),10)]||db.pricing.raw.NM : db.pricing.raw[i.condition]||db.pricing.raw.NM; return s + mv * i.qty; }, 0);
  const totalRealized = sold.reduce((s, i) => s + (i.soldPrice * i.qty - i.costPrice * i.qty), 0);

  // Add to Inventory modal
  const AddModal = () => {
    const [dbId, setDbId] = useState(''), [cond, setCond] = useState('NM'), [cost, setCost] = useState(''), [qty, setQty] = useState('1'), [query, setQuery] = useState('');
    const results = useMemo(() => { const q = query.toLowerCase(); return q ? Object.entries(CARD_DB).filter(([,d]) => d.name.toLowerCase().includes(q) || d.set.toLowerCase().includes(q)).slice(0,6) : []; }, [query]);
    const db = dbId ? CARD_DB[dbId] : null;
    const market = db ? (cond.startsWith('PSA') ? db.pricing.psa[parseInt(cond.slice(3),10)]||db.pricing.raw.NM : db.pricing.raw[cond]||db.pricing.raw.NM) : 0;
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setAddOpen(false)}>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full my-auto" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <div><div className="text-lg font-bold text-white">Add to Vendor Inventory</div><div className="text-xs text-zinc-400 mt-0.5">Separate from your personal portfolio</div></div>
            <button onClick={() => setAddOpen(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><X className="w-4 h-4"/></button>
          </div>
          <div className="p-5 space-y-4">
            {!dbId ? (
              <div>
                <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search card…" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/></div>
                <div className="space-y-1 max-h-60 overflow-y-auto">{results.map(([id,d]) => <button key={id} onClick={() => setDbId(id)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 text-left"><div className="w-9 h-12 flex-shrink-0"><CardImg dbId={id} className="w-full h-full"/></div><div className="flex-1 min-w-0"><div className="text-sm font-medium text-white truncate">{d.name}</div><div className="text-[10px] text-zinc-500">{d.set}</div></div><div className="text-xs text-zinc-400">{fmt(d.pricing.raw.NM)}</div></button>)}</div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="w-12 h-16 flex-shrink-0"><CardImg dbId={dbId} className="w-full h-full"/></div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-bold text-white">{db.name}</div><div className="text-[11px] text-zinc-500">{db.set}</div></div>
                  <button onClick={() => setDbId('')} className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800">Change</button>
                </div>
                <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Condition</div><div className="grid grid-cols-5 gap-1.5">{['NM','LP','MP','HP','DMG'].map(c => <button key={c} onClick={() => setCond(c)} className={cx('py-1.5 text-xs font-semibold rounded-lg transition', cond===c?'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300':'bg-zinc-950 border border-zinc-800 text-zinc-400')}>{c}</button>)}</div></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Cost Price <span className="normal-case text-zinc-600">· market {fmt(market)}</span></div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span><input autoFocus type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder={String(Math.round(market*0.85))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"/></div></div>
                  <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Qty</div><input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"/></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAddOpen(false)} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Cancel</button>
                  <button onClick={() => { if (!dbId || !cost) return; onAdd({ id:'vi-'+Date.now(), dbId, condition: cond, costPrice: parseFloat(cost), qty: parseInt(qty)||1, addedDate: todayStr(), status:'holding', soldPrice: null, soldDate: null }); setAddOpen(false); }} disabled={!cost} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold rounded-lg disabled:opacity-40">Add to Inventory</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Mark as Sold sheet
  const SellSheet = ({ item }) => {
    const db = CARD_DB[item.dbId];
    const market = db ? (item.condition.startsWith('PSA') ? db.pricing.psa[parseInt(item.condition.slice(3),10)]||db.pricing.raw.NM : db.pricing.raw[item.condition]||db.pricing.raw.NM) : 0;
    const [price, setPrice] = useState(String(Math.round(market*0.97)));
    const takeHome = (parseFloat(price)||0) * (1-FEE_RATE) * item.qty;
    const profit = takeHome - item.costPrice * item.qty;
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center" onClick={() => setSellItem(null)}>
        <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-zinc-700"/></div>
          <div className="px-5 pb-6 pt-3 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-16 flex-shrink-0"><CardImg dbId={item.dbId} className="w-full h-full"/></div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-white">{db?.name}</div>
                <div className="text-xs text-zinc-500">{item.condition} · Cost {fmt(item.costPrice)} × {item.qty}</div>
              </div>
            </div>
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Sold Price (per card) <span className="normal-case text-zinc-600">· market {fmt(market)}</span></div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span><input autoFocus type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"/></div></div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-zinc-950 rounded-lg p-2"><div className="text-zinc-500 mb-0.5">Sale</div><div className="font-bold text-white">{fmt((parseFloat(price)||0)*item.qty)}</div></div>
              <div className="bg-zinc-950 rounded-lg p-2"><div className="text-zinc-500 mb-0.5">After fees</div><div className="font-bold text-white">{fmt(takeHome)}</div></div>
              <div className={cx('rounded-lg p-2', profit>=0?'bg-emerald-500/10':'bg-red-500/10')}><div className={cx('mb-0.5', profit>=0?'text-emerald-400':'text-red-400')}>Profit</div><div className={cx('font-bold', profit>=0?'text-emerald-300':'text-red-300')}>{profit>=0?'+':''}{fmt(profit)}</div></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSellItem(null)} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Cancel</button>
              <button onClick={() => { onSell(item.id, parseFloat(price)||0); setSellItem(null); }} disabled={!price} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold rounded-lg disabled:opacity-40">Confirm Sale</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center"><div className="text-[10px] text-zinc-500 uppercase mb-1">Inventory Cost</div><div className="text-base font-bold text-white">{fmt(totalCost)}</div></div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center"><div className="text-[10px] text-zinc-500 uppercase mb-1">Market Value</div><div className="text-base font-bold text-emerald-400">{fmt(totalMarket)}</div></div>
        <div className={cx('border rounded-xl p-3 text-center', totalRealized>=0?'bg-emerald-500/5 border-emerald-500/20':'bg-zinc-900 border-zinc-800')}><div className="text-[10px] text-zinc-500 uppercase mb-1">Realized</div><div className={cx('text-base font-bold', totalRealized>=0?'text-emerald-400':'text-red-400')}>{totalRealized>=0?'+':''}{fmt(totalRealized)}</div></div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500">{active.length} active · {sold.length} sold · 13% fee rate</div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-100 transition"><Plus className="w-3.5 h-3.5"/>Add Inventory</button>
      </div>

      {inventory.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-10 h-10 mx-auto text-zinc-700 mb-3"/>
          <div className="text-sm font-semibold text-white mb-1">No vendor inventory yet</div>
          <div className="text-xs text-zinc-500 mb-4">Track cards you buy to resell — separate from your personal portfolio.</div>
          <button onClick={() => setAddOpen(true)} className="px-4 py-2 bg-white text-zinc-900 text-sm font-semibold rounded-lg">Add your first card</button>
        </div>
      )}

      {/* Active inventory */}
      {active.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">In Stock</div>
          {active.map(item => {
            const db = CARD_DB[item.dbId]; if (!db) return null;
            const mv = item.condition.startsWith('PSA') ? db.pricing.psa[parseInt(item.condition.slice(3),10)]||db.pricing.raw.NM : db.pricing.raw[item.condition]||db.pricing.raw.NM;
            const listAt = Math.round(mv * 0.97), takeHome = listAt * (1 - FEE_RATE), profit = takeHome - item.costPrice;
            return (
              <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-14 flex-shrink-0"><CardImg dbId={item.dbId} className="w-full h-full"/></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{db.name}</div>
                    <div className="text-[11px] text-zinc-500">{item.condition}{item.qty>1&&` · ×${item.qty}`} · In since {item.addedDate}</div>
                    <div className="flex items-center gap-3 mt-1 text-[11px]">
                      <span className="text-zinc-400">Cost {fmt(item.costPrice)}</span>
                      <span className="text-zinc-500">→</span>
                      <span className="text-white">List {fmt(listAt)}</span>
                      <span className={cx('font-semibold', profit>=0?'text-emerald-400':'text-red-400')}>{profit>=0?'+':''}{fmt(profit)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button onClick={() => setSellItem(item)} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/25 transition"><DollarSign className="w-3 h-3"/>Sold</button>
                    <button onClick={() => onRemove(item.id)} className="flex items-center justify-center px-2.5 py-1.5 bg-zinc-800 text-zinc-500 hover:text-red-400 text-xs rounded-lg transition"><Trash2 className="w-3 h-3"/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sold history */}
      {sold.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Sold</div>
          {sold.map(item => {
            const db = CARD_DB[item.dbId]; if (!db) return null;
            const revenue = item.soldPrice * item.qty * (1 - FEE_RATE);
            const profit = revenue - item.costPrice * item.qty;
            return (
              <div key={item.id} className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 opacity-80">
                <div className="w-10 h-14 flex-shrink-0"><CardImg dbId={item.dbId} className="w-full h-full"/></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{db.name}</div>
                  <div className="text-[11px] text-zinc-500">{item.condition} · Sold {item.soldDate}</div>
                  <div className="flex items-center gap-3 mt-1 text-[11px]">
                    <span className="text-zinc-400">Cost {fmt(item.costPrice)}</span>
                    <span className="text-zinc-500">→</span>
                    <span className="text-white">Sold {fmt(item.soldPrice)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={cx('text-sm font-bold tabular-nums', profit>=0?'text-emerald-400':'text-red-400')}>{profit>=0?'+':''}{fmt(profit)}</div>
                  <div className="text-[10px] text-zinc-500">after fees</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {addOpen && <AddModal/>}
      {sellItem && <SellSheet item={sellItem}/>}
    </div>
  );
}

// ─── TOOLS VIEW ──────────────────────────────────────────────────────────────
export function ToolsView({ cards, collections, scanCount, onScanUsed, onAddCard, gradingSubs, onGradingAdd, onGradingUpdate, onGradingDelete, vendorInventory, onVendorAdd, onVendorSell, onVendorRemove }) {
  const [tool, setTool] = useState('trade');
  const TOOLS = [
    { id:'trade',   label:'Trade Calc' },
    { id:'pregrade',label:'AI Pre-Grade' },
    { id:'grading', label:'Grading' },
    { id:'deal',    label:'Deal Scanner' },
    { id:'bundle',  label:'Bundle' },
    { id:'vendor',  label:'Vendor' },
  ];
  return (
    <div className="max-w-5xl mx-auto pb-28">
      <div className="sticky top-[57px] z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-5 py-3">
        <div className="flex gap-1 overflow-x-auto">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} className={cx('flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition', tool===t.id?'bg-zinc-800 text-white':'text-zinc-500 hover:text-zinc-300')}>{t.label}</button>
          ))}
        </div>
      </div>
      <div className="px-5 py-4">
        {tool==='trade'   && <TradeCalculator/>}
        {tool==='pregrade'&& <AIPreGradeTab scanCount={scanCount} onScanUsed={onScanUsed}/>}
        {tool==='grading' && <GradingTracker submissions={gradingSubs} onAdd={onGradingAdd} onUpdate={onGradingUpdate} onDelete={onGradingDelete}/>}
        {tool==='deal'    && <DealScanner/>}
        {tool==='bundle'  && <BundleEvaluator/>}
        {tool==='vendor'  && <VendorMode inventory={vendorInventory||[]} onAdd={onVendorAdd} onSell={onVendorSell} onRemove={onVendorRemove}/>}
      </div>
    </div>
  );
}


// src/components/scan.jsx
import React, { useState, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { Search, Plus, X, TrendingUp, TrendingDown, ChevronRight, Camera, Loader2, ArrowLeft } from 'lucide-react';
import { CARD_DB, ALL_CONDITIONS, RAW_CONDITIONS, MARKET_PULSE, SCAN_LIMIT } from '../data.js';
import { fmt, cx, todayStr } from '../utils.js';
import { CardImg } from './ui.jsx';

// Fuse.js index built once from CARD_DB
const fuseIndex = new Fuse(
  Object.entries(CARD_DB).map(([id, db]) => ({ id, ...db })),
  { keys: ['name', 'set', 'number'], threshold: 0.4, includeScore: true }
);

// List-style card row used in search results
export function CatalogCard({ dbId, onQuickAdd }) {
  const [expanded, setExpanded] = useState(false);
  const db = CARD_DB[dbId]; if (!db) return null;
  const pulse = MARKET_PULSE[dbId];
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-3 flex-1 text-left min-w-0">
          <div className="w-12 h-16 flex-shrink-0"><CardImg dbId={dbId} className="w-full h-full"/></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{db.name}</div>
            <div className="text-[11px] text-zinc-500">{db.set} · {db.rarity}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm font-bold text-white">{fmt(db.pricing.raw.NM)}</span>
              {pulse && <span className={cx('text-[10px] font-bold flex items-center gap-0.5', pulse.change7d >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {pulse.change7d >= 0 ? <TrendingUp className="w-2.5 h-2.5"/> : <TrendingDown className="w-2.5 h-2.5"/>}
                {Math.abs(pulse.change7d).toFixed(1)}% 7d
              </span>}
            </div>
          </div>
          <ChevronRight className={cx('w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform', expanded && 'rotate-90')}/>
        </button>
        <button onClick={e => { e.stopPropagation(); onQuickAdd(dbId); }}
          className="w-9 h-9 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 transition flex-shrink-0 active:scale-95">
          <Plus className="w-5 h-5"/>
        </button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 border-t border-zinc-800 pt-3 space-y-3">
          <div className="grid grid-cols-5 gap-1.5">{RAW_CONDITIONS.map(c => <div key={c} className="bg-zinc-950 rounded-lg p-2 text-center"><div className="text-[9px] text-zinc-500 uppercase">{c}</div><div className="text-xs font-bold text-white">{fmt(db.pricing.raw[c])}</div></div>)}</div>
          {db.pricing.psa && <div className="grid grid-cols-4 gap-1.5">{Object.entries(db.pricing.psa).slice(0,4).map(([g,p]) => <div key={g} className="bg-zinc-950 rounded-lg p-2 text-center"><div className="text-[9px] text-zinc-500">PSA {g}</div><div className="text-xs font-bold text-white">{fmt(p)}</div></div>)}</div>}
          {pulse && <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5"><div className="text-[10px] text-zinc-500 mb-1">Market note</div><div className="text-xs text-zinc-300">{pulse.summary}</div></div>}
          <button onClick={() => onQuickAdd(dbId)} className="w-full py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold rounded-lg hover:bg-emerald-500/25 transition flex items-center justify-center gap-2"><Plus className="w-4 h-4"/>Add to Portfolio</button>
        </div>
      )}
    </div>
  );
}

// Grid-style card tile used in the catalog browse view
function CatalogCardTile({ dbId, onQuickAdd }) {
  const db = CARD_DB[dbId]; if (!db) return null;
  const pulse = MARKET_PULSE[dbId];
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
      <div className="relative">
        <button onClick={() => onQuickAdd(dbId)} className="block w-full">
          <div className="aspect-[3/4] bg-zinc-950 p-2">
            <CardImg dbId={dbId} className="w-full h-full object-contain"/>
          </div>
        </button>
        {/* Always-visible + button */}
        <button onClick={() => onQuickAdd(dbId)}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-lg transition active:scale-90">
          <Plus className="w-4 h-4 text-zinc-950"/>
        </button>
      </div>
      <div className="px-2.5 pb-2.5 pt-2 flex flex-col gap-0.5">
        <div className="text-xs font-bold text-white truncate leading-tight">{db.name}</div>
        <div className="text-[10px] text-zinc-500 truncate">{db.set}</div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-bold text-white">{fmt(db.pricing.raw.NM)}</span>
          {pulse && <span className={cx('text-[9px] font-bold', pulse.change7d >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {pulse.change7d >= 0 ? '+' : ''}{pulse.change7d.toFixed(1)}%
          </span>}
        </div>
      </div>
    </div>
  );
}

export function QuickAddSheet({ dbId, collections, onClose, onAdd }) {
  const db = CARD_DB[dbId]; if (!db) return null;
  const [cond, setCond] = useState('NM'), [price, setPrice] = useState(''), [colId, setColId] = useState(collections[0]?.id || '');
  const market = cond.startsWith('PSA') ? db.pricing.psa[parseInt(cond.slice(3), 10)] || db.pricing.raw.NM : db.pricing.raw[cond] || db.pricing.raw.NM;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center" onClick={onClose}>
      <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-zinc-700"/></div>
        <div className="px-5 pb-6 pt-3 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-16 flex-shrink-0"><CardImg dbId={dbId} className="w-full h-full"/></div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-white truncate">{db.name}</div>
              <div className="text-xs text-zinc-500">{db.set}</div>
              <div className="text-sm font-bold text-white mt-0.5">{fmt(market)} <span className="text-xs text-zinc-500 font-normal">market ({cond})</span></div>
            </div>
          </div>
          <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Condition</div><div className="grid grid-cols-5 gap-1.5">{ALL_CONDITIONS.map(c => <button key={c} onClick={() => { setCond(c); setPrice(''); }} className={cx('py-1.5 text-xs font-semibold rounded-lg transition', cond===c?'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300':'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200')}>{c}</button>)}</div></div>
          <div className="grid grid-cols-2 gap-3">
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Price Paid</div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span><input autoFocus type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder={String(Math.round(market*0.9))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"/></div></div>
            <div><div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Binder</div><select value={colId} onChange={e=>setColId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none">{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <button onClick={()=>{ if(!price||!colId)return; onAdd({id:'c-'+Date.now(),dbId,condition:cond,lots:[{id:'L-'+Date.now(),price:parseFloat(price),date:todayStr(),qty:1}],status:'holding'},colId); onClose(); }} disabled={!price||!colId} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold rounded-xl disabled:opacity-40 transition active:scale-[0.98]">Add to {collections.find(c=>c.id===colId)?.name||'Portfolio'}</button>
        </div>
      </div>
    </div>
  );
}

export function ScanView({ onAddCard, collections, scanCount, onScanUsed }) {
  const [stage, setStage] = useState('idle'), [result, setResult] = useState(null), [preview, setPreview] = useState(null), [error, setError] = useState(null);
  const [colId, setColId] = useState(collections[0]?.id||''), [searchQ, setSearchQ] = useState(''), [quickAddId, setQuickAddId] = useState(null), [mode, setMode] = useState('catalog');
  const [cameraImg, setCameraImg] = useState(null);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const remaining = Math.max(0, SCAN_LIMIT - scanCount), atLimit = remaining === 0;

  // Fuzzy search via Fuse.js, falls back to full catalog when query is empty
  const searchResults = useMemo(() => {
    const q = searchQ.trim();
    if (!q) return Object.keys(CARD_DB);
    return fuseIndex.search(q).map(r => r.item.id);
  }, [searchQ]);

  const handleFile = async file => {
    if (!file||atLimit) return;
    const reader = new FileReader();
    reader.onload = async e => {
      const b64 = e.target.result.split(',')[1]; setPreview(e.target.result); setStage('analyzing'); setError(null);
      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:file.type||'image/jpeg',data:b64}},{type:'text',text:'You are an expert Pokémon TCG analyst. Respond ONLY with valid JSON:\n{"identified":true,"cardName":"","set":"","number":"","year":0,"rarity":"","estimatedValueUSD":0,"preGrade":{"centering":0,"surface":0,"edges":0,"corners":0,"estimatedGrade":"","notes":""},"_demoDbId":"charizard-ex"}'}]}]})});
        const data = await resp.json(); const text = data.content.filter(b=>b.type==='text').map(b=>b.text).join('');
        setResult(JSON.parse(text.replace(/```json|```/g,'').trim())); setStage('result'); onScanUsed();
      } catch(err) { setError('Analysis failed. '+err.message); setStage('error'); }
    };
    reader.readAsDataURL(file);
  };

  const demoScan = () => {
    if (atLimit) return; setPreview(null); setStage('analyzing');
    setTimeout(()=>{ setResult({identified:true,cardName:'Charizard ex (SIR)',set:'Obsidian Flames',number:'199/197',year:2023,rarity:'Special Illustration Rare',estimatedValueUSD:105,preGrade:{centering:8.5,surface:9,edges:9,corners:8.5,estimatedGrade:'PSA 9',notes:'Slight centering offset. Surface and edges excellent.'},_demoDbId:'charizard-ex'}); setStage('result'); onScanUsed(); },1400);
  };

  const confirmAdd = () => { onAddCard({id:'c-'+Date.now(),dbId:result._demoDbId||'charizard-ex',condition:'NM',lots:[{id:'L-'+Date.now(),price:result.estimatedValueUSD||100,date:todayStr(),qty:1}],status:'holding'},colId,result.preGrade); setStage('idle'); setResult(null); setPreview(null); };
  const showingResults = searchQ.trim().length > 0 || !!cameraImg;

  const handleCameraFile = file => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCameraImg(url);
    setSearchQ('');
  };

  const clearCamera = () => { setCameraImg(null); };

  return (
    <div className="max-w-4xl mx-auto pb-28">
      <div className="sticky top-[57px] z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-5 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/>
          <input value={searchQ} onChange={e=>{setSearchQ(e.target.value);setCameraImg(null);}} placeholder="Search cards — typos OK…" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-16 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"/>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {(searchQ || cameraImg) && <button onClick={()=>{setSearchQ('');clearCamera();}} className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300"><X className="w-3 h-3"/></button>}
            <button onClick={()=>cameraRef.current?.click()} className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-emerald-400 transition" title="Scan a card photo">
              <Camera className="w-4 h-4"/>
            </button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>handleCameraFile(e.target.files?.[0])}/>
        </div>
        {!showingResults&&<div className="flex gap-2"><button onClick={()=>setMode('catalog')} className={cx('flex-1 py-2 text-xs font-semibold rounded-lg transition',mode==='catalog'?'bg-zinc-800 text-white':'text-zinc-500 hover:text-zinc-300')}>Browse Catalog</button><button onClick={()=>setMode('scan')} className={cx('flex-1 py-2 text-xs font-semibold rounded-lg transition',mode==='scan'?'bg-zinc-800 text-white':'text-zinc-500 hover:text-zinc-300')}>Scan</button></div>}
      </div>

      <div className="px-5 py-4">
        {/* Camera image scan — show preview + full catalog to pick from */}
        {cameraImg && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <img src={cameraImg} alt="Scanned card" className="w-16 h-20 object-cover rounded-lg flex-shrink-0"/>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white mb-0.5">Card photo loaded</div>
                <div className="text-xs text-zinc-400">Visual matching coming soon — pick the card below or type in the search bar.</div>
              </div>
              <button onClick={clearCamera} className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0"><X className="w-3.5 h-3.5"/></button>
            </div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">All Cards — tap to add</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.keys(CARD_DB).map(id => <CatalogCardTile key={id} dbId={id} onQuickAdd={id2 => { setQuickAddId(id2); clearCamera(); }}/>)}
            </div>
          </div>
        )}

        {/* Search results — list style so details are easy to read */}
        {!cameraImg && showingResults && (
          <div className="space-y-3">
            <div className="text-xs text-zinc-500 font-medium">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQ}&rdquo;</div>
            {searchResults.length === 0
              ? <div className="text-center py-10 text-zinc-500 text-sm">No cards found</div>
              : searchResults.map(id => <CatalogCard key={id} dbId={id} onQuickAdd={setQuickAddId}/>)
            }
          </div>
        )}

        {/* Catalog grid */}
        {!cameraImg && !showingResults && mode === 'catalog' && (
          <div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">All Cards · {Object.keys(CARD_DB).length} in database</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.keys(CARD_DB).map(id => <CatalogCardTile key={id} dbId={id} onQuickAdd={setQuickAddId}/>)}
            </div>
          </div>
        )}

        {/* Scan tab */}
        {!cameraImg && !showingResults && mode === 'scan' && (
          <div className="space-y-4">
            {stage === 'idle' && (
              <div className={cx('rounded-xl p-4 border text-center', atLimit ? 'bg-red-500/5 border-red-500/20' : 'bg-zinc-900 border-zinc-800')}>
                <div className="text-sm font-semibold text-white mb-1">AI Pre-Grade Scan</div>
                <div className="text-xs text-zinc-400 mb-3">{atLimit ? 'Daily scan limit reached.' : `${remaining} of ${SCAN_LIMIT} scans remaining today`}</div>
                <div className="flex gap-2 justify-center flex-wrap">
                  <button onClick={() => fileRef.current?.click()} disabled={atLimit} className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-100 disabled:opacity-40 transition"><Camera className="w-4 h-4"/>Upload Photo</button>
                  <button onClick={demoScan} disabled={atLimit} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white text-sm font-semibold rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition">Demo Scan</button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>handleFile(e.target.files?.[0])}/>
              </div>
            )}
            {stage === 'analyzing' && (
              <div className="text-center py-16">
                {preview && <img src={preview} alt="" className="w-32 h-44 object-cover rounded-xl mx-auto mb-4 opacity-60"/>}
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-3"/>
                <div className="text-sm font-semibold text-white">Analyzing card…</div>
                <div className="text-xs text-zinc-500 mt-1">Checking centering, surface, edges, corners</div>
              </div>
            )}
            {stage === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-center">
                <div className="text-sm font-bold text-red-300 mb-2">Scan failed</div>
                <div className="text-xs text-zinc-400 mb-4">{error}</div>
                <button onClick={() => setStage('idle')} className="px-4 py-2 bg-zinc-800 text-white text-sm rounded-lg">Try again</button>
              </div>
            )}
            {stage === 'result' && result && (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4"><div className="text-sm font-bold text-white mb-0.5">{result.cardName}</div><div className="text-xs text-zinc-400">{result.set} · Est. {fmt(result.estimatedValueUSD)}</div></div>
                {result.preGrade && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="text-xs text-zinc-500 uppercase font-semibold">Pre-Grade Assessment</div>
                    <div className="grid grid-cols-4 gap-2">{['centering','surface','edges','corners'].map(k=><div key={k} className="bg-zinc-950 rounded-lg p-2 text-center"><div className="text-[9px] text-zinc-500 uppercase">{k}</div><div className="text-lg font-bold text-white">{result.preGrade[k]?.toFixed(1)}</div></div>)}</div>
                    <div className="flex items-center justify-between"><div className="text-sm font-bold text-emerald-300">{result.preGrade.estimatedGrade}</div><div className="text-xs text-zinc-400">{result.preGrade.notes}</div></div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Add to Binder</div>
                  <select value={colId} onChange={e=>setColId(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white mb-3">{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                  <div className="flex gap-2">
                    <button onClick={()=>{setStage('idle');setResult(null);setPreview(null);}} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg">Discard</button>
                    <button onClick={confirmAdd} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold rounded-lg">Add to Portfolio</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {quickAddId && <QuickAddSheet dbId={quickAddId} collections={collections} onClose={()=>setQuickAddId(null)} onAdd={(card,col)=>{onAddCard(card,col);setQuickAddId(null);}}/>}
    </div>
  );
}

// src/components/profile.jsx
import React from 'react';
import { Crown, BarChart3, Layers, Heart, ShoppingBag, Award, Zap, TrendingUp, RotateCcw, Settings, Share2, Upload } from 'lucide-react';
import { CARD_DB, SCAN_LIMIT } from '../data.js';
import { fmt, fmtAmt, fmtPct, cx, getCardValue, getTotalQty, getTotalCost, unrealizedPL, realizedPL } from '../utils.js';

export function ProfileView({ cards, alerts, collections, wantlist, sealed, scanCount, settings, onOpenSettings, onShare, onReset, onBulkImport }) {
  const currency = settings?.currency || 'USD';
  const holdings = cards.filter(c => c.status === 'holding');
  const sold = cards.filter(c => c.status === 'sold');
  const tv = holdings.reduce((s,c)=>s+getCardValue(c)*getTotalQty(c),0);
  const tc = holdings.reduce((s,c)=>s+getTotalCost(c),0);
  const gain = tv - tc, gainPct = tc ? (gain/tc)*100 : 0;
  const realized = sold.reduce((s,c)=>s+realizedPL(c).absolute,0);
  const winners = sold.filter(c=>realizedPL(c).absolute>0);
  const winRate = sold.length ? (winners.length/sold.length)*100 : 0;
  const pctUsed = Math.min(100, (scanCount/SCAN_LIMIT)*100);
  const StatRow = ({ label, value, sub, icon: Icon, color = 'text-white' }) => (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-800 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-zinc-400"/></div>
      <div className="flex-1"><div className="text-sm font-medium text-zinc-300">{label}</div>{sub&&<div className="text-[11px] text-zinc-500">{sub}</div>}</div>
      <div className={cx('text-sm font-bold tabular-nums', color)}>{value}</div>
    </div>
  );
  return (
    <div className="max-w-2xl mx-auto px-5 py-6 pb-28 space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center relative">
        <button onClick={onOpenSettings} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition">
          <Settings className="w-4 h-4"/>
        </button>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/20">
          <div className="w-8 h-8 rounded-full bg-white border-4 border-zinc-900"/>
        </div>
        <div className="text-2xl font-bold text-white">My Portfolio</div>
        <div className="text-zinc-500 text-sm mt-0.5">PokéFolio · Card Portfolio Terminal</div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <button onClick={onShare} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition">
            <Share2 className="w-3.5 h-3.5"/>Share Portfolio
          </button>
        </div>
      </div>

      {/* Portfolio stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800"><div className="text-sm font-semibold text-white">Portfolio Summary</div></div>
        <div className="px-4">
          <StatRow label={`Total Value${currency !== 'USD' ? ` (${currency})` : ''}`} value={fmtAmt(tv, currency)} icon={BarChart3} color="text-emerald-400"/>
          <StatRow label="Unrealized Gain" value={(gain>=0?'+':'')+fmtAmt(gain, currency)} sub={fmtPct(gainPct)} icon={TrendingUp} color={gain>=0?'text-emerald-400':'text-red-400'}/>
          <StatRow label="Realized Profits" value={(realized>=0?'+':'')+fmtAmt(realized, currency)} sub={`${sold.length} closed positions`} icon={Award} color={realized>=0?'text-emerald-400':'text-red-400'}/>
          <StatRow label="Win Rate" value={sold.length?winRate.toFixed(0)+'%':'—'} sub={`${winners.length} of ${sold.length} profitable`} icon={Crown} color={winRate>=60?'text-emerald-400':'text-zinc-300'}/>
        </div>
      </div>

      {/* Collection counts */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800"><div className="text-sm font-semibold text-white">Collection</div></div>
        <div className="px-4">
          <StatRow label="Holdings" value={holdings.length} sub={`${new Set(holdings.map(c=>CARD_DB[c.dbId]?.set)).size} sets`} icon={BarChart3}/>
          <StatRow label="Binders" value={collections.length} icon={Layers}/>
          <StatRow label="Wantlist" value={wantlist.length} sub="cards tracked" icon={Heart}/>
          <StatRow label="Sealed Products" value={sealed.reduce((s,i)=>s+i.qty,0)} sub={`${sealed.length} products`} icon={ShoppingBag}/>
          <StatRow label="Active Alerts" value={alerts.filter(a=>!a.triggered).length} icon={Zap}/>
        </div>
      </div>

      {/* AI Scan usage */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-white">AI Pre-Grade Credits</div>
          <div className="text-xs text-zinc-400">{scanCount} / {SCAN_LIMIT} used today</div>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2"><div className={cx('h-full rounded-full transition-all', pctUsed>=80?'bg-red-500':pctUsed>=50?'bg-amber-500':'bg-emerald-500')} style={{width:pctUsed+'%'}}/></div>
        <div className="text-xs text-zinc-500">{Math.max(0,SCAN_LIMIT-scanCount)} credits remaining today</div>
      </div>

      {/* Pro upgrade teaser */}
      <div className="bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber-500/25 rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0"><Crown className="w-5 h-5 text-amber-400"/></div><div><div className="text-base font-bold text-white">Upgrade to Pro</div><div className="text-xs text-zinc-400 mt-0.5">Unlock unlimited AI scanning, vendor mode, and higher alert limits.</div></div></div>
        <div className="grid grid-cols-1 gap-1.5 mb-4 text-xs text-zinc-300">
          {['Unlimited AI pre-grade scans','Advanced price alerts','Vendor mode & pricing tools','Priority support'].map(f=><div key={f} className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0"/>{f}</div>)}
        </div>
        <button className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-900 text-sm font-bold rounded-xl">Upgrade to Pro — $9.99/mo</button>
      </div>

      {/* App info & reset */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800"><div className="text-sm font-semibold text-white">App</div></div>
        <div className="px-4">
          <div className="flex items-center justify-between py-3 border-b border-zinc-800"><span className="text-sm text-zinc-400">Version</span><span className="text-sm text-zinc-300">PokéFolio v0.9 Prototype</span></div>
          <div className="flex items-center justify-between py-3 border-b border-zinc-800"><span className="text-sm text-zinc-400">Data</span><span className="text-sm text-zinc-300">Local storage (prototype)</span></div>
          <div className="flex items-center justify-between py-3"><span className="text-sm text-zinc-400">Cards in DB</span><span className="text-sm text-zinc-300">{Object.keys(CARD_DB).length} cards</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={onBulkImport} className="py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
          <Upload className="w-4 h-4"/>Bulk Import
        </button>
        <button onClick={onReset} className="py-3 bg-zinc-900 border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4"/>Reset Data
        </button>
      </div>
    </div>
  );
}


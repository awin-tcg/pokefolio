// src/components/ui.jsx — Shared UI primitives
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Plus, X, Bell, BarChart3, Search, Layers, Newspaper, Calculator, Crown, Package, Info } from 'lucide-react';
import { CARD_DB, SEALED_DB, TYPE_THEMES } from '../data.js';
import { cx, fmt, fmtPct } from '../utils.js';

// ─── SVG POKEMON CARD ─────────────────────────────────────────────────────────
export function PokemonCard({ dbId, className = '' }) {
  const db = CARD_DB[dbId];
  if (!db) return <div className={cx('bg-zinc-900 rounded-md', className)} />;
  const th = TYPE_THEMES[db.type] || TYPE_THEMES.Colorless;
  const uid = 'u' + dbId.replace(/[^a-z0-9]/gi, '');
  const isSIR = /Special Illustration/i.test(db.rarity);
  const isAA  = /Alt Art/i.test(db.rarity);
  const isHolo = isSIR || isAA || /Holo|Secret/i.test(db.rarity);
  return (
    <svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={'bg-'+uid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={th.bg[0]}/><stop offset="55%" stopColor={th.bg[1]}/><stop offset="100%" stopColor={th.bg[2]}/>
        </linearGradient>
        <radialGradient id={'sp-'+uid} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor={th.accent} stopOpacity="0.5"/><stop offset="100%" stopColor={th.accent} stopOpacity="0"/>
        </radialGradient>
        {isHolo && <linearGradient id={'ho-'+uid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4081" stopOpacity={isSIR?0.28:0.14}/>
          <stop offset="33%" stopColor="#00E5FF" stopOpacity={isSIR?0.28:0.14}/>
          <stop offset="66%" stopColor="#FFEA00" stopOpacity={isSIR?0.28:0.14}/>
          <stop offset="100%" stopColor="#FF4081" stopOpacity={isSIR?0.28:0.14}/>
        </linearGradient>}
        <pattern id={'dt-'+uid} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="0.7" fill={th.accent} opacity="0.22"/>
        </pattern>
        <linearGradient id={'fr-'+uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7DC6F"/><stop offset="100%" stopColor="#D4A929"/>
        </linearGradient>
      </defs>
      <rect width="250" height="350" rx="14" fill={'url(#fr-'+uid+')'}/>
      <rect x="3" y="3" width="244" height="344" rx="12" fill="#B8891F" opacity="0.35"/>
      <rect x="8" y="8" width="234" height="334" rx="7" fill={'url(#bg-'+uid+')'}/>
      <rect x="8" y="8" width="234" height="334" rx="7" fill={'url(#dt-'+uid+')'}/>
      <rect x="8" y="8" width="234" height="334" rx="7" fill={'url(#sp-'+uid+')'}/>
      {isHolo && <rect x="8" y="8" width="234" height="334" rx="7" fill={'url(#ho-'+uid+')'}/>}
      <text x="125" y="250" fill="rgba(255,255,255,0.12)" fontSize="240" fontWeight="900" textAnchor="middle" fontFamily="Impact,system-ui">{db.name[0]}</text>
      <g opacity="0.18" stroke={th.accent} strokeWidth="1" fill="none">
        <circle cx="125" cy="180" r="72"/><circle cx="125" cy="180" r="56" strokeDasharray="2 4"/>
      </g>
      <rect x="12" y="14" width="226" height="32" rx="4" fill="rgba(0,0,0,0.55)"/>
      <text x="20" y="35" fill="white" fontSize="14" fontWeight="700" fontFamily="system-ui">{db.name.length>24?db.name.slice(0,23)+'…':db.name}</text>
      <text x="230" y="35" fill="white" fontSize="13" fontWeight="700" textAnchor="end" fontFamily="system-ui">HP {db.hp}</text>
      <g transform="translate(125,178)">
        <rect x="-46" y="-13" width="92" height="24" rx="12" fill="rgba(0,0,0,0.6)"/>
        <circle cx="-34" cy="-1" r="5" fill={th.accent}/>
        <text x="-24" y="3" fill={th.accent} fontSize="10" fontWeight="700" dominantBaseline="middle" fontFamily="system-ui" letterSpacing="2">{th.label}</text>
      </g>
      {isSIR && <g transform="translate(222,62)"><circle r="15" fill="#FFD54F" stroke="#FFA000" strokeWidth="1.5"/><text y="4" fontSize="9" fontWeight="900" textAnchor="middle" fill="#3E2723" fontFamily="system-ui">SIR</text></g>}
      {isAA && !isSIR && <g transform="translate(222,62)"><circle r="15" fill={th.accent} stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/><text y="4" fontSize="9" fontWeight="900" textAnchor="middle" fill="#1a1a1a" fontFamily="system-ui">AA</text></g>}
      <rect x="12" y="298" width="226" height="42" rx="4" fill="rgba(0,0,0,0.62)"/>
      <text x="20" y="316" fill="white" fontSize="11" fontWeight="600" fontFamily="system-ui">{db.set}</text>
      <text x="20" y="331" fill="rgba(255,255,255,0.72)" fontSize="9.5" fontFamily="system-ui">{db.number} · {db.rarity.length>24?db.rarity.slice(0,23)+'…':db.rarity}</text>
      <text x="230" y="329" fill={th.accent} fontSize="13" fontWeight="800" textAnchor="end" fontFamily="system-ui">{db.year}</text>
    </svg>
  );
}

export const CardImg = ({ dbId, className = '' }) => (
  <div className={cx('relative overflow-hidden rounded-md', className)}>
    <PokemonCard dbId={dbId} className="w-full h-full block" />
  </div>
);

// ─── SEALED PRODUCT TILE ──────────────────────────────────────────────────────
export function SealedTile({ productId, className = '' }) {
  const p = SEALED_DB[productId]; if (!p) return null;
  return (
    <div className={cx('relative overflow-hidden rounded-md flex items-center justify-center', className)}
      style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}88, #18181b)` }}>
      <div className="absolute inset-0 opacity-25" style={{ background:'repeating-linear-gradient(45deg, transparent 0 8px, rgba(255,255,255,0.08) 8px 10px)' }}/>
      <div className="relative text-center px-2 py-1">
        <div className="text-[9px] font-bold text-white/70 uppercase tracking-wider">{p.type}</div>
        <div className="text-xs font-black text-white leading-tight">{p.name.split(' ').slice(0,2).join(' ')}</div>
        <div className="text-[9px] text-white/60 mt-0.5">{p.year}</div>
      </div>
    </div>
  );
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
export function Sparkline({ data, color = '#34d399', height = 28 }) {
  if (!data || data.length < 2) return null;
  const prices = data.map(d => d.price);
  const mn = Math.min(...prices), mx = Math.max(...prices), rng = mx - mn || 1;
  const pts = prices.map((p, i) => `${(i / (prices.length - 1)) * 100},${100 - ((p - mn) / rng) * 100}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke"/>
    </svg>
  );
}

// ─── STAT CHIP ────────────────────────────────────────────────────────────────
export function StatChip({ label, value, sub, tone = 'default', icon: Icon, delta24h, onClick }) {
  return (
    <div onClick={onClick} className={cx('bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 transition', onClick && 'cursor-pointer hover:border-zinc-600 active:scale-[0.98]')}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5 text-zinc-600"/>}
      </div>
      <div className={cx('text-xl font-bold tabular-nums', tone==='up'?'text-emerald-400':tone==='down'?'text-red-400':'text-white')}>{value}</div>
      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
        {sub && <span className="text-xs text-zinc-500 truncate">{sub}</span>}
        {delta24h != null && Math.abs(delta24h) > 0.01 && (
          <span className={cx('text-[10px] tabular-nums font-semibold flex items-center gap-0.5', delta24h >= 0 ? 'text-emerald-500' : 'text-red-500')}>
            {delta24h >= 0 ? <TrendingUp className="w-2.5 h-2.5"/> : <TrendingDown className="w-2.5 h-2.5"/>}
            {fmtPct(delta24h)} 24h
          </span>
        )}
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, body, ctaLabel, onCta, compact }) {
  return (
    <div className={cx('bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl text-center flex flex-col items-center justify-center', compact ? 'p-6' : 'p-10')}>
      <div className={cx('rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-3', compact ? 'w-10 h-10' : 'w-14 h-14')}>
        <Icon className={cx('text-zinc-500', compact ? 'w-5 h-5' : 'w-7 h-7')}/>
      </div>
      <div className={cx('font-bold text-white', compact ? 'text-sm' : 'text-lg')}>{title}</div>
      {body && <div className={cx('text-zinc-400 mt-1 max-w-sm', compact ? 'text-xs' : 'text-sm')}>{body}</div>}
      {ctaLabel && (
        <button onClick={onCta} className="mt-4 px-4 py-2 bg-white text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-100 transition flex items-center gap-1">
          <Plus className="w-4 h-4"/>{ctaLabel}
        </button>
      )}
    </div>
  );
}

// ─── INFO TOOLTIP (centered modal) ───────────────────────────────────────────
export function InfoTooltip({ title, body }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-4 h-4 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition">
        <Info className="w-2.5 h-2.5"/>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-cyan-400"/></div>
                <div className="text-sm font-bold text-white">{title}</div>
              </div>
              <button onClick={() => setOpen(false)} className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><X className="w-3 h-3"/></button>
            </div>
            <div className="text-sm text-zinc-300 leading-relaxed">{body}</div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── SKELETON ────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return <div className={cx('bg-zinc-800/60 rounded animate-pulse', className)}/>;
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-5 py-6 pb-28 space-y-5">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <Skeleton className="h-4 w-32"/><Skeleton className="h-12 w-48"/><Skeleton className="h-64 w-full"/>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-24"/>)}</div>
      <Skeleton className="h-48"/><Skeleton className="h-56"/>
    </div>
  );
}

// ─── TOP BAR ─────────────────────────────────────────────────────────────────
export function TopBar({ alertCount, onAlerts }) {
  return (
    <header className="sticky top-0 z-30 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <div className="w-4 h-4 rounded-full bg-white border-2 border-zinc-900"/>
          </div>
          <div>
            <div className="text-white font-semibold text-lg tracking-tight leading-none">PokéFolio</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Card Portfolio Terminal</div>
          </div>
        </div>
        <button onClick={onAlerts} className="relative w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition">
          <Bell className="w-4 h-4"/>
          {alertCount > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {alertCount}
            </div>
          )}
        </button>
      </div>
    </header>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
export function BottomNav({ view, setView }) {
  const tabs = [
    { id:'dashboard', label:'Portfolio', icon:BarChart3 },
    { id:'binder',    label:'Binder',    icon:Layers },
    { id:'scan',      label:'Search',    icon:Search },
    { id:'news',      label:'News',      icon:Newspaper },
    { id:'tools',     label:'Tools',     icon:Calculator },
    { id:'profile',   label:'Profile',   icon:Crown },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto flex items-center justify-around px-1 py-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button key={id} onClick={() => setView(id)} className="flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg transition">
              <Icon className={cx('w-5 h-5', active ? 'text-white' : 'text-zinc-500')} strokeWidth={active ? 2.5 : 2}/>
              <span className={cx('text-[9px] font-semibold', active ? 'text-white' : 'text-zinc-500')}>{label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-emerald-400"/>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// TickerTape lives in dashboard.jsx


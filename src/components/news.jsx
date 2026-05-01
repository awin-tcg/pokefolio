// src/components/news.jsx
import React, { useState } from 'react';
import { CalendarDays, Play, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { NEWS_FEED, NEWS_TAG_COLORS, RELEASE_CALENDAR } from '../data.js';
import { cx } from '../utils.js';
import { InsightsPanel, MarketPulseFeed, SetRotationWarnings } from './dashboard.jsx';

// ─── REDDIT SENTIMENT DATA ────────────────────────────────────────────────────
const REDDIT_SENTIMENT = [
  { name:'Moonbreon (Umbreon VMAX Alt)', mentions:342, trend:'up',      change:'+28%', sentiment:'bullish',  topPost:'"Finally broke the NM ceiling — this card never stops climbing"' },
  { name:'Charizard Base Set',           mentions:287, trend:'up',      change:'+14%', sentiment:'bullish',  topPost:'"PSA 10 1st Ed just sold for $15K. New ATH confirmed"' },
  { name:'Giratina V Alt Art',           mentions:198, trend:'neutral', change:'+2%',  sentiment:'neutral',  topPost:'"Holding long. Solid value but slow mover right now"' },
  { name:'Rayquaza V Alt Art',           mentions:156, trend:'down',    change:'-12%', sentiment:'bearish',  topPost:'"Rotation fears creeping in on older 2021 sets"' },
  { name:'Lugia V Alt Art',              mentions:134, trend:'up',      change:'+8%',  sentiment:'bullish',  topPost:'"Silver Tempest was always under-rated, finally catching up"' },
  { name:'Mew VMAX Alt Art',             mentions:98,  trend:'neutral', change:'+1%',  sentiment:'neutral',  topPost:'"Sitting at fair value, nothing to write home about"' },
];

function RedditSentiment() {
  const sentimentColors = { bullish:'text-emerald-400', bearish:'text-red-400', neutral:'text-zinc-400' };
  const trendIcon = { up: TrendingUp, down: TrendingDown, neutral: Minus };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-orange-400 text-xs font-black">r/</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Reddit Sentiment</div>
            <div className="text-[11px] text-zinc-500">r/pokemoncards trending this week</div>
          </div>
        </div>
        <span className="text-[9px] font-bold text-zinc-500 bg-zinc-800 px-2 py-1 rounded uppercase tracking-wider">Simulated</span>
      </div>
      <div className="divide-y divide-zinc-800/60">
        {REDDIT_SENTIMENT.map((item, i) => {
          const Icon = trendIcon[item.trend];
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition">
              <div className="text-[11px] font-bold text-zinc-600 w-5 tabular-nums flex-shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5 truncate italic">{item.topPost}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-bold text-zinc-300 tabular-nums">{item.mentions} mentions</div>
                <div className={cx('flex items-center justify-end gap-0.5 text-[11px] font-semibold mt-0.5', sentimentColors[item.sentiment])}>
                  <Icon className="w-3 h-3"/>
                  {item.change}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 bg-zinc-950/50 border-t border-zinc-800">
        <div className="text-[10px] text-zinc-600">Based on community activity patterns · real Reddit API integration coming in v2</div>
      </div>
    </div>
  );
}

function CalendarContent() {
  const today = new Date();
  const TYPE_STYLES = { set:'text-cyan-400 bg-cyan-500/10', event:'text-purple-400 bg-purple-500/10', grading:'text-amber-400 bg-amber-500/10', product:'text-emerald-400 bg-emerald-500/10' };
  const HYPE_DOT = { high:'bg-red-400', medium:'bg-amber-400', low:'bg-zinc-500' };
  const upcoming = RELEASE_CALENDAR.map(r => ({ ...r, daysAway: Math.ceil((new Date(r.date) - today) / 864e5) })).sort((a, b) => a.daysAway - b.daysAway);
  return (
    <div className="space-y-3">
      {upcoming.map(r => {
        const past = r.daysAway < 0;
        return (
          <div key={r.id} className={cx('flex items-start gap-3 bg-zinc-900 border rounded-xl p-4', r.hype==='high'&&!past?'border-red-500/20':'border-zinc-800', past&&'opacity-50')}>
            <div className="text-center flex-shrink-0 w-14">
              <div className="text-[10px] text-zinc-500 uppercase">{new Date(r.date).toLocaleString('en',{month:'short'})}</div>
              <div className="text-2xl font-black text-white leading-tight">{new Date(r.date).getDate()}</div>
              <div className="text-[10px] text-zinc-500">{new Date(r.date).getFullYear()}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={cx('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase',TYPE_STYLES[r.type]||'text-zinc-400 bg-zinc-500/10')}>{r.type}</span>
                <span className="text-[9px] font-semibold text-zinc-500 uppercase">{r.region}</span>
                {r.hype==='high'&&<Flame className="w-3 h-3 text-red-400"/>}
              </div>
              <div className="text-sm font-bold text-white mb-0.5">{r.title}</div>
              <div className="text-[11px] text-zinc-400 leading-relaxed">{r.notes}</div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className={cx('w-2 h-2 rounded-full ml-auto mb-1',HYPE_DOT[r.hype])}/>
              <div className={cx('text-xs font-bold tabular-nums',past?'text-zinc-500':r.daysAway<=14?'text-amber-400':'text-zinc-400')}>{past?'past':r.daysAway===0?'today':`${r.daysAway}d`}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function NewsView({ cards, onSelectCard, dismissedInsights, onDismissInsight }) {
  const [mainTab, setMainTab] = useState('market');
  const [filter, setFilter] = useState('All');
  const tags = ['All', ...Object.keys(NEWS_TAG_COLORS)];
  const filtered = filter==='All' ? NEWS_FEED : NEWS_FEED.filter(n=>n.tag===filter);
  const featured = filtered[0], rest = filtered.slice(1);
  return (
    <div className="max-w-4xl mx-auto pb-28">
      <div className="sticky top-[57px] z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-5 py-3">
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {[{id:'market',label:'Market'},{id:'feed',label:'Feed'},{id:'calendar',label:'Calendar'}].map(t=>(
            <button key={t.id} onClick={()=>setMainTab(t.id)} className={cx('flex-1 py-2 text-xs font-semibold rounded-lg transition',mainTab===t.id?'bg-zinc-800 text-white':'text-zinc-500 hover:text-zinc-300')}>{t.label}</button>
          ))}
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        {mainTab==='market'&&(<>
          <InsightsPanel cards={cards} dismissed={dismissedInsights} onDismiss={onDismissInsight} onSelectCard={onSelectCard}/>
          <MarketPulseFeed cards={cards} onSelectCard={onSelectCard}/>
          <RedditSentiment/>
          <SetRotationWarnings cards={cards}/>
        </>)}
        {mainTab==='feed'&&(<>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">{tags.map(t=><button key={t} onClick={()=>setFilter(t)} className={cx('flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition',filter===t?'bg-zinc-700 text-white':'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200')}>{t}</button>)}</div>
          {featured&&(
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {/* YouTube-style thumbnail */}
              <div className="relative w-full" style={{aspectRatio:'16/9', background:`linear-gradient(135deg, ${featured.avatar}44 0%, #18181b 100%)`}}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5"/>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">{featured.duration}</div>
                <div className="absolute top-2 left-2"><span className={cx('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase',NEWS_TAG_COLORS[featured.tag]||'text-zinc-400 bg-zinc-500/10')}>{featured.tag}</span></div>
                <div className="absolute top-2 right-2"><span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase">Featured</span></div>
              </div>
              <div className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold border-2 border-zinc-700" style={{background:featured.avatar}}>{featured.channel[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white leading-snug mb-1">{featured.title}</div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500"><span className="font-semibold text-zinc-400">{featured.channel}</span><span>{featured.views} views</span><span>{featured.ago} ago</span></div>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">{rest.map(n=>(
            <div key={n.id} className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {/* Mini thumbnail */}
              <div className="w-32 flex-shrink-0 relative self-stretch" style={{background:`linear-gradient(135deg, ${n.avatar}44 0%, #18181b 100%)`}}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5"/>
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded font-mono">{n.duration}</div>
              </div>
              <div className="flex-1 min-w-0 py-3 pr-3">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap"><span className="text-[11px] font-semibold text-zinc-400">{n.channel}</span><span className={cx('text-[9px] font-bold px-1 py-0.5 rounded uppercase',NEWS_TAG_COLORS[n.tag]||'text-zinc-400 bg-zinc-500/10')}>{n.tag}</span></div>
                <div className="text-sm font-medium text-white leading-snug mb-1">{n.title}</div>
                <div className="text-[10px] text-zinc-500">{n.views} views · {n.ago} ago</div>
              </div>
            </div>
          ))}</div>
          {filtered.length===0&&<div className="text-center py-10 text-zinc-500 text-sm">No videos in this category yet.</div>}
        </>)}
        {mainTab==='calendar'&&(<div><div className="flex items-center gap-2 mb-4"><CalendarDays className="w-4 h-4 text-cyan-400"/><div className="text-sm font-semibold text-white">Release Calendar</div><div className="text-xs text-zinc-500 ml-auto">{RELEASE_CALENDAR.length} events</div></div><CalendarContent/></div>)}
      </div>
    </div>
  );
}


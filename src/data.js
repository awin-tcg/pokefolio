// src/data.js — All data constants

export const CARD_DB = {
  'charizard-base':  { name:'Charizard',     set:'Base Set',        number:'4/102',    year:1999, rarity:'Holo Rare',                type:'Fire',      hp:120, pop10:125,   sold30d:42,  listed:85,   pricing:{raw:{NM:520,LP:380,MP:240,HP:140,DMG:70},psa:{10:19500,9:3400,8:980,7:520,6:340},tcg:495}, trend:'up',   volatility:0.18 },
  'moonbreon':       { name:'Umbreon VMAX',  set:'Evolving Skies',  number:'215/203',  year:2021, rarity:'Alt Art Secret Rare',      type:'Darkness',  hp:310, pop10:14820, sold30d:385, listed:720,  pricing:{raw:{NM:640,LP:510,MP:380,HP:240,DMG:120},psa:{10:1850,9:860,8:560,7:380},tcg:615}, trend:'up',   volatility:0.22 },
  'lugia-alt':       { name:'Lugia V',       set:'Silver Tempest',  number:'186/195',  year:2022, rarity:'Alt Art Ultra Rare',       type:'Colorless', hp:220, pop10:8640,  sold30d:220, listed:410,  pricing:{raw:{NM:195,LP:150,MP:110,HP:70},psa:{10:520,9:260,8:180},tcg:188}, trend:'up',   volatility:0.14 },
  'giratina-alt':    { name:'Giratina V',    set:'Lost Origin',     number:'186/196',  year:2022, rarity:'Alt Art Ultra Rare',       type:'Dragon',    hp:220, pop10:11240, sold30d:195, listed:480,  pricing:{raw:{NM:160,LP:125,MP:90,HP:55},psa:{10:480,9:240,8:160},tcg:155}, trend:'down', volatility:0.19 },
  'charizard-ex':    { name:'Charizard ex',  set:'Obsidian Flames', number:'199/197',  year:2023, rarity:'Special Illustration Rare',type:'Darkness',  hp:330, pop10:24500, sold30d:620, listed:1100, pricing:{raw:{NM:105,LP:80,MP:55,HP:30},psa:{10:340,9:170,8:110},tcg:98}, trend:'up',   volatility:0.24 },
  'mew-ex':          { name:'Mew ex',        set:'151',             number:'205/165',  year:2023, rarity:'Special Illustration Rare',type:'Psychic',   hp:180, pop10:18200, sold30d:480, listed:910,  pricing:{raw:{NM:58,LP:44,MP:32,HP:18},psa:{10:180,9:95,8:62},tcg:55}, trend:'up',   volatility:0.16 },
  'rayquaza-alt':    { name:'Rayquaza VMAX', set:'Evolving Skies',  number:'218/203',  year:2021, rarity:'Alt Art Secret Rare',      type:'Dragon',    hp:320, pop10:9800,  sold30d:148, listed:340,  pricing:{raw:{NM:220,LP:170,MP:125,HP:80},psa:{10:680,9:310,8:220},tcg:215}, trend:'down', volatility:0.20 },
  'gengar-alt':      { name:'Gengar VMAX',   set:'Fusion Strike',   number:'271/264',  year:2021, rarity:'Alt Art Secret Rare',      type:'Psychic',   hp:320, pop10:7450,  sold30d:125, listed:295,  pricing:{raw:{NM:295,LP:230,MP:170,HP:105},psa:{10:880,9:410,8:290},tcg:285}, trend:'up',   volatility:0.17 },
  'blastoise-base':  { name:'Blastoise',     set:'Base Set',        number:'2/102',    year:1999, rarity:'Holo Rare',                type:'Water',     hp:100, pop10:380,   sold30d:22,  listed:58,   pricing:{raw:{NM:260,LP:190,MP:130,HP:70},psa:{10:5800,9:1200,8:480,7:280},tcg:248}, trend:'up',   volatility:0.15 },
  'pikachu-ex':      { name:'Pikachu ex',    set:'151',             number:'193/165',  year:2023, rarity:'Special Illustration Rare',type:'Lightning', hp:200, pop10:22100, sold30d:540, listed:1050, pricing:{raw:{NM:72,LP:55,MP:40,HP:22},psa:{10:230,9:120,8:78},tcg:68}, trend:'up',   volatility:0.21 },
  'venusaur-base':   { name:'Venusaur',      set:'Base Set',        number:'15/102',   year:1999, rarity:'Holo Rare',                type:'Grass',     hp:100, pop10:610,   sold30d:28,  listed:72,   pricing:{raw:{NM:195,LP:140,MP:95,HP:50},psa:{10:2400,9:720,8:320,7:185},tcg:188}, trend:'up',   volatility:0.13 },
  'mewtwo-base':     { name:'Mewtwo',        set:'Base Set',        number:'10/102',   year:1999, rarity:'Holo Rare',                type:'Psychic',   hp:60,  pop10:720,   sold30d:35,  listed:88,   pricing:{raw:{NM:165,LP:115,MP:75,HP:40},psa:{10:1850,9:420,8:220,7:140},tcg:158}, trend:'up',   volatility:0.15 },
  'rayquaza-cosmic': { name:'Rayquaza GX',   set:'Celestial Storm', number:'177a/168', year:2018, rarity:'Secret Rare',              type:'Dragon',    hp:180, pop10:3200,  sold30d:65,  listed:185,  pricing:{raw:{NM:110,LP:80,MP:55,HP:30},psa:{10:380,9:160,8:95},tcg:105}, trend:'down', volatility:0.18 },
};

export const SEALED_DB = {
  'evolving-skies-etb': { name:'Evolving Skies ETB',          set:'Evolving Skies',      year:2021, color:'#0891b2', currentPrice:340,  type:'ETB' },
  'obsidian-flames-bb': { name:'Obsidian Flames Booster Box', set:'Obsidian Flames',      year:2023, color:'#dc2626', currentPrice:185,  type:'Booster Box' },
  '151-bb':             { name:'Pokémon 151 Booster Box',     set:'Scarlet & Violet 151', year:2023, color:'#eab308', currentPrice:485,  type:'Booster Box' },
  'prismatic-etb':      { name:'Prismatic Evolutions ETB',    set:'Prismatic Evolutions', year:2026, color:'#7c3aed', currentPrice:85,   type:'ETB' },
  'lost-origin-etb':    { name:'Lost Origin ETB',             set:'Lost Origin',          year:2022, color:'#059669', currentPrice:120,  type:'ETB' },
  'base-booster-pack':  { name:'Base Set Booster Pack',       set:'Base Set',             year:1999, color:'#c2410c', currentPrice:2800, type:'Booster Pack' },
};

export const TYPE_THEMES = {
  Fire:      { bg:['#FF7043','#D84315','#4E342E'], accent:'#FFCC80', label:'FIRE' },
  Water:     { bg:['#42A5F5','#1976D2','#0D47A1'], accent:'#90CAF9', label:'WATER' },
  Lightning: { bg:['#FFCA28','#F57F17','#5D4037'], accent:'#FFE082', label:'LIGHTNING' },
  Grass:     { bg:['#66BB6A','#2E7D32','#1B5E20'], accent:'#A5D6A7', label:'GRASS' },
  Psychic:   { bg:['#AB47BC','#6A1B9A','#311B92'], accent:'#CE93D8', label:'PSYCHIC' },
  Darkness:  { bg:['#546E7A','#263238','#0D1117'], accent:'#B0BEC5', label:'DARKNESS' },
  Dragon:    { bg:['#7E57C2','#F9A825','#311B92'], accent:'#FFE082', label:'DRAGON' },
  Colorless: { bg:['#E0E0E0','#78909C','#37474F'], accent:'#FFFFFF', label:'COLORLESS' },
};

export const MARKET_PULSE = {
  'moonbreon':     { change7d:11.3, summary:"Up 11% — a Logan Paul pack opening (4.2M views) sent demand for Moonbreon soaring. Sold listings on eBay jumped 68% in 5 days.", driver:'creator_content', sentiment:'bullish' },
  'charizard-ex':  { change7d:-6.7, summary:"Pulling back 7% after last month's peak. Obsidian Flames is still widely available at retail, limiting scarcity pressure.", driver:'correction',      sentiment:'neutral' },
  'lugia-alt':     { change7d:3.1,  summary:"Modest 3% gain following PokéRev's top-10 alt art list where it placed #3. Purely sentiment-driven.", driver:'creator_content', sentiment:'bullish' },
  'giratina-alt':  { change7d:-4.8, summary:"Down 5% on rising listing count — supply outpacing demand as Lost Origin holders take profit.", driver:'supply_pressure', sentiment:'bearish' },
  'charizard-base':{ change7d:2.1,  summary:"Steady 2% gain. Vintage Base Set continues its slow grind up as scarcity compounds.", driver:'scarcity',         sentiment:'bullish' },
  'mew-ex':        { change7d:8.4,  summary:"Up 8% on strong liquidity — 480 sold in 30 days. 151 remains the best-selling modern set.", driver:'demand',           sentiment:'bullish' },
  'pikachu-ex':    { change7d:5.2,  summary:"5% rally this week. Search volume for 'Pikachu ex 151' hit 90-day high following a viral TikTok.", driver:'creator_content', sentiment:'bullish' },
  'rayquaza-alt':  { change7d:-3.2, summary:"Down 3% — rotation out of 2021 chase cards as collectors prep cash for upcoming sets.", driver:'rotation',         sentiment:'bearish' },
};

export const DRIVER_LABELS = {
  creator_content:{ label:'Creator Content', color:'text-purple-400 bg-purple-500/10' },
  correction:     { label:'Price Correction', color:'text-amber-400 bg-amber-500/10' },
  supply_pressure:{ label:'Supply Pressure',  color:'text-red-400 bg-red-500/10' },
  scarcity:       { label:'Scarcity Driven',  color:'text-emerald-400 bg-emerald-500/10' },
  demand:         { label:'Demand Spike',     color:'text-emerald-400 bg-emerald-500/10' },
  rotation:       { label:'Capital Rotation', color:'text-cyan-400 bg-cyan-500/10' },
};

export const NEWS_FEED = [
  { id:'n1', channel:'PokéRev',          avatar:'#EF4444', title:'Evolving Skies Is UNSTOPPABLE: Moonbreon Hits All-Time High',  views:'284K', ago:'2d',  duration:'14:22', tag:'Market' },
  { id:'n2', channel:'Leonhart',         avatar:'#8B5CF6', title:'I Opened $10,000 Worth of Charizard ex Packs',                views:'1.2M', ago:'5d',  duration:'22:08', tag:'Pulls' },
  { id:'n3', channel:'Unlisted Leaf',    avatar:'#10B981', title:'BREAKING: Mega Evolution Set Releases March 2026',            views:'418K', ago:'1d',  duration:'9:47',  tag:'News' },
  { id:'n4', channel:'RealBreakingNate', avatar:'#F59E0B', title:'Why PSA 10 Umbreon VMAX Keeps Climbing — Supply Analysis',    views:'89K',  ago:'3d',  duration:'18:33', tag:'Analysis' },
  { id:'n5', channel:'Aaron Zheng',      avatar:'#06B6D4', title:'Worlds 2026 Championship Decks + Card Price Impact',          views:'156K', ago:'6d',  duration:'27:14', tag:'News' },
  { id:'n6', channel:'Pawk',             avatar:'#EC4899', title:'The Best Investment Cards Under $50 Right Now',               views:'92K',  ago:'4d',  duration:'11:58', tag:'Investing' },
  { id:'n7', channel:'TCGplayer',        avatar:'#3B82F6', title:'Monthly Market Report: Vintage vs Modern Performance',        views:'34K',  ago:'8d',  duration:'16:02', tag:'Market' },
  { id:'n8', channel:'PokéRev',          avatar:'#EF4444', title:'Grading 20 Cards at PSA — My Actual ROI Breakdown',           views:'512K', ago:'12d', duration:'19:45', tag:'Grading' },
];

export const NEWS_TAG_COLORS = {
  Market:'text-emerald-400 bg-emerald-500/10',
  Pulls:'text-amber-400 bg-amber-500/10',
  News:'text-cyan-400 bg-cyan-500/10',
  Analysis:'text-purple-400 bg-purple-500/10',
  Investing:'text-red-400 bg-red-500/10',
  Grading:'text-yellow-400 bg-yellow-500/10',
};

export const RELEASE_CALENDAR = [
  { id:'r1',  date:'2026-01-17', title:'Prismatic Evolutions',        type:'set',     region:'EN',     hype:'high',   notes:'Eeveelution chase cards — expected print-to-order.' },
  { id:'r2',  date:'2026-02-14', title:'Journey Together',            type:'set',     region:'EN',     hype:'medium', notes:"Trainer-focused set with Ethan's Typhlosion and N's Zoroark." },
  { id:'r3',  date:'2026-03-28', title:'Mega Evolution',              type:'set',     region:'EN',     hype:'high',   notes:'First Mega Evolution cards since XY era.' },
  { id:'r4',  date:'2026-04-05', title:'Pokémon EU International',    type:'event',   region:'Global', hype:'medium', notes:'Major tournament — expect card price movement.' },
  { id:'r5',  date:'2026-05-22', title:'Legendary Burst',             type:'set',     region:'EN',     hype:'medium', notes:'Rayquaza and Kyogre chase cards.' },
  { id:'r6',  date:'2026-06-13', title:'PSA Show Submission Window',  type:'grading', region:'US',     hype:'low',    notes:'On-site grading at Chicago card show.' },
  { id:'r7',  date:'2026-07-11', title:'Shadow Pokémon',              type:'set',     region:'EN',     hype:'medium', notes:"Team Rocket-themed. Rocket's Mewtwo top chase." },
  { id:'r8',  date:'2026-08-14', title:'Pokémon World Championships', type:'event',   region:'Global', hype:'high',   notes:'Worlds 2026. Championship reveals move prices 20-40%.' },
  { id:'r9',  date:'2026-10-03', title:'Black & White Remastered',    type:'set',     region:'EN',     hype:'high',   notes:'Anniversary reprint — will impact original B&W prices.' },
  { id:'r10', date:'2026-11-21', title:'Holiday Collection Boxes',    type:'product', region:'EN',     hype:'low',    notes:'Annual holiday ETBs with exclusive promos.' },
];

export const SEED_RECENT_SALES = [
  { id:'rs1', dbId:'moonbreon',    condition:'PSA10', price:1820, date:'2026-04-23', source:'eBay' },
  { id:'rs2', dbId:'charizard-ex', condition:'NM',    price:95,   date:'2026-04-22', source:'TCGplayer' },
  { id:'rs3', dbId:'lugia-alt',    condition:'PSA10', price:545,  date:'2026-04-21', source:'eBay' },
  { id:'rs4', dbId:'mew-ex',       condition:'NM',    price:52,   date:'2026-04-20', source:'eBay' },
  { id:'rs5', dbId:'pikachu-ex',   condition:'NM',    price:65,   date:'2026-04-19', source:'TCGplayer' },
  { id:'rs6', dbId:'giratina-alt', condition:'NM',    price:148,  date:'2026-04-18', source:'eBay' },
];

const mkLot = (id, price, date, qty = 1) => ({ id, price, date, qty });

export const SEED_CARDS = [
  { id:'c1',  dbId:'charizard-base',  condition:'PSA8', lots:[mkLot('L1',720,'2024-02-15')],                                       status:'holding' },
  { id:'c2',  dbId:'moonbreon',       condition:'NM',   lots:[mkLot('L2a',420,'2024-05-03'),mkLot('L2b',560,'2024-11-20')],         status:'holding' },
  { id:'c3',  dbId:'lugia-alt',       condition:'PSA10',lots:[mkLot('L3',380,'2024-03-21')],                                        status:'holding' },
  { id:'c4',  dbId:'giratina-alt',    condition:'NM',   lots:[mkLot('L4',210,'2024-07-09')],                                        status:'holding' },
  { id:'c5',  dbId:'charizard-ex',    condition:'NM',   lots:[mkLot('L5a',52,'2024-09-14'),mkLot('L5b',85,'2025-02-08',2)],         status:'holding' },
  { id:'c6',  dbId:'mew-ex',          condition:'NM',   lots:[mkLot('L6',32,'2024-08-02')],                                         status:'holding' },
  { id:'c7',  dbId:'rayquaza-alt',    condition:'NM',   lots:[mkLot('L7',305,'2024-01-28')],                                        status:'holding' },
  { id:'c8',  dbId:'gengar-alt',      condition:'NM',   lots:[mkLot('L8',185,'2024-06-11')],                                        status:'holding' },
  { id:'c9',  dbId:'blastoise-base',  condition:'LP',   lots:[mkLot('L9',160,'2024-04-17')],                                        status:'holding' },
  { id:'c10', dbId:'pikachu-ex',      condition:'NM',   lots:[mkLot('L10',48,'2024-10-05')],                                        status:'holding' },
  { id:'s1',  dbId:'rayquaza-cosmic', condition:'NM',   lots:[mkLot('LS1',65,'2024-03-10')],  status:'sold', sellPrice:105, sellDate:'2024-09-22' },
  { id:'s2',  dbId:'venusaur-base',   condition:'MP',   lots:[mkLot('LS2',55,'2024-02-28')],  status:'sold', sellPrice:95,  sellDate:'2025-01-15' },
  { id:'s3',  dbId:'mewtwo-base',     condition:'NM',   lots:[mkLot('LS3',145,'2024-04-05')], status:'sold', sellPrice:178, sellDate:'2025-03-22' },
  { id:'s4',  dbId:'gengar-alt',      condition:'NM',   lots:[mkLot('LS4',320,'2024-01-15')], status:'sold', sellPrice:265, sellDate:'2025-04-01' },
];

export const SEED_COLLECTIONS = [
  { id:'col-1', name:'Vintage Holo Bin', cardIds:['c1','c9'] },
  { id:'col-2', name:'Modern Chase',     cardIds:['c2','c3','c4','c7','c8'] },
  { id:'col-3', name:'151 & SV Era',     cardIds:['c5','c6','c10'] },
];

export const SEED_ALERTS = [
  { id:'a1', cardId:'c2', target:700, direction:'above', note:'Take profit', createdAt:'2025-03-01', triggered:false },
  { id:'a2', cardId:'c7', target:200, direction:'below', note:'Avg down',    createdAt:'2025-02-12', triggered:false },
];

export const SEED_LINES = {
  c1:[{ id:'l1', price:800, label:'Support', color:'emerald' },{ id:'l2', price:1100, label:'Resistance', color:'red' }]
};

export const SEED_WANTLIST = [
  { id:'w1', dbId:'moonbreon',    condition:'PSA10', targetPrice:1500, notes:'Grail card',      addedDate:'2025-01-10' },
  { id:'w2', dbId:'charizard-ex', condition:'NM',    targetPrice:85,   notes:'Waiting for dip', addedDate:'2025-03-15' },
];

export const SEED_SEALED = [
  { id:'sp1', productId:'evolving-skies-etb', qty:2, cost:55,  date:'2023-06-15' },
  { id:'sp2', productId:'151-bb',             qty:1, cost:165, date:'2023-09-22' },
];

export const SEED_GRADING_SUBS = [
  { id:'gs1', dbId:'charizard-base', company:'PSA', tier:'Value',    submittedDate:'2025-02-10', expectedReturn:'2025-04-10', cost:39, status:'shipped', notes:'Hoping for PSA 9', result:null },
  { id:'gs2', dbId:'moonbreon',      company:'BGS', tier:'Standard', submittedDate:'2025-03-01', expectedReturn:'2025-05-15', cost:65, status:'grading', notes:'',                result:null },
];

export const ALL_CONDITIONS  = ['NM','LP','MP','HP','DMG','PSA10','PSA9','PSA8','PSA7','PSA6'];
export const RAW_CONDITIONS  = ['NM','LP','MP','HP','DMG'];
export const SCAN_LIMIT      = 10;
export const INDEX_IDS       = ['moonbreon','charizard-ex','lugia-alt','giratina-alt','rayquaza-alt','gengar-alt','pikachu-ex','mew-ex','charizard-base','blastoise-base'];
export const LINE_COLORS     = {
  emerald:{ stroke:'#34d399', bg:'bg-emerald-500/15', text:'text-emerald-400', dot:'bg-emerald-400' },
  red:    { stroke:'#f87171', bg:'bg-red-500/15',     text:'text-red-400',     dot:'bg-red-400' },
  amber:  { stroke:'#fbbf24', bg:'bg-amber-500/15',   text:'text-amber-400',   dot:'bg-amber-400' },
  cyan:   { stroke:'#22d3ee', bg:'bg-cyan-500/15',    text:'text-cyan-400',    dot:'bg-cyan-400' },
};


// src/App.jsx
import React, { useState, useEffect } from 'react';
import { SEED_CARDS, SEED_COLLECTIONS, SEED_ALERTS, SEED_LINES, SEED_WANTLIST, SEED_SEALED, SEED_GRADING_SUBS, CARD_DB } from './data.js';
import { getCardValue, todayStr, wantlistPrice, fmt } from './utils.js';
import { TopBar, BottomNav, DashboardSkeleton } from './components/ui.jsx';
import { Dashboard, AnalyticsView } from './components/dashboard.jsx';
import { BinderView } from './components/binder.jsx';
import { ScanView } from './components/scan.jsx';
import { NewsView } from './components/news.jsx';
import { ToolsView } from './components/tools.jsx';
import { ProfileView } from './components/profile.jsx';
import {
  CardDetailModal, ConfirmModal, CollectionEditModal,
  WantlistAddModal, SealedAddModal, GradeROIModal,
  SellModal, BuyMoreModal, AlertModal, AddLineModal,
  ManualAddModal, AlertsPanel, ToastStack,
  SettingsModal, BulkImportModal,
} from './components/modals.jsx';

const LS_KEY = 'pokefolio_v2';
const LS_SETTINGS_KEY = 'pokefolio_settings_v1';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  currency: 'USD',
  defaultCondition: 'NM',
  defaultBinder: '',
  notifications: { priceAlerts: true, news: true, releases: true },
};

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveState(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('dashboard');

  // Core data
  const [cards, setCards] = useState(SEED_CARDS);
  const [collections, setCollections] = useState(SEED_COLLECTIONS);
  const [alerts, setAlerts] = useState(SEED_ALERTS);
  const [lines, setLines] = useState(SEED_LINES);
  const [wantlist, setWantlist] = useState(SEED_WANTLIST);
  const [sealed, setSealed] = useState(SEED_SEALED);
  const [gradingSubs, setGradingSubs] = useState(SEED_GRADING_SUBS);
  const [dismissedInsights, setDismissedInsights] = useState([]);
  const [scanCount, setScanCount] = useState(0);
  const [preGrades, setPreGrades] = useState({});
  const [vendorInventory, setVendorInventory] = useState([]);
  const [triggeredWantlistIds, setTriggeredWantlistIds] = useState([]);

  // Settings
  const [settings, setSettings] = useState(() => {
    try { const s = localStorage.getItem(LS_SETTINGS_KEY); return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS; } catch { return DEFAULT_SETTINGS; }
  });

  // Apply theme to <html> so all CSS descendant selectors work correctly
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // UI state
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      if (saved.cards)           setCards(saved.cards);
      if (saved.collections)     setCollections(saved.collections);
      if (saved.alerts)          setAlerts(saved.alerts);
      if (saved.lines)           setLines(saved.lines);
      if (saved.wantlist)        setWantlist(saved.wantlist);
      if (saved.sealed)          setSealed(saved.sealed);
      if (saved.gradingSubs)     setGradingSubs(saved.gradingSubs);
      if (saved.dismissedInsights) setDismissedInsights(saved.dismissedInsights);
      if (saved.scanCount)       setScanCount(saved.scanCount);
      if (saved.preGrades)       setPreGrades(saved.preGrades);
      if (saved.vendorInventory) setVendorInventory(saved.vendorInventory);
      if (saved.triggeredWantlistIds) setTriggeredWantlistIds(saved.triggeredWantlistIds);
    }
    setTimeout(() => setIsLoading(false), 600);
  }, []);

  // Save to localStorage on state changes
  useEffect(() => {
    if (!isLoading) saveState({ cards, collections, alerts, lines, wantlist, sealed, gradingSubs, dismissedInsights, scanCount, preGrades, vendorInventory, triggeredWantlistIds });
  }, [cards, collections, alerts, lines, wantlist, sealed, gradingSubs, dismissedInsights, scanCount, preGrades, isLoading]);

  // Check alert triggers whenever cards change
  useEffect(() => {
    const newToasts = [];
    const updatedAlerts = alerts.map(a => {
      if (a.triggered) return a;
      const card = cards.find(c => c.id === a.cardId); if (!card) return a;
      const cur = getCardValue(card);
      const hit = (a.direction === 'above' && cur >= a.target) || (a.direction === 'below' && cur <= a.target);
      if (hit) {
        const db = CARD_DB[card.dbId];
        newToasts.push({ id: 'toast-'+a.id, message: `${db?.name} is ${a.direction} $${a.target}${a.note ? ' — '+a.note : ''}` });
        return { ...a, triggered: true, triggeredAt: todayStr() };
      }
      return a;
    });
    if (newToasts.length) { setAlerts(updatedAlerts); setToasts(t => [...t, ...newToasts]); }
  }, [cards]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check wantlist price targets whenever wantlist changes
  useEffect(() => {
    if (isLoading) return;
    const newToasts = [];
    const newTriggered = [];
    wantlist.forEach(w => {
      if (triggeredWantlistIds.includes(w.id)) return;
      const cur = wantlistPrice(w);
      if (w.targetPrice && cur <= w.targetPrice) {
        const db = CARD_DB[w.dbId];
        newToasts.push({ id: 'wl-'+w.id, title: '🎯 Target Price Hit!', message: `${db?.name} is now ${fmt(cur)} — target was ${fmt(w.targetPrice)}` });
        newTriggered.push(w.id);
      }
    });
    if (newToasts.length) { setTriggeredWantlistIds(ids => [...ids, ...newTriggered]); setToasts(t => [...t, ...newToasts]); }
  }, [wantlist, isLoading]); // eslint-disable-line

  // ─── CARD HANDLERS ──────────────────────────────────────────────────────────
  const addCard = (card, colId, preGrade) => {
    setCards(cs => [...cs, card]);
    if (colId) setCollections(cs => cs.map(c => c.id === colId ? { ...c, cardIds: [...c.cardIds, card.id] } : c));
    if (preGrade) setPreGrades(pg => ({ ...pg, [card.id]: preGrade }));
    setModal(null);
  };

  const deleteCard = (cardId) => {
    setCards(cs => cs.filter(c => c.id !== cardId));
    setCollections(cs => cs.map(c => ({ ...c, cardIds: c.cardIds.filter(id => id !== cardId) })));
    setAlerts(as => as.filter(a => a.cardId !== cardId));
    const newLines = { ...lines }; delete newLines[cardId]; setLines(newLines);
    setSelectedCardId(null); setModal(null);
  };

  const sellCard = (cardId, price, date) => {
    setCards(cs => cs.map(c => c.id === cardId ? { ...c, status:'sold', sellPrice:price, sellDate:date } : c));
    setModal(null); setSelectedCardId(null);
  };

  const buyMore = (cardId, lot) => {
    setCards(cs => cs.map(c => c.id === cardId ? { ...c, lots: [...(c.lots||[]), lot] } : c));
    setModal(null);
  };

  // ─── ALERT / LINE HANDLERS ───────────────────────────────────────────────
  const addAlert = (alert) => {
    setAlerts(as => [...as, { ...alert, id:'a-'+Date.now(), createdAt:todayStr(), triggered:false }]);
    setModal(null);
  };
  const removeAlert = (alertId) => setAlerts(as => as.filter(a => a.id !== alertId));

  const addLine = (cardId, line) => {
    setLines(ls => ({ ...ls, [cardId]: [...(ls[cardId]||[]), line] }));
    setModal(null);
  };
  const removeLine = (cardId, lineId) => setLines(ls => ({ ...ls, [cardId]: (ls[cardId]||[]).filter(l => l.id !== lineId) }));

  // ─── COLLECTION HANDLERS ─────────────────────────────────────────────────
  const manageCollection = ({ mode, id, name }) => {
    if (mode === 'create') {
      setModal({ type:'collectionEdit', mode:'create', id:null, name:'' });
    } else {
      setModal({ type:'collectionEdit', mode:'rename', id, name });
    }
  };

  const confirmCollection = ({ id, name }) => {
    if (modal?.mode === 'create') {
      setCollections(cs => [...cs, { id:'col-'+Date.now(), name, cardIds:[] }]);
    } else {
      setCollections(cs => cs.map(c => c.id === id ? { ...c, name } : c));
    }
    setModal(null);
  };

  const deleteCollection = (id) => {
    setCollections(cs => cs.filter(c => c.id !== id));
    setModal(null);
  };

  // ─── WANTLIST HANDLERS ───────────────────────────────────────────────────
  const addWantlist = (item) => { setWantlist(w => [...w, item]); setModal(null); };
  const removeWantlist = (id) => setWantlist(w => w.filter(i => i.id !== id));

  // ─── SEALED HANDLERS ─────────────────────────────────────────────────────
  const addSealed = (item) => { setSealed(s => [...s, item]); setModal(null); };
  const removeSealed = (id) => setSealed(s => s.filter(i => i.id !== id));

  // ─── GRADING HANDLERS ────────────────────────────────────────────────────
  const addGradingSub = (sub) => setGradingSubs(gs => [...gs, sub]);
  const updateGradingSub = (id, updates) => setGradingSubs(gs => gs.map(g => g.id === id ? { ...g, ...updates } : g));
  const deleteGradingSub = (id) => setGradingSubs(gs => gs.filter(g => g.id !== id));

  // ─── VENDOR HANDLERS ─────────────────────────────────────────────────────────
  const addVendorItem = (item) => setVendorInventory(v => [...v, item]);
  const sellVendorItem = (id, soldPrice) => setVendorInventory(v => v.map(i => i.id === id ? { ...i, status:'sold', soldPrice, soldDate:todayStr() } : i));
  const removeVendorItem = (id) => setVendorInventory(v => v.filter(i => i.id !== id));

  // ─── MISC ─────────────────────────────────────────────────────────────────
  const openManualAdd = (seedQuery = '') => setModal({ type:'manualAdd', seedQuery });
  const activeAlertCount = alerts.filter(a => !a.triggered).length;

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    try { localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(newSettings)); } catch {}
  };

  const exportData = () => {
    const data = { cards, collections, alerts, lines, wantlist, sealed, gradingSubs, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pokefolio-export.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const sharePortfolio = () => {
    const holdings = cards.filter(c => c.status === 'holding');
    const lines2 = [
      '📦 My PokéFolio',
      `${holdings.length} cards · ${new Set(holdings.map(c => CARD_DB[c.dbId]?.set)).size} sets`,
      ...holdings.slice(0, 10).map(c => `• ${CARD_DB[c.dbId]?.name || c.dbId} (${c.condition})`),
      holdings.length > 10 ? `...and ${holdings.length - 10} more` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard?.writeText(lines2).then(() => {
      setToasts(t => [...t, { id: 'share-' + Date.now(), message: 'Portfolio summary copied to clipboard!' }]);
    });
  };

  const resetAll = () => {
    if (!window.confirm('Reset all portfolio data? This cannot be undone.')) return;
    setCards(SEED_CARDS); setCollections(SEED_COLLECTIONS); setAlerts(SEED_ALERTS);
    setLines(SEED_LINES); setWantlist(SEED_WANTLIST); setSealed(SEED_SEALED);
    setGradingSubs(SEED_GRADING_SUBS); setDismissedInsights([]); setScanCount(0); setPreGrades({});
    localStorage.removeItem(LS_KEY);
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <TopBar alertCount={activeAlertCount} onAlerts={() => setShowAlerts(true)}/>

      <main>
        {isLoading ? (
          <DashboardSkeleton/>
        ) : view === 'dashboard' ? (
          <Dashboard
            cards={cards} selectCard={setSelectedCardId} onManualAdd={() => openManualAdd()}
            dismissedInsights={dismissedInsights} onDismissInsight={id => setDismissedInsights(d => [...d, id])}
            onOpenAnalytics={() => setShowAnalytics(true)} setView={setView}
          />
        ) : view === 'binder' ? (
          <BinderView
            cards={cards} collections={collections} selectCard={setSelectedCardId}
            setView={setView} wantlist={wantlist} sealed={sealed}
            onManageCollection={manageCollection}
            onAddWantlist={() => setModal({ type:'wantlistAdd' })}
            onRemoveWantlist={removeWantlist}
            onAddSealed={() => setModal({ type:'sealedAdd' })}
            onRemoveSealed={removeSealed}
          />
        ) : view === 'scan' ? (
          <ScanView
            onAddCard={addCard}
            collections={collections} scanCount={scanCount}
            onScanUsed={() => setScanCount(n => n + 1)}
          />
        ) : view === 'news' ? (
          <NewsView
            cards={cards} onSelectCard={setSelectedCardId}
            dismissedInsights={dismissedInsights}
            onDismissInsight={id => setDismissedInsights(d => [...d, id])}
          />
        ) : view === 'tools' ? (
          <ToolsView
            cards={cards} collections={collections}
            scanCount={scanCount} onScanUsed={() => setScanCount(n => n + 1)}
            onAddCard={addCard}
            gradingSubs={gradingSubs} onGradingAdd={addGradingSub}
            onGradingUpdate={updateGradingSub} onGradingDelete={deleteGradingSub}
            vendorInventory={vendorInventory}
            onVendorAdd={addVendorItem} onVendorSell={sellVendorItem} onVendorRemove={removeVendorItem}
          />
        ) : view === 'profile' ? (
          <ProfileView
            cards={cards} alerts={alerts} collections={collections}
            wantlist={wantlist} sealed={sealed} scanCount={scanCount}
            settings={settings}
            onOpenSettings={() => setModal({ type: 'settings' })}
            onShare={sharePortfolio}
            onBulkImport={() => setModal({ type: 'bulkImport' })}
            onReset={resetAll}
          />
        ) : null}
      </main>

      <BottomNav view={view} setView={setView}/>

      {/* Card Detail Modal */}
      {selectedCardId && (
        <CardDetailModal
          cardId={selectedCardId} cards={cards} lines={lines} alerts={alerts}
          onClose={() => setSelectedCardId(null)}
          onGradeROI={id => { setModal({ type:'gradeROI', cardId:id }); }}
          onSell={id => setModal({ type:'sell', cardId:id })}
          onBuyMore={id => setModal({ type:'buyMore', cardId:id })}
          onAddLine={(cardId, price) => setModal({ type:'addLine', cardId, currentPrice:price })}
          onRemoveLine={removeLine}
          onAddAlert={(cardId, price) => setModal({ type:'alert', cardId, currentPrice:price })}
          onDelete={id => setModal({ type:'confirm', title:'Delete card?', body:'This removes it from your portfolio and all binders.', onConfirm:() => deleteCard(id) })}
        />
      )}

      {/* Alerts Panel */}
      {showAlerts && (
        <AlertsPanel alerts={alerts} cards={cards} onClose={() => setShowAlerts(false)} onRemove={removeAlert} onSelectCard={id => { setSelectedCardId(id); setShowAlerts(false); }}/>
      )}

      {/* Analytics View */}
      {showAnalytics && <AnalyticsView cards={cards} onClose={() => setShowAnalytics(false)}/>}

      {/* Modals */}
      {modal?.type === 'manualAdd'      && <ManualAddModal collections={collections} onClose={() => setModal(null)} onAdd={addCard} seedQuery={modal.seedQuery}/>}
      {modal?.type === 'collectionEdit' && <CollectionEditModal mode={modal.mode} id={modal.id} name={modal.name} onClose={() => setModal(null)} onConfirm={confirmCollection} onDelete={deleteCollection}/>}
      {modal?.type === 'wantlistAdd'    && <WantlistAddModal onClose={() => setModal(null)} onAdd={addWantlist}/>}
      {modal?.type === 'sealedAdd'      && <SealedAddModal onClose={() => setModal(null)} onAdd={addSealed}/>}
      {modal?.type === 'gradeROI'       && <GradeROIModal cardId={modal.cardId} cards={cards} preGrades={preGrades} onClose={() => setModal(null)}/>}
      {modal?.type === 'sell'           && <SellModal cardId={modal.cardId} cards={cards} onClose={() => setModal(null)} onConfirm={sellCard}/>}
      {modal?.type === 'buyMore'        && <BuyMoreModal cardId={modal.cardId} cards={cards} onClose={() => setModal(null)} onConfirm={buyMore}/>}
      {modal?.type === 'alert'          && <AlertModal cardId={modal.cardId} currentPrice={modal.currentPrice} onClose={() => setModal(null)} onConfirm={addAlert}/>}
      {modal?.type === 'addLine'        && <AddLineModal cardId={modal.cardId} currentPrice={modal.currentPrice} onClose={() => setModal(null)} onConfirm={addLine}/>}
      {modal?.type === 'confirm'        && <ConfirmModal title={modal.title} body={modal.body} onClose={() => setModal(null)} onConfirm={() => { modal.onConfirm(); setModal(null); }}/>}
      {modal?.type === 'settings'       && <SettingsModal settings={settings} collections={collections} onClose={() => setModal(null)} onSave={saveSettings} onExport={exportData} onReset={resetAll}/>}
      {modal?.type === 'bulkImport'     && <BulkImportModal collections={collections} onClose={() => setModal(null)} onImport={addCard}/>}

      {/* Toasts */}
      <ToastStack toasts={toasts} onDismiss={id => setToasts(t => t.filter(x => x.id !== id))}/>
    </div>
  );
}


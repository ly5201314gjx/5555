import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ViewState, FoodEntry } from './types';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { DiscoverView } from './views/DiscoverView';
import { AddEntryView } from './views/AddEntryView';
import { DetailView } from './views/DetailView';

// Initial Mock Data
const INITIAL_ENTRIES: FoodEntry[] = [
  {
    id: '1',
    title: '宇治抹茶舒芙蕾',
    location: '京都茶寮',
    date: '10月12日',
    imageUrl: 'https://picsum.photos/id/431/800/1000',
    tags: ['早餐', '甜点'],
    rating: 4.8,
    description: '如云朵般蓬松的口感，散发着浓郁的抹茶香气。',
    weather: { temperature: 22, condition: '晴朗', code: 0 }
  },
  {
    id: '2',
    title: '手工酸种吐司',
    location: '晨间面包房',
    date: '10月10日',
    imageUrl: 'https://picsum.photos/id/1080/800/1000',
    tags: ['早午餐', '有机'],
    rating: 4.5,
    description: '本地采购的牛油果配上水波蛋和少许辣椒碎。',
    weather: { temperature: 18, condition: '多云', code: 1 }
  },
  {
    id: '3',
    title: '主厨特选寿司',
    location: '禅 · 寿司',
    date: '10月08日',
    imageUrl: 'https://picsum.photos/id/225/800/1000',
    tags: ['晚餐', '日料'],
    rating: 5.0,
    description: '一场十二道时令鱼生的味觉之旅。',
    weather: { temperature: 15, condition: '下雨', code: 61 }
  },
  {
      id: '4',
      title: '埃塞俄比亚手冲',
      location: '蓝瓶咖啡',
      date: '10月05日',
      imageUrl: 'https://picsum.photos/id/1060/800/1000',
      tags: ['咖啡', '午后'],
      rating: 4.2,
      description: '带有蓝莓气息的花香调。',
      weather: { temperature: 20, condition: '晴朗', code: 0 }
  }
];

const ProfileView = () => (
  <div className="flex flex-col items-center justify-center h-screen text-stone-400 gap-4">
    <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center">
        <span className="serif text-2xl text-stone-500">我</span>
    </div>
    <span className="text-xs font-medium tracking-[0.2em] uppercase">个人中心 · 暂未开放</span>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [homeScrollPos, setHomeScrollPos] = useState(0);
  
  // Persistent Layout Mode
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('gourmet_layout_mode') as 'grid' | 'list') || 'grid';
  });

  const [entries, setEntries] = useState<FoodEntry[]>(() => {
    try {
      const saved = localStorage.getItem('gourmet_journal_entries');
      return saved ? JSON.parse(saved) : INITIAL_ENTRIES;
    } catch (e) {
      return INITIAL_ENTRIES;
    }
  });

  const handleUpdateEntries = (newEntries: FoodEntry[]) => {
      setEntries(newEntries);
      localStorage.setItem('gourmet_journal_entries', JSON.stringify(newEntries));
  };

  const handleLayoutChange = (mode: 'grid' | 'list') => {
      setLayoutMode(mode);
      localStorage.setItem('gourmet_layout_mode', mode);
  };

  const getActiveEntry = () => entries.find(e => e.id === selectedEntryId);

  const handleSaveEntry = (entry: FoodEntry) => {
    let updatedEntries;
    if (entries.some(e => e.id === entry.id)) {
        updatedEntries = entries.map(e => e.id === entry.id ? entry : e);
    } else {
        updatedEntries = [entry, ...entries];
    }
    handleUpdateEntries(updatedEntries);
    
    if (currentView === ViewState.EDIT) {
        setCurrentView(ViewState.DETAIL);
    } else {
        setCurrentView(ViewState.HOME);
    }
  };

  const handleEntryClick = (id: string) => {
      setSelectedEntryId(id);
      setCurrentView(ViewState.DETAIL);
  };

  const handleEditClick = () => {
      setCurrentView(ViewState.EDIT);
  };

  const handleBack = () => {
      if (currentView === ViewState.DETAIL) setCurrentView(ViewState.HOME);
      else if (currentView === ViewState.EDIT) setCurrentView(ViewState.DETAIL);
      else setCurrentView(ViewState.HOME);
  };

  const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 1.02 }
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return (
            <HomeView 
                entries={entries} 
                onEntriesUpdate={handleUpdateEntries}
                onEntryClick={handleEntryClick} 
                layoutMode={layoutMode}
                onLayoutChange={handleLayoutChange}
                initialScroll={homeScrollPos}
                onScrollSave={setHomeScrollPos}
            />
        );
      case ViewState.SEARCH:
        return <DiscoverView />;
      case ViewState.ADD:
        return <AddEntryView onSave={handleSaveEntry} onCancel={() => setCurrentView(ViewState.HOME)} />;
      case ViewState.PROFILE:
        return <ProfileView />;
      case ViewState.DETAIL:
        const entry = getActiveEntry();
        return entry ? <DetailView entry={entry} onBack={handleBack} onEdit={handleEditClick} /> : null;
      case ViewState.EDIT:
        const editEntry = getActiveEntry();
        return editEntry ? <AddEntryView initialEntry={editEntry} onSave={handleSaveEntry} onCancel={handleBack} /> : null;
      default:
        return (
            <HomeView 
                entries={entries} 
                onEntriesUpdate={handleUpdateEntries}
                onEntryClick={handleEntryClick} 
                layoutMode={layoutMode}
                onLayoutChange={handleLayoutChange}
                initialScroll={homeScrollPos}
                onScrollSave={setHomeScrollPos}
            />
        );
    }
  };

  const showBottomNav = [ViewState.HOME, ViewState.SEARCH, ViewState.PROFILE].includes(currentView);

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-800 relative selection:bg-stone-200 overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-white/80 to-transparent pointer-events-none z-0" />
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-stone-200/30 rounded-full blur-[100px] pointer-events-none z-0 mix-blend-multiply" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-warm-gray-100/40 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply" />

      <main className="relative z-10 w-full min-h-screen safe-area-bottom">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentView}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={{ type: "tween", ease: "circOut", duration: 0.3 }}
            className="w-full h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showBottomNav && (
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                transition={{ duration: 0.3 }}
                className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
            >
                <BottomNav currentView={currentView} onChange={setCurrentView} />
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
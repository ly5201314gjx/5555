import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ViewState, FoodEntry } from './types';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { DiscoverView } from './views/DiscoverView';
import { AddEntryView } from './views/AddEntryView';
import { DetailView } from './views/DetailView';

// Initial Mock Data with multiple images structure
const INITIAL_ENTRIES: FoodEntry[] = [
  {
    id: '1',
    title: '宇治抹茶舒芙蕾',
    location: '京都茶寮',
    date: '10月12日',
    images: ['https://picsum.photos/id/431/800/1000', 'https://picsum.photos/id/432/800/1000'],
    coverImageIndex: 0,
    tags: ['早餐', '漂亮饭'],
    rating: 4.8,
    description: '如云朵般蓬松的口感，散发着浓郁的抹茶香气。',
    weather: { temperature: 22, condition: '晴朗', code: 0, locationName: '京都' }
  },
  {
    id: '2',
    title: '手工酸种吐司',
    location: '晨间面包房',
    date: '10月10日',
    images: ['https://picsum.photos/id/1080/800/1000'],
    coverImageIndex: 0,
    tags: ['早餐', '大吃特吃'],
    rating: 4.5,
    description: '本地采购的牛油果配上水波蛋和少许辣椒碎。',
    weather: { temperature: 18, condition: '多云', code: 1, locationName: '上海' }
  },
  {
    id: '3',
    title: '主厨特选寿司',
    location: '禅 · 寿司',
    date: '10月08日',
    images: ['https://picsum.photos/id/225/800/1000', 'https://picsum.photos/id/226/800/1000', 'https://picsum.photos/id/227/800/1000'],
    coverImageIndex: 0,
    tags: ['大吃特吃'],
    rating: 5.0,
    description: '一场十二道时令鱼生的味觉之旅。',
    weather: { temperature: 15, condition: '下雨', code: 61, locationName: '东京' }
  },
  {
      id: '4',
      title: '深夜关东煮',
      location: '便利店',
      date: '10月05日',
      images: ['https://picsum.photos/id/1060/800/1000'],
      coverImageIndex: 0,
      tags: ['超市', '小吃小喝'],
      rating: 4.2,
      description: '温暖的萝卜和魔芋丝。',
      weather: { temperature: 10, condition: '晴朗', code: 0, locationName: '北京' }
  }
];

const DEFAULT_TAGS = ['早餐', '漂亮饭', '大吃特吃', '小吃小喝', '超市'];

const ProfileView = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center justify-center h-screen text-stone-400 gap-4"
  >
    <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center shadow-inner">
        <span className="serif text-2xl text-stone-500">我</span>
    </div>
    <span className="text-xs font-medium tracking-[0.2em] uppercase">个人中心 · 暂未开放</span>
  </motion.div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [homeScrollPos, setHomeScrollPos] = useState(0);
  
  // Persistent Layout Mode
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('gourmet_layout_mode') as 'grid' | 'list') || 'grid';
  });

  // Entries State
  const [entries, setEntries] = useState<FoodEntry[]>(() => {
    try {
      const saved = localStorage.getItem('gourmet_journal_entries');
      return saved ? JSON.parse(saved) : INITIAL_ENTRIES;
    } catch (e) {
      return INITIAL_ENTRIES;
    }
  });

  // Tags State - Single Source of Truth
  const [tags, setTags] = useState<string[]>(() => {
      try {
          const saved = localStorage.getItem('gourmet_tags');
          if (saved) return JSON.parse(saved);
          return DEFAULT_TAGS; 
      } catch(e) {
          return DEFAULT_TAGS;
      }
  });

  // Persist Tags
  useEffect(() => {
      localStorage.setItem('gourmet_tags', JSON.stringify(tags));
  }, [tags]);

  const handleUpdateEntries = (newEntries: FoodEntry[]) => {
      setEntries(newEntries);
      localStorage.setItem('gourmet_journal_entries', JSON.stringify(newEntries));
  };

  // --- Tag Management Functions ---

  const handleAddTag = (newTag: string) => {
      if (!newTag.trim()) return;
      const tag = newTag.trim();
      if (!tags.includes(tag)) {
          setTags(prev => [...prev, tag]); 
      }
  };

  const handleDeleteTag = (tagToDelete: string) => {
      setTags(prev => prev.filter(t => t !== tagToDelete));
  };

  const handleReorderTags = (newTags: string[]) => {
      setTags(newTags);
  };

  const handleRenameTag = (oldTag: string, newTag: string) => {
    if (!oldTag || !newTag || oldTag === newTag) return;
    
    const trimmedNewTag = newTag.trim();

    setTags(prev => {
        if (prev.includes(trimmedNewTag)) {
            return prev.filter(t => t !== oldTag);
        }
        return prev.map(t => t === oldTag ? trimmedNewTag : t);
    });

    const updatedEntries = entries.map(entry => {
      if (entry.tags.includes(oldTag)) {
        const hasNew = entry.tags.includes(trimmedNewTag);
        let newEntryTags;

        if (hasNew) {
            newEntryTags = entry.tags.filter(t => t !== oldTag);
        } else {
            newEntryTags = entry.tags.map(t => t === oldTag ? trimmedNewTag : t);
        }
        return { ...entry, tags: newEntryTags };
      }
      return entry;
    });
    
    handleUpdateEntries(updatedEntries);
  };

  // --- View Handlers ---

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
    entry.tags.forEach(t => handleAddTag(t));

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

  // Modern, Native-feel Transitions
  const pageVariants = {
    initial: { 
        opacity: 0, 
        scale: 0.96,
        filter: "blur(4px)"
    },
    in: { 
        opacity: 1, 
        scale: 1,
        filter: "blur(0px)"
    },
    out: { 
        opacity: 0, 
        scale: 1.04, // Slightly zoom in on exit like iOS
        filter: "blur(2px)"
    }
  };

  const pageTransition = {
      duration: 0.4,
      ease: [0.19, 1, 0.22, 1] // Exponential Out - Very smooth
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
                tags={tags} 
                onRenameTag={handleRenameTag}
                onDeleteTag={handleDeleteTag}
                onReorderTags={handleReorderTags}
            />
        );
      case ViewState.SEARCH:
        return <DiscoverView />;
      case ViewState.ADD:
        return (
          <AddEntryView 
            onSave={handleSaveEntry} 
            onCancel={() => setCurrentView(ViewState.HOME)} 
            availableTags={tags}
            onAddTag={handleAddTag}
          />
        );
      case ViewState.PROFILE:
        return <ProfileView />;
      case ViewState.DETAIL:
        const entry = getActiveEntry();
        return entry ? <DetailView entry={entry} onBack={handleBack} onEdit={handleEditClick} /> : null;
      case ViewState.EDIT:
        const editEntry = getActiveEntry();
        return editEntry ? (
            <AddEntryView 
                initialEntry={editEntry} 
                onSave={handleSaveEntry} 
                onCancel={handleBack}
                availableTags={tags}
                onAddTag={handleAddTag}
            />
        ) : null;
      default:
        return null;
    }
  };

  const showBottomNav = [ViewState.HOME, ViewState.SEARCH, ViewState.PROFILE].includes(currentView);

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-800 relative selection:bg-stone-200 overflow-x-hidden">
      {/* Background gradients */}
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
            transition={pageTransition}
            className="w-full h-full absolute inset-0" 
            style={{ 
              overflowY: currentView === ViewState.HOME ? 'hidden' : 'auto', 
              height: '100%',
              // Perspective gives a slight 3D feel to scale transforms
              perspective: '1000px'
            }}
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
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
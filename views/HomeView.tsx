import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FoodCard } from '../components/FoodCard';
import { MiniCapsule } from '../components/MiniCapsule';
import { FoodEntry } from '../types';
import { Trash2, X, LayoutGrid, LayoutList, Tag, FolderInput, ArrowRightLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';

// dnd-kit imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  TouchSensor,
  MouseSensor,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HomeViewProps {
  entries: FoodEntry[];
  onEntriesUpdate: (entries: FoodEntry[]) => void;
  onEntryClick: (id: string) => void;
  layoutMode: 'grid' | 'list';
  onLayoutChange: (mode: 'grid' | 'list') => void;
  initialScroll: number;
  onScrollSave: (pos: number) => void;
  allTags: string[]; // Recieve global tags
}

// Wrapper Component for Sortable Items
const SortableFoodCardWrapper = ({ id, children, disabled, layoutMode }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        touchAction: 'none', 
        position: 'relative' as const,
    };

    return (
        <motion.div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners} 
            layout // Enable Framer Motion layout animations
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
                opacity: isDragging ? 0.3 : 1, 
                scale: isDragging ? 1.05 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
        >
            {children}
        </motion.div>
    );
};

export const HomeView: React.FC<HomeViewProps> = ({ 
    entries, 
    onEntriesUpdate,
    onEntryClick,
    layoutMode,
    onLayoutChange,
    initialScroll,
    onScrollSave,
    allTags
}) => {
  const [activeCategory, setActiveCategory] = useState("全部");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  // Modals & States
  const [deleteConfirmType, setDeleteConfirmType] = useState<'cards' | 'tag_only' | 'tag_all' | null>(null);
  const [manageTag, setManageTag] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll Restoration
  useLayoutEffect(() => {
    if (containerRef.current) {
        containerRef.current.scrollTop = initialScroll;
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      onScrollSave(e.currentTarget.scrollTop);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150, 
        tolerance: 5, 
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Use props tags instead of calculating locally
  const categories = useMemo(() => {
    return ["全部", ...allTags.sort()];
  }, [allTags]);

  const visibleEntries = useMemo(() => {
      return activeCategory === "全部" 
        ? entries 
        : entries.filter(e => e.tags.includes(activeCategory));
  }, [entries, activeCategory]);

  // Handlers
  const handleDragStart = (event: DragStartEvent) => {
      setActiveDragId(event.active.id as string);
      if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleDragEnd = (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      
      if (active.id !== over?.id && activeCategory === "全部") {
        const oldIndex = entries.findIndex((item) => item.id === active.id);
        const newIndex = entries.findIndex((item) => item.id === over?.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
            onEntriesUpdate(arrayMove(entries, oldIndex, newIndex));
        }
      }
  };

  const toggleSelectionMode = () => {
      setIsSelectionMode(!isSelectionMode);
      setSelectedIds([]);
      setDeleteConfirmType(null);
  };

  const handleCardClick = (id: string) => {
      if (isSelectionMode) {
          if (selectedIds.includes(id)) {
              setSelectedIds(selectedIds.filter(i => i !== id));
          } else {
              setSelectedIds([...selectedIds, id]);
          }
      } else {
          onEntryClick(id);
      }
  };

  const handleCardLongPress = (id: string) => {
      if (!isSelectionMode) {
          setIsSelectionMode(true);
          setSelectedIds([id]);
          if (navigator.vibrate) navigator.vibrate(50);
      }
  };

  // --- Actions ---
  const executeDeleteCards = () => {
      const remaining = entries.filter(e => !selectedIds.includes(e.id));
      onEntriesUpdate(remaining);
      resetSelection();
  };

  const executeMoveCards = (targetTag: string) => {
      let idsToMove = selectedIds;
      if (manageTag) {
          idsToMove = entries.filter(e => e.tags.includes(manageTag)).map(e => e.id);
      }

      const updated = entries.map(e => {
          if (idsToMove.includes(e.id)) {
              let newTags = [...e.tags];
              if (manageTag) newTags = newTags.filter(t => t !== manageTag);
              if (!newTags.includes(targetTag)) newTags.push(targetTag);
              return { ...e, tags: newTags };
          }
          return e;
      });

      onEntriesUpdate(updated);
      
      if (manageTag) {
          setManageTag(null);
          setActiveCategory("全部");
      } else {
          resetSelection();
      }
      setShowMoveModal(false);
  };

  const resetSelection = () => {
      setIsSelectionMode(false);
      setSelectedIds([]);
      setDeleteConfirmType(null);
  };

  const handleTagLongPress = (tag: string) => {
      if (tag === "全部") return;
      if (navigator.vibrate) navigator.vibrate(50);
      setManageTag(tag);
  };

  const executeDeleteTagOnly = () => {
      if (!manageTag) return;
      const updated = entries.map(e => ({
          ...e,
          tags: e.tags.filter(t => t !== manageTag)
      }));
      onEntriesUpdate(updated);
      setManageTag(null);
      setDeleteConfirmType(null);
      setActiveCategory("全部");
  };

  const executeDeleteTagAndCards = () => {
      if (!manageTag) return;
      const updated = entries.filter(e => !e.tags.includes(manageTag));
      onEntriesUpdate(updated);
      setManageTag(null);
      setDeleteConfirmType(null);
      setActiveCategory("全部");
  };

  return (
    <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto no-scrollbar bg-[#FAFAF9] relative"
    >
      <div className="pb-36 pt-safe-top px-4 max-w-2xl mx-auto min-h-screen">
        
        {/* Header Row: Title & Actions */}
        <div className="flex items-center justify-between mb-4 pt-4 px-1">
            <AnimatePresence mode="wait">
                {isSelectionMode ? (
                    <motion.div 
                        key="select-mode"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center justify-between w-full"
                    >
                         <div className="flex items-center gap-3">
                            <button 
                                onClick={toggleSelectionMode} 
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
                            >
                                <X size={16} />
                            </button>
                            <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
                                已选 {selectedIds.length}
                            </span>
                         </div>
                         
                         <div className="flex items-center gap-2">
                            <button 
                                onClick={() => selectedIds.length > 0 && setShowMoveModal(true)}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${selectedIds.length > 0 ? 'bg-stone-100 text-stone-600 hover:bg-stone-200' : 'bg-stone-50 text-stone-200'}`}
                            >
                                <FolderInput size={16} />
                            </button>
                            <button 
                                onClick={() => selectedIds.length > 0 && setDeleteConfirmType('cards')}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${selectedIds.length > 0 ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-stone-50 text-stone-200'}`}
                            >
                                <Trash2 size={16} />
                            </button>
                         </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="normal-mode"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-between w-full"
                    >
                        <h1 className="serif text-xl font-medium text-stone-800 tracking-wide pl-1">食 · 记</h1>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={toggleSelectionMode}
                                className="w-9 h-9 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 transition-colors"
                            >
                                <CheckCircle2 size={18} />
                            </button>
                            <button 
                                onClick={() => onLayoutChange(layoutMode === 'grid' ? 'list' : 'grid')}
                                className="w-9 h-9 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 transition-colors"
                            >
                                {layoutMode === 'grid' ? <LayoutList size={18} /> : <LayoutGrid size={18} />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Sticky Floating Glass Category Bar - Enhanced Scroll */}
        <div className="sticky top-4 z-40 mb-6">
            <AnimatePresence>
                {!isSelectionMode && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="w-full"
                    >
                        {/* Glass Container */}
                        <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-stone-200/40 rounded-full py-1.5 px-2 relative overflow-hidden flex">
                             {/* Scrollable Area - Removed restrictive max-widths and ensured overflow handling */}
                             <div className="flex-1 overflow-x-auto no-scrollbar relative w-full touch-pan-x">
                                <div className="flex gap-1.5 px-1 items-center w-max">
                                    {categories.map((cat) => (
                                        <motion.div 
                                            key={cat} 
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex-shrink-0"
                                        >
                                            <MiniCapsule 
                                                label={cat} 
                                                active={activeCategory === cat} 
                                                onClick={() => setActiveCategory(cat)}
                                                onLongPress={() => handleTagLongPress(cat)}
                                                // Override styles for the glass bar
                                                className={`!py-1.5 !px-4 !text-[10px] ${activeCategory === cat ? '!shadow-none !bg-stone-800 !text-white' : '!bg-transparent !border-transparent !text-stone-500 hover:!bg-stone-100/50'}`}
                                            />
                                        </motion.div>
                                    ))}
                                    <div className="w-2 flex-shrink-0" />
                                </div>
                             </div>
                             
                             {/* Fade Gradients for visual cue */}
                             <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white/80 to-transparent pointer-events-none rounded-l-full z-10" />
                             <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white/80 to-transparent pointer-events-none rounded-r-full z-10" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Content Feed with DndContext */}
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext 
                items={visibleEntries.map(e => e.id)} 
                strategy={layoutMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
                disabled={activeCategory !== "全部"} 
            >
                <motion.div 
                    layout 
                    className={layoutMode === 'grid' ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2"}
                >
                    {visibleEntries.map((entry, index) => (
                        <SortableFoodCardWrapper 
                            key={entry.id} 
                            id={entry.id} 
                            layoutMode={layoutMode}
                        >
                            <FoodCard 
                                entry={entry} 
                                index={index} 
                                isSelectionMode={isSelectionMode}
                                isSelected={selectedIds.includes(entry.id)}
                                layoutMode={layoutMode}
                                onClick={() => handleCardClick(entry.id)}
                                onLongPress={() => handleCardLongPress(entry.id)}
                            />
                        </SortableFoodCardWrapper>
                    ))}
                </motion.div>
            </SortableContext>

            <DragOverlay adjustScale={true}>
                {activeDragId ? (
                    <div className="opacity-90 scale-105 cursor-grabbing z-50 pointer-events-none">
                         <FoodCard 
                            entry={entries.find(e => e.id === activeDragId)!}
                            index={0}
                            isSelectionMode={isSelectionMode} 
                            isSelected={selectedIds.includes(activeDragId)}
                            layoutMode={layoutMode}
                            onClick={() => {}}
                         />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>

        {visibleEntries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-stone-300">
                <div className="text-4xl mb-2">🍃</div>
                <p className="text-xs tracking-widest">暂无记录</p>
            </div>
        )}

        {/* --- Modals --- */}
        <AnimatePresence>
            {manageTag && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/10 backdrop-blur-[2px]"
                    onClick={() => setManageTag(null)}
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 10 }} 
                        animate={{ scale: 1, y: 0 }} 
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white/90 backdrop-blur-xl rounded-full p-2 pr-4 shadow-2xl flex items-center gap-4 border border-white/50"
                    >
                         <div className="flex items-center gap-2 pl-4 pr-3 border-r border-stone-200">
                             <Tag size={14} className="text-stone-400" />
                             <span className="text-sm font-semibold text-stone-700 tracking-wide">{manageTag}</span>
                         </div>
                         <div className="flex items-center gap-3">
                             <button onClick={() => setShowMoveModal(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-800 hover:text-white transition-all"><ArrowRightLeft size={16} /></button>
                             <button onClick={() => setDeleteConfirmType('tag_only')} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-amber-100 hover:text-amber-600 transition-all"><X size={16} /></button>
                             <button onClick={() => setDeleteConfirmType('tag_all')} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-red-100 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                         </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {deleteConfirmType && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 backdrop-blur-sm p-8"
                    onClick={() => setDeleteConfirmType(null)}
                >
                     <motion.div 
                        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-xs flex flex-col items-center text-center"
                    >
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3 text-red-500">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-stone-800 mb-1">确认删除?</h3>
                        <p className="text-xs text-stone-500 mb-5 leading-relaxed">此操作无法撤销。</p>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setDeleteConfirmType(null)} className="flex-1 py-2 text-xs font-medium text-stone-500 bg-stone-100 rounded-lg">取消</button>
                            <button 
                                onClick={() => {
                                    if (deleteConfirmType === 'cards') executeDeleteCards();
                                    else if (deleteConfirmType === 'tag_only') executeDeleteTagOnly();
                                    else if (deleteConfirmType === 'tag_all') executeDeleteTagAndCards();
                                }} 
                                className="flex-1 py-2 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
                            >
                                确认删除
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {showMoveModal && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/20 backdrop-blur-sm p-6"
                    onClick={() => setShowMoveModal(false)}
                >
                     <motion.div 
                        initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-xs max-h-[60vh] overflow-y-auto"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <FolderInput size={18} className="text-stone-800" />
                            <h3 className="text-sm font-semibold text-stone-800">迁移至...</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {categories.filter(c => c !== "全部" && c !== manageTag).map(cat => (
                                <button key={cat} onClick={() => executeMoveCards(cat)} className="px-4 py-2 rounded-full bg-stone-100 text-stone-600 text-xs font-medium hover:bg-stone-800 hover:text-white transition-colors">
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowMoveModal(false)} className="w-full mt-6 py-2.5 text-xs text-stone-400 hover:text-stone-600 bg-stone-50 rounded-xl">取消</button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};
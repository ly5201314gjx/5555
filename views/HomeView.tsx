import React, { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FoodCard } from '../components/FoodCard';
import { MiniCapsule } from '../components/MiniCapsule';
import { FoodEntry } from '../types';
import { Trash2, X, LayoutGrid, LayoutList, Tag, FolderInput, ArrowRightLeft, AlertTriangle, CheckCircle2, Edit2, Check, GripVertical, ArrowDownUp } from 'lucide-react';

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
  DragStartEvent,
  TouchSensor
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
  tags: string[]; 
  onRenameTag: (oldTag: string, newTag: string) => void;
  onDeleteTag: (tag: string) => void;
  onReorderTags: (tags: string[]) => void;
}

// Wrapper Component for Sortable Cards
const SortableFoodCardWrapper = ({ id, children, disabled }: any) => {
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
        touchAction: 'pan-y', 
        position: 'relative' as const,
    };

    return (
        <motion.div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners} 
            layout 
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

// Simplified Sortable Item for Sort Modal (Just Drag Handle + Text)
const SortableTagItemSimple = ({ id, tag }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 60 : 'auto',
        touchAction: 'none',
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl mb-2 touch-none">
            {/* Drag Handle - Full item draggable for ease or specific handle */}
            <div {...attributes} {...listeners} className="text-stone-300 cursor-grab active:cursor-grabbing p-1">
                <GripVertical size={16} />
            </div>
            <span className="text-sm font-medium text-stone-700">{tag}</span>
        </div>
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
    tags,
    onRenameTag,
    onDeleteTag,
    onReorderTags
}) => {
  const [activeCategory, setActiveCategory] = useState("全部");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  // Modals & States
  const [deleteConfirmType, setDeleteConfirmType] = useState<'cards' | 'tag_only' | 'tag_all' | null>(null);
  
  // Tag Context Menu (Restored from Turn 2)
  const [manageTag, setManageTag] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Sort Modal State
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  // Move Modal State (For selected cards)
  const [showMoveModal, setShowMoveModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
        containerRef.current.scrollTop = initialScroll;
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      onScrollSave(e.currentTarget.scrollTop);
  };

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 400, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const categories = useMemo(() => {
    return ["全部", ...tags];
  }, [tags]);

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

  const handleTagDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
          const oldIndex = tags.indexOf(active.id as string);
          const newIndex = tags.indexOf(over.id as string);
          if (oldIndex !== -1 && newIndex !== -1) {
              onReorderTags(arrayMove(tags, oldIndex, newIndex));
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

  // --- Tag Logic ---
  const handleTagLongPress = (tag: string) => {
      if (tag === "全部") return;
      if (navigator.vibrate) navigator.vibrate(50);
      setManageTag(tag);
      setIsRenaming(false);
      setRenameValue(tag);
  };

  const closeManageModal = () => {
      setManageTag(null);
      setIsRenaming(false);
  };

  const executeRename = () => {
      if (manageTag && renameValue.trim() && renameValue !== manageTag) {
          onRenameTag(manageTag, renameValue.trim());
          if (activeCategory === manageTag) {
              setActiveCategory(renameValue.trim());
          }
      }
      closeManageModal();
  };

  // Delete Actions from Manage Modal
  const requestDeleteTag = (type: 'tag_only' | 'tag_all') => {
      setDeleteConfirmType(type);
  };

  // Execution of Delete
  const executeDeleteConfirm = () => {
      if (!manageTag) return;
      
      if (deleteConfirmType === 'tag_only') {
           const updated = entries.map(e => ({
              ...e,
              tags: e.tags.filter(t => t !== manageTag)
           }));
           onEntriesUpdate(updated);
           onDeleteTag(manageTag);
      } else if (deleteConfirmType === 'tag_all') {
           const updated = entries.filter(e => !e.tags.includes(manageTag));
           onEntriesUpdate(updated);
           onDeleteTag(manageTag);
      }

      if (activeCategory === manageTag) setActiveCategory("全部");
      
      setDeleteConfirmType(null);
      closeManageModal();
  };

  const executeDeleteCards = () => {
      const remaining = entries.filter(e => !selectedIds.includes(e.id));
      onEntriesUpdate(remaining);
      setIsSelectionMode(false);
      setSelectedIds([]);
      setDeleteConfirmType(null);
  };

  // Move Logic
  const executeMoveCards = (targetTag: string) => {
      const updated = entries.map(e => {
          if (selectedIds.includes(e.id)) {
              let newTags = [...e.tags];
              if (!newTags.includes(targetTag)) newTags.push(targetTag);
              return { ...e, tags: newTags };
          }
          return e;
      });
      onEntriesUpdate(updated);
      setIsSelectionMode(false);
      setSelectedIds([]);
      setShowMoveModal(false);
  };

  const isDragDisabled = activeCategory !== "全部" || isSelectionMode;

  return (
    <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto no-scrollbar bg-[#FAFAF9] relative"
    >
      <div className="pb-36 pt-safe-top px-4 max-w-2xl mx-auto min-h-screen">
        
        {/* Header Row */}
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
                            <button onClick={toggleSelectionMode} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors">
                                <X size={16} />
                            </button>
                            <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
                                已选 {selectedIds.length}
                            </span>
                         </div>
                         <div className="flex items-center gap-2">
                            <button onClick={() => selectedIds.length > 0 && setShowMoveModal(true)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${selectedIds.length > 0 ? 'bg-stone-100 text-stone-600 hover:bg-stone-200' : 'bg-stone-50 text-stone-200'}`}>
                                <FolderInput size={16} />
                            </button>
                            <button onClick={() => selectedIds.length > 0 && setDeleteConfirmType('cards')} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${selectedIds.length > 0 ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-stone-50 text-stone-200'}`}>
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
                             <button onClick={() => setIsSortModalOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 transition-colors">
                                <ArrowDownUp size={16} />
                             </button>
                            <button onClick={toggleSelectionMode} className="w-9 h-9 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 transition-colors">
                                <CheckCircle2 size={18} />
                            </button>
                            <button onClick={() => onLayoutChange(layoutMode === 'grid' ? 'list' : 'grid')} className="w-9 h-9 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 transition-colors">
                                {layoutMode === 'grid' ? <LayoutList size={18} /> : <LayoutGrid size={18} />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Category Bar with Sliding Module Visualization & Visible Scrollbar */}
        <div className="sticky top-4 z-40 mb-6 px-1">
            <AnimatePresence>
                {!isSelectionMode && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="w-full"
                    >
                        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl shadow-stone-200/40 rounded-[24px] p-2 pb-1 relative flex flex-col">
                             {/* Scroll Container with Snap & Custom Styled Scrollbar */}
                             {/* The arbitrary classes customize the webkit scrollbar to act as the "sliding horizontal bar" */}
                             <div className="w-full overflow-x-auto touch-pan-x overscroll-contain snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:mx-4 [&::-webkit-scrollbar-thumb]:bg-stone-300/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-stone-400">
                                <div className="flex gap-3 px-2 items-center w-max min-w-full">
                                    {categories.map((cat) => (
                                        <motion.div key={cat} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-shrink-0 snap-start">
                                            <MiniCapsule 
                                                label={cat} 
                                                active={activeCategory === cat} 
                                                onClick={() => setActiveCategory(cat)}
                                                onLongPress={() => handleTagLongPress(cat)}
                                                // Enhanced Visuals for "Module" feel - blocky and distinct
                                                className={`!py-2.5 !px-6 !text-xs shadow-sm transition-all duration-300 ${activeCategory === cat ? '!shadow-md !bg-stone-800 !text-white scale-100 ring-2 ring-stone-800 ring-offset-1' : '!bg-white !border-stone-100 !text-stone-500 hover:!bg-stone-50 hover:scale-[1.02]'}`}
                                            />
                                        </motion.div>
                                    ))}
                                    <div className="w-2 flex-shrink-0" />
                                </div>
                             </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Card Feed */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleEntries.map(e => e.id)} strategy={layoutMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy} disabled={isDragDisabled}>
                <motion.div layout className={layoutMode === 'grid' ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2"}>
                    {visibleEntries.map((entry, index) => (
                        <SortableFoodCardWrapper key={entry.id} id={entry.id} disabled={isDragDisabled}>
                            <FoodCard entry={entry} index={index} isSelectionMode={isSelectionMode} isSelected={selectedIds.includes(entry.id)} layoutMode={layoutMode} onClick={() => handleCardClick(entry.id)} onLongPress={() => handleCardLongPress(entry.id)} />
                        </SortableFoodCardWrapper>
                    ))}
                </motion.div>
            </SortableContext>
            <DragOverlay adjustScale={true}>
                {activeDragId ? (
                    <div className="opacity-90 scale-105 cursor-grabbing z-50 pointer-events-none">
                         <FoodCard entry={entries.find(e => e.id === activeDragId)!} index={0} isSelectionMode={isSelectionMode} isSelected={selectedIds.includes(activeDragId)} layoutMode={layoutMode} onClick={() => {}} />
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

        {/* --- 1. Tag Context Menu --- */}
        <AnimatePresence>
            {manageTag && !deleteConfirmType && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/10 backdrop-blur-[2px]"
                    onClick={closeManageModal}
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 10 }} 
                        animate={{ scale: 1, y: 0 }} 
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white/90 backdrop-blur-xl rounded-full p-2 pr-4 shadow-2xl flex items-center gap-4 border border-white/50"
                    >
                         {isRenaming ? (
                             <div className="flex items-center gap-2 pl-2">
                                 <input 
                                    autoFocus
                                    type="text" 
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    className="bg-stone-100 rounded-full px-3 py-1.5 text-sm text-stone-800 focus:outline-none w-32"
                                    placeholder="新标签名"
                                 />
                                 <button onClick={executeRename} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-800 text-white hover:scale-105 transition-all"><Check size={16} /></button>
                                 <button onClick={() => setIsRenaming(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-all"><X size={16} /></button>
                             </div>
                         ) : (
                             <>
                                <div className="flex items-center gap-2 pl-4 pr-3 border-r border-stone-200">
                                    <Tag size={14} className="text-stone-400" />
                                    <span className="text-sm font-semibold text-stone-700 tracking-wide">{manageTag}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setIsRenaming(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-800 hover:text-white transition-all"><Edit2 size={14} /></button>
                                    <button onClick={() => requestDeleteTag('tag_only')} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-amber-100 hover:text-amber-600 transition-all"><X size={16} /></button>
                                    <button onClick={() => requestDeleteTag('tag_all')} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-red-100 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                </div>
                             </>
                         )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- 2. Exquisite Sort Modal --- */}
        <AnimatePresence>
            {isSortModalOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm"
                    onClick={() => setIsSortModalOpen(false)}
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-3xl w-64 shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-stone-50 bg-stone-50/50">
                            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">标签排序</h2>
                            <button onClick={() => setIsSortModalOpen(false)} className="text-stone-400 hover:text-stone-800"><X size={16} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <DndContext sensors={sortSensors} collisionDetection={closestCenter} onDragEnd={handleTagDragEnd}>
                                <SortableContext items={tags} strategy={verticalListSortingStrategy}>
                                    {tags.map((tag) => (
                                        <SortableTagItemSimple key={tag} id={tag} tag={tag} />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- 3. Confirmation Dialogs --- */}
        <AnimatePresence>
            {deleteConfirmType && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 backdrop-blur-sm p-8"
                    onClick={() => {
                        setDeleteConfirmType(null);
                        setManageTag(null);
                    }}
                >
                     <motion.div 
                        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-xs flex flex-col items-center text-center"
                    >
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3 text-red-500"><AlertTriangle size={24} /></div>
                        
                        {deleteConfirmType === 'cards' ? (
                             <>
                                <h3 className="text-sm font-bold text-stone-800 mb-1">确认删除?</h3>
                                <p className="text-xs text-stone-500 mb-5 leading-relaxed">删除选中的记录？此操作无法撤销。</p>
                                <div className="flex gap-3 w-full">
                                    <button onClick={() => setDeleteConfirmType(null)} className="flex-1 py-2 text-xs font-medium text-stone-500 bg-stone-100 rounded-lg">取消</button>
                                    <button onClick={executeDeleteCards} className="flex-1 py-2 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">确认删除</button>
                                </div>
                             </>
                        ) : (
                             <>
                                <h3 className="text-sm font-bold text-stone-800 mb-4">删除标签 "{manageTag}"?</h3>
                                <div className="flex flex-col gap-2 w-full">
                                    {deleteConfirmType === 'tag_only' && <button onClick={executeDeleteConfirm} className="py-2.5 text-xs font-medium text-white bg-red-500 rounded-lg">确认删除标签 (保留记录)</button>}
                                    {deleteConfirmType === 'tag_all' && <button onClick={executeDeleteConfirm} className="py-2.5 text-xs font-medium text-white bg-red-500 rounded-lg">确认删除标签及关联记录</button>}
                                    <button onClick={() => { setDeleteConfirmType(null); setManageTag(null); }} className="py-2.5 text-xs text-stone-400 mt-2">取消</button>
                                </div>
                             </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- 4. Move Modal --- */}
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
                            {categories.filter(c => c !== "全部").map(cat => (
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
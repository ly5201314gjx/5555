import React, { memo, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Check } from 'lucide-react';
import { FoodEntry } from '../types';

interface FoodCardProps {
  entry: FoodEntry;
  index: number;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  layoutMode?: 'grid' | 'list';
  onClick: () => void;
  onLongPress?: () => void;
}

export const FoodCard: React.FC<FoodCardProps> = memo(({ 
    entry, 
    index, 
    isSelectionMode = false, 
    isSelected = false,
    layoutMode = 'grid',
    onClick, 
    onLongPress
}) => {
  const timerRef = useRef<number | null>(null);

  // We keep a simple long press handler for the selection mode trigger.
  // Note: dnd-kit will handle the 'drag' interactions via the wrapper.
  const startPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (onLongPress) {
        onLongPress();
      }
    }, 500); // 500ms trigger for selection mode
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Grid Layout
  if (layoutMode === 'grid') {
    return (
      <div
        className="w-full mb-1 group break-inside-avoid cursor-pointer select-none relative h-full"
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div 
            className="relative h-full"
        >
            {isSelectionMode && (
                <div className={`absolute top-3 left-3 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-md shadow-sm ${isSelected ? 'bg-stone-800 border-stone-800' : 'bg-white/60 border-white text-transparent'}`}>
                    <Check size={12} className={isSelected ? "text-white" : ""} strokeWidth={3} />
                </div>
            )}

            <div className={`relative overflow-hidden rounded-[1.5rem] shadow-sm shadow-stone-200 transition-all duration-300 ease-out bg-stone-100 aspect-[3/4] ${isSelected ? 'ring-2 ring-stone-800 ring-offset-2' : ''}`}>
            <img 
                src={entry.imageUrl} 
                alt={entry.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-in-out pointer-events-none"
                loading="lazy"
            />
            <div className="absolute bottom-2 right-2 z-10">
                <div className="bg-white/80 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-semibold text-stone-700 shadow-sm">
                    <Star size={8} className="fill-amber-400 text-amber-400" />
                    <span>{entry.rating.toFixed(1)}</span>
                </div>
            </div>
            </div>

            <div className="mt-3 px-1">
            <h3 className="serif text-sm font-semibold text-stone-800 tracking-wide line-clamp-1 mb-1">
                {entry.title}
            </h3>
            <div className="flex items-center text-stone-400 text-[10px] tracking-wide mb-1.5 gap-1">
                <MapPin size={10} />
                <span className="line-clamp-1">{entry.location}</span>
            </div>
            <div className="flex gap-1 flex-wrap">
                {entry.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[9px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md">{tag}</span>
                ))}
            </div>
            </div>
        </div>
      </div>
    );
  }

  // List Layout
  return (
    <div
      className={`w-full mb-1 group cursor-pointer select-none relative flex gap-4 p-2.5 bg-white rounded-3xl shadow-sm border border-stone-100 items-center ${isSelected ? 'ring-1 ring-stone-800' : ''}`}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onPointerCancel={endPress}
      onClick={onClick}
      onContextMenu={(e) => e.preventDefault()}
    >
        {isSelectionMode && (
           <div className={`absolute -top-1 -right-1 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border shadow-sm ${isSelected ? 'bg-stone-800 border-stone-800' : 'bg-white border-stone-200'}`}>
              <Check size={12} className={isSelected ? "text-white" : "text-transparent"} strokeWidth={3} />
           </div>
        )}

        {/* Thumbnail */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-stone-100">
             <img 
                src={entry.imageUrl} 
                alt={entry.title}
                className="w-full h-full object-cover"
                loading="lazy"
            />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
            <div className="flex justify-between items-start mb-1">
                <h3 className="serif text-sm font-semibold text-stone-800 tracking-wide line-clamp-1">
                    {entry.title}
                </h3>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-stone-700 bg-stone-50 px-1.5 py-0.5 rounded-md">
                    <Star size={8} className="fill-amber-400 text-amber-400" />
                    <span>{entry.rating.toFixed(1)}</span>
                </div>
            </div>
            
            <p className="text-[10px] text-stone-400 line-clamp-2 mb-2 leading-relaxed">
                {entry.description}
            </p>

            <div className="flex items-center justify-between">
                <div className="flex items-center text-stone-400 text-[10px] gap-1">
                    <MapPin size={10} />
                    <span className="line-clamp-1 max-w-[80px]">{entry.location}</span>
                </div>
                <div className="flex gap-1">
                    {entry.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[9px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md">{tag}</span>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
});
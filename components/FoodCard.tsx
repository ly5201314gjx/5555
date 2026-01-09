import React, { memo, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Check, Images } from 'lucide-react';
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

  const startPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (onLongPress) {
        onLongPress();
      }
    }, 300); // Reduced to 300ms for snappier selection response
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Determine which image to show
  const displayImage = entry.images && entry.images.length > 0 
    ? entry.images[entry.coverImageIndex || 0] 
    : (entry as any).imageUrl; // Fallback for old data

  const hasMultipleImages = entry.images && entry.images.length > 1;

  // Animation config for tap
  const tapAnimation = { 
      scale: 0.95,
      transition: { type: "spring", stiffness: 400, damping: 17 }
  };

  // Grid Layout
  if (layoutMode === 'grid') {
    return (
      <motion.div
        className="w-full mb-1 group break-inside-avoid cursor-pointer select-none relative h-full"
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        whileTap={isSelectionMode ? undefined : tapAnimation}
      >
        <div className="relative h-full flex flex-col">
            {isSelectionMode && (
                <div className={`absolute top-3 left-3 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-md shadow-sm ${isSelected ? 'bg-stone-800 border-stone-800' : 'bg-white/60 border-white text-transparent'}`}>
                    <Check size={12} className={isSelected ? "text-white" : ""} strokeWidth={3} />
                </div>
            )}

            {/* Enforce strict aspect ratio [3/4] for grid alignment */}
            <div className={`relative overflow-hidden rounded-[1.5rem] shadow-sm shadow-stone-200 transition-all duration-300 ease-out bg-stone-100 w-full aspect-[3/4] ${isSelected ? 'ring-2 ring-stone-800 ring-offset-2' : ''}`}>
                <img 
                    src={displayImage} 
                    alt={entry.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-in-out pointer-events-none"
                    loading="lazy"
                />
                
                {/* Rating Badge */}
                <div className="absolute bottom-2 right-2 z-10">
                    <div className="bg-white/80 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-semibold text-stone-700 shadow-sm">
                        <Star size={8} className="fill-amber-400 text-amber-400" />
                        <span>{entry.rating.toFixed(1)}</span>
                    </div>
                </div>

                {/* Multiple Images Indicator */}
                {hasMultipleImages && (
                    <div className="absolute top-2 right-2 z-10">
                        <div className="bg-black/30 backdrop-blur-sm px-1.5 py-1 rounded-md flex items-center gap-1 text-white">
                             <Images size={10} />
                             <span className="text-[9px] font-medium">{entry.images.length}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-3 px-1 flex-1">
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
      </motion.div>
    );
  }

  // List Layout
  return (
    <motion.div
      className={`w-full mb-1 group cursor-pointer select-none relative flex gap-4 p-2.5 bg-white rounded-3xl shadow-sm border border-stone-100 items-center ${isSelected ? 'ring-1 ring-stone-800' : ''}`}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onPointerCancel={endPress}
      onClick={onClick}
      onContextMenu={(e) => e.preventDefault()}
      whileTap={isSelectionMode ? undefined : tapAnimation}
    >
        {isSelectionMode && (
           <div className={`absolute -top-1 -right-1 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border shadow-sm ${isSelected ? 'bg-stone-800 border-stone-800' : 'bg-white border-stone-200'}`}>
              <Check size={12} className={isSelected ? "text-white" : "text-transparent"} strokeWidth={3} />
           </div>
        )}

        {/* Thumbnail */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-stone-100">
             <img 
                src={displayImage} 
                alt={entry.title}
                className="w-full h-full object-cover"
                loading="lazy"
            />
            {hasMultipleImages && (
                 <div className="absolute top-1 right-1 bg-black/40 backdrop-blur-[1px] p-1 rounded-md">
                     <Images size={10} className="text-white" />
                 </div>
            )}
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
    </motion.div>
  );
});
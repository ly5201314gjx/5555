import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Edit3, Calendar, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Download, X, Maximize2 } from 'lucide-react';
import { FoodEntry } from '../types';
import { MiniCapsule } from '../components/MiniCapsule';

interface DetailViewProps {
  entry: FoodEntry;
  onBack: () => void;
  onEdit: () => void;
}

const WeatherIconMap: Record<number, React.ElementType> = {
    0: Sun,
    1: Cloud,
    61: CloudRain,
    71: CloudSnow,
    95: CloudLightning,
    3: Wind
};

export const DetailView: React.FC<DetailViewProps> = ({ entry, onBack, onEdit }) => {
  const [viewImage, setViewImage] = useState<string | null>(null);
  
  const WeatherIcon = entry.weather ? (WeatherIconMap[entry.weather.code] || Sun) : null;
  
  const images = entry.images && entry.images.length > 0 ? entry.images : [(entry as any).imageUrl];
  const coverImage = images[entry.coverImageIndex || 0] || images[0];
  const otherImages = images.filter((_, idx) => idx !== (entry.coverImageIndex || 0));

  const handleDownload = (e: React.MouseEvent, url: string) => {
      e.stopPropagation();
      const link = document.createElement('a');
      link.href = url;
      link.download = `gourmet-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <>
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full bg-[#FAFAF9] overflow-y-auto no-scrollbar relative"
    >
      {/* Top Navigation Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 pt-safe-top">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-stone-800 hover:bg-white/50 transition-colors border border-white/20"
          >
              <ArrowLeft size={18} />
          </button>

          <button 
            onClick={onEdit}
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-stone-800 hover:bg-white/50 transition-colors border border-white/20"
          >
              <Edit3 size={16} />
          </button>
      </div>

      {/* Hero Image (Cover) - Clickable */}
      <div 
        className="relative w-full h-[55vh] cursor-zoom-in group"
        onClick={() => setViewImage(coverImage)}
      >
          <img 
            src={coverImage} 
            alt={entry.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAF9] via-transparent to-black/5" />
          
          <div className="absolute bottom-16 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-black/30 backdrop-blur-md p-2 rounded-full text-white">
                  <Maximize2 size={16} />
              </div>
          </div>
      </div>

      {/* Content Body - Floating Sheet */}
      <div className="relative -mt-12 px-5 pb-20">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
            
            {/* Header: Title & Rating */}
            <div className="flex justify-between items-start mb-4">
                <h1 className="serif text-xl text-stone-900 font-semibold tracking-wide w-3/4 leading-tight">{entry.title}</h1>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                        <span className="serif text-2xl text-amber-500 font-medium">{entry.rating.toFixed(1)}</span>
                    </div>
                </div>
            </div>

            {/* Compact Metadata Chips */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                 {/* Date */}
                 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200/50 text-[10px] text-stone-500 font-medium">
                     <Calendar size={10} />
                     <span>{entry.date}</span>
                 </div>
                 
                 {/* Location */}
                 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200/50 text-[10px] text-stone-500 font-medium max-w-[120px]">
                     <MapPin size={10} />
                     <span className="truncate">{entry.location}</span>
                 </div>

                 {/* Weather */}
                 {entry.weather && WeatherIcon && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50/50 border border-blue-100 text-[10px] text-stone-600 font-medium">
                         <WeatherIcon size={10} className="text-stone-400" />
                         <span>{entry.weather.temperature}°</span>
                    </div>
                 )}
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-stone-100 mb-6" />

            {/* Description Text */}
            <div className="relative mb-8">
                <p className="text-stone-600 leading-7 text-[13px] tracking-wide text-justify font-light">
                    {entry.description}
                </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
                {entry.tags.map(tag => (
                    <MiniCapsule key={tag} label={tag} variant="outline" className="!text-[10px] !py-1 !px-3" />
                ))}
            </div>

            {/* Additional Images Gallery (Small Grid) */}
            {otherImages.length > 0 && (
                <div className="mb-2">
                    <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 pl-1">图集</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {otherImages.map((img, idx) => (
                            <div 
                                key={idx} 
                                className="rounded-xl overflow-hidden aspect-square cursor-pointer shadow-sm hover:opacity-90 transition-opacity"
                                onClick={() => setViewImage(img)}
                            >
                                <img src={img} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

          </div>
          
          <div className="mt-8 flex justify-center opacity-20">
              <div className="w-12 h-1 rounded-full bg-stone-400" />
          </div>
      </div>
    </motion.div>

    {/* Full Screen Lightbox Overlay */}
    <AnimatePresence>
        {viewImage && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center backdrop-blur-sm"
                onClick={() => setViewImage(null)}
            >
                {/* Close Button */}
                <button 
                    onClick={() => setViewImage(null)}
                    className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white/80 hover:bg-white/20 transition-colors z-50 pt-safe-top"
                >
                    <X size={20} />
                </button>

                {/* Main Image */}
                <motion.img 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    src={viewImage} 
                    className="max-w-full max-h-[85vh] object-contain shadow-2xl"
                    onClick={(e) => e.stopPropagation()} 
                />

                {/* Download Button */}
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={(e) => handleDownload(e, viewImage)}
                    className="absolute bottom-10 flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium tracking-wider transition-all"
                >
                    <Download size={14} />
                    <span>保存原图</span>
                </motion.button>
            </motion.div>
        )}
    </AnimatePresence>
    </>
  );
};
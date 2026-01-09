import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Edit3, Calendar, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react';
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
  const WeatherIcon = entry.weather ? (WeatherIconMap[entry.weather.code] || Sun) : null;

  return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full bg-[#FAFAF9] overflow-y-auto no-scrollbar relative"
    >
      {/* Top Navigation Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-stone-800 hover:bg-white/50 transition-colors"
          >
              <ArrowLeft size={20} />
          </button>

          <button 
            onClick={onEdit}
            className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-stone-800 hover:bg-white/50 transition-colors"
          >
              <Edit3 size={18} />
          </button>
      </div>

      {/* Hero Image */}
      <div className="relative w-full h-[55vh]">
          <img 
            src={entry.imageUrl} 
            alt={entry.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAF9] via-transparent to-black/10" />
      </div>

      {/* Content Body - Overlapping the image */}
      <div className="relative -mt-12 px-6 pb-20">
          <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 shadow-sm">
            
            {/* Header Info */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="serif text-2xl text-stone-800 font-medium mb-2">{entry.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-stone-400 text-xs tracking-wider">
                         <div className="flex items-center gap-1">
                             <Calendar size={12} />
                             <span>{entry.date}</span>
                         </div>
                         <div className="flex items-center gap-1">
                             <MapPin size={12} />
                             <span>{entry.location}</span>
                         </div>
                         {entry.weather && WeatherIcon && (
                             <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/50 border border-stone-200/50">
                                 <WeatherIcon size={12} className="text-stone-500" />
                                 <span>{entry.weather.temperature}°</span>
                             </div>
                         )}
                    </div>
                </div>
                <div className="flex flex-col items-center">
                     <span className="serif text-3xl text-amber-500 font-light">{entry.rating.toFixed(1)}</span>
                     <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <div key={star} className={`w-1 h-1 rounded-full ${star <= Math.round(entry.rating) ? 'bg-amber-400' : 'bg-stone-200'}`} />
                        ))}
                     </div>
                </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
                {entry.tags.map(tag => (
                    <MiniCapsule key={tag} label={tag} variant="blur" />
                ))}
            </div>

            {/* Description Text */}
            <div className="relative">
                <span className="absolute -left-2 -top-4 serif text-6xl text-stone-200 opacity-50 select-none">“</span>
                <p className="text-stone-600 leading-loose text-sm tracking-wide text-justify font-light">
                    {entry.description}
                </p>
            </div>

          </div>
          
          <div className="mt-8 flex justify-center opacity-30">
              <div className="w-16 h-1 rounded-full bg-stone-300" />
          </div>
      </div>
    </motion.div>
  );
};
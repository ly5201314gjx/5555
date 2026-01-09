import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Search, X, Loader2, Building2, Pencil, Map } from 'lucide-react';

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Debounced search for China-optimized results
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 1) {
        setIsSearching(true);
        try {
            // Use OSM Nominatim which is free and works in China
            // Limit to China region preference if possible, but general search works fine
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&addressdetails=1&limit=5&accept-language=zh-CN`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
      } else {
          setSearchResults([]);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
        alert("您的浏览器不支持地理定位");
        setIsLocating(false);
        return;
    }

    const success = async (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        
        try {
            // Reverse geocode with zh-CN preference
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=zh-CN`);
            const data = await response.json();
            
            const addr = data.address;
            
            // Priority: Specific Point -> Street -> District
            const placeName = addr.amenity || addr.shop || addr.building || addr.tourism || addr.road || "我的位置";
            const district = addr.district || addr.city || "";
            
            // Format: District · Place (e.g., 朝阳区 · 三里屯)
            const formatted = district ? `${district} · ${placeName}` : placeName;
            
            setSearchTerm(formatted);
            setSearchResults([{
                display_name: formatted,
                isCurrent: true,
                lat: latitude,
                lon: longitude,
                address: addr
            }]);
        } catch (e) {
            console.error("Geocoding failed", e);
            // Fallback
            const simpleLoc = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setSearchTerm(simpleLoc);
        } finally {
            setIsLocating(false);
        }
    };

    const error = (err: GeolocationPositionError) => {
        console.error(err);
        setIsLocating(false);
        alert("定位失败。请检查系统定位开关或浏览器权限。");
    };

    navigator.geolocation.getCurrentPosition(success, error, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
  };

  const confirmLocation = (loc: string, lat?: string, lng?: string) => {
      // Clean up location string if it's too long (common with OSM results)
      let cleanLoc = loc;
      
      // If user selected a search result that isn't already formatted by us
      if (loc.includes(',') && !loc.includes('·')) {
          const parts = loc.split(',');
          // Just take the first part (usually the specific place name)
          cleanLoc = parts[0].trim();
      }
      
      onChange(cleanLoc);
      if (lat && lng) {
          setCoords({ lat: parseFloat(lat), lng: parseFloat(lng) });
      }
      setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Input */}
      <div className="relative group" onClick={() => setIsOpen(true)}>
        <input 
            type="text" 
            value={value}
            readOnly
            placeholder="点击定位或输入地点..." 
            className="w-full bg-white/50 backdrop-blur-md border border-stone-200/50 rounded-2xl pl-11 pr-5 py-3 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:bg-white/80 focus:border-stone-300 focus:shadow-sm transition-all duration-300 cursor-pointer"
        />
        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-hover:text-stone-600 transition-colors" />
      </div>

      {/* Full Screen Map Picker Modal */}
      <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-50 flex flex-col bg-[#FAFAF9]">
                {/* Header */}
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-md border-b border-stone-200/50 z-10 pt-safe-top"
                >
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors"
                    >
                        <X size={24} className="text-stone-500" />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            autoFocus
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="搜索地点..."
                            className="w-full bg-stone-100 rounded-full pl-10 pr-10 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                        />
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        {isSearching && <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 animate-spin" />}
                    </div>
                </motion.div>

                {/* Main Content: Map + List */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 relative overflow-hidden flex flex-col"
                >
                    {/* Pseudo-Source Map (OpenStreetMap Iframe) */}
                    <div className="h-[40vh] w-full bg-stone-200 relative">
                        {coords ? (
                            <iframe
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                marginHeight={0}
                                marginWidth={0}
                                // Simple OSM Embed
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.005}%2C${coords.lat - 0.005}%2C${coords.lng + 0.005}%2C${coords.lat + 0.005}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`}
                                className="opacity-90 grayscale-[20%]"
                            ></iframe>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-stone-400 bg-stone-100">
                                <div className="flex flex-col items-center gap-2">
                                    <Map size={32} className="opacity-30" />
                                    <span className="text-xs tracking-widest uppercase">点击下方定位获取地图</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Locate Button */}
                        <button
                            onClick={handleGetCurrentLocation}
                            className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg text-stone-700 hover:text-stone-900 active:scale-95 transition-all z-20 flex items-center gap-2"
                        >
                            {isLocating ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} className="fill-current text-blue-500" />}
                            <span className="text-xs font-medium">{isLocating ? '定位中...' : '定位'}</span>
                        </button>
                    </div>

                    {/* Result List */}
                    <div className="flex-1 bg-white rounded-t-[2rem] -mt-6 relative z-10 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] px-6 py-6 overflow-y-auto">
                        <div className="w-12 h-1 bg-stone-200 rounded-full mx-auto mb-6" />
                        
                        <div className="space-y-2 pb-10">
                             {/* Manual Entry Option */}
                             {searchTerm.trim().length > 0 && (
                                <button 
                                    onClick={() => confirmLocation(searchTerm)}
                                    className="w-full text-left p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 transition-colors flex items-center gap-3 border border-amber-100 shadow-sm mb-4"
                                >
                                    <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-amber-100 text-amber-600">
                                        <Pencil size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-stone-800 line-clamp-1">
                                            使用 "{searchTerm}"
                                        </div>
                                    </div>
                                </button>
                             )}

                             {/* Results from API */}
                             {searchResults.map((result, i) => (
                                <button 
                                    key={i}
                                    onClick={() => confirmLocation(result.display_name, result.lat, result.lon)}
                                    className="w-full text-left p-4 rounded-2xl hover:bg-stone-50 transition-colors flex items-center gap-3 border-b border-stone-50 last:border-0"
                                >
                                    <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${result.isCurrent ? 'bg-blue-50 text-blue-500' : 'bg-stone-100 text-stone-500'}`}>
                                        {result.isCurrent ? <Navigation size={18} className="fill-current" /> : <Building2 size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-stone-800 line-clamp-1">
                                            {result.display_name.split(',')[0]}
                                        </div>
                                        <div className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                                            {result.display_name}
                                        </div>
                                    </div>
                                </button>
                             ))}

                             {/* Default Empty State */}
                             {searchResults.length === 0 && searchTerm.length === 0 && !isSearching && (
                                 <div className="text-center py-10 text-stone-300">
                                     <p className="text-xs tracking-widest mb-2">国内地图源 · 免Key定位</p>
                                     <p className="text-[10px] text-stone-200">支持商铺、地标、街道搜索</p>
                                 </div>
                             )}
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </>
  );
};
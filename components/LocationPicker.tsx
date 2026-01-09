import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Search, X, Loader2, Building2, Pencil, Map } from 'lucide-react';

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
}

// AMap Types (Simplified for TS)
declare global {
  interface Window {
    AMap: any;
  }
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placeSearchRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  // Initialize AMap when modal opens
  useEffect(() => {
    if (isOpen && !mapInstanceRef.current && window.AMap) {
        // Delay slightly to ensure DOM is ready
        setTimeout(() => {
            if (mapContainerRef.current) {
                mapInstanceRef.current = new window.AMap.Map(mapContainerRef.current, {
                    zoom: 15,
                    resizeEnable: true,
                    mapStyle: "amap://styles/whitesmoke" // Clean style
                });

                // Init Plugins
                window.AMap.plugin(['AMap.PlaceSearch', 'AMap.Geolocation', 'AMap.Geocoder', 'AMap.AutoComplete'], function(){
                    placeSearchRef.current = new window.AMap.PlaceSearch({
                        pageSize: 5,
                        pageIndex: 1,
                        extensions: 'all'
                    });
                    
                    geocoderRef.current = new window.AMap.Geocoder({
                        city: "010", 
                        radius: 1000 
                    });
                });

                // Click map to pick location
                mapInstanceRef.current.on('click', (e: any) => {
                    const { lng, lat } = e.lnglat;
                    updateMarker(lng, lat);
                    // Reverse Geocode
                    if(geocoderRef.current) {
                        geocoderRef.current.getAddress([lng, lat], function(status: string, result: any) {
                            if (status === 'complete' && result.regeocode) {
                                const address = result.regeocode.formattedAddress;
                                // Try to get a POI
                                const pois = result.regeocode.pois;
                                let name = address;
                                if(pois && pois.length > 0) {
                                    name = pois[0].name;
                                }
                                setSearchTerm(name);
                            }
                        });
                    }
                });
            }
        }, 100);
    }
  }, [isOpen]);

  const updateMarker = (lng: number, lat: number) => {
      if(!mapInstanceRef.current || !window.AMap) return;
      
      if(markerRef.current) {
          markerRef.current.setPosition([lng, lat]);
      } else {
          markerRef.current = new window.AMap.Marker({
              position: new window.AMap.LngLat(lng, lat),
              anchor: 'bottom-center'
          });
          mapInstanceRef.current.add(markerRef.current);
      }
      mapInstanceRef.current.setCenter([lng, lat]);
  };

  // Search
  useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
          if (searchTerm.length > 0 && placeSearchRef.current) {
               placeSearchRef.current.search(searchTerm, (status: string, result: any) => {
                   if(status === 'complete' && result.info === 'OK') {
                       setSearchResults(result.poiList.pois);
                   } else {
                       setSearchResults([]);
                   }
               });
          } else {
              setSearchResults([]);
          }
      }, 500);
      return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if (!window.AMap) {
        alert("地图加载中，请稍候...");
        setIsLocating(false);
        return;
    }

    const geolocation = new window.AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
    });

    geolocation.getCurrentPosition((status: string, result: any) => {
        setIsLocating(false);
        if(status === 'complete'){
            const { lng, lat } = result.position;
            updateMarker(lng, lat);
            // Format address
            // result.formattedAddress, result.addressComponent
            const name = result.formattedAddress || "我的位置";
            // Make it shorter: District + POI
            let shortName = name;
            if(result.addressComponent) {
                const { district, township, street } = result.addressComponent;
                shortName = (district || "") + " · " + (street || township || "当前位置");
            }
            setSearchTerm(shortName);
        } else {
            console.error(result);
            alert("定位失败");
        }
    });
  };

  const confirmLocation = (name: string, location?: any) => {
      onChange(name);
      if(location && mapInstanceRef.current) {
          updateMarker(location.lng, location.lat);
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
                    </div>
                </motion.div>

                {/* Main Content: Map + List */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 relative overflow-hidden flex flex-col"
                >
                    {/* AMap Container */}
                    <div className="h-[40vh] w-full bg-stone-200 relative">
                        <div ref={mapContainerRef} className="w-full h-full" />
                        
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
                                    onClick={() => confirmLocation(result.name, result.location)}
                                    className="w-full text-left p-4 rounded-2xl hover:bg-stone-50 transition-colors flex items-center gap-3 border-b border-stone-50 last:border-0"
                                >
                                    <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-stone-100 text-stone-500`}>
                                        <Building2 size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-stone-800 line-clamp-1">
                                            {result.name}
                                        </div>
                                        <div className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                                            {result.address || result.type}
                                        </div>
                                    </div>
                                </button>
                             ))}

                             {/* Default Empty State */}
                             {searchResults.length === 0 && searchTerm.length === 0 && (
                                 <div className="text-center py-10 text-stone-300">
                                     <p className="text-xs tracking-widest mb-2">高德地图 · 精准搜索</p>
                                     <p className="text-[10px] text-stone-200">输入关键词或点击地图选点</p>
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
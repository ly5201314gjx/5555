import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Loader2, Thermometer, ChevronDown, MapPin, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeatherInfo } from '../types';

interface WeatherWidgetProps {
  value?: WeatherInfo;
  onChange: (weather: WeatherInfo) => void;
}

const WEATHER_TYPES = [
  { code: 0, label: '晴朗', icon: Sun, color: 'text-amber-500' },
  { code: 1, label: '多云', icon: Cloud, color: 'text-stone-500' },
  { code: 61, label: '下雨', icon: CloudRain, color: 'text-blue-500' },
  { code: 71, label: '下雪', icon: CloudSnow, color: 'text-cyan-500' },
  { code: 95, label: '雷雨', icon: CloudLightning, color: 'text-purple-500' },
  { code: 3, label: '阴天', icon: Wind, color: 'text-stone-400' },
];

const CACHE_KEY = 'gourmet_weather_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  // Auto-load cache on mount if no value is present
  useEffect(() => {
    if (!value) {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    onChange(data);
                }
            }
        } catch (e) {
            console.warn("Weather cache read failed", e);
        }
    }
  }, []);

  const fetchWeather = (forceRefresh = false) => {
    setLoading(true);
    if (!navigator.geolocation) {
      alert("您的设备不支持定位");
      setLoading(false);
      return;
    }

    // Check cache first if not forcing
    if (!forceRefresh) {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    onChange(data);
                    setLoading(false);
                    return;
                }
            }
        } catch (e) {
            // ignore
        }
    }

    const success = async (position: GeolocationPosition) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // 1. Get Location Name (Optimized for Chinese Addresses)
          let locationName = '本地';
          try {
             // Use Nominatim (OSM) for reverse geocoding
             const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1&accept-language=zh-CN`);
             const geoData = await geoRes.json();
             
             const addr = geoData.address;
             // Priority: District (Qu) -> Suburb -> County -> City (Shi) -> Town
             // This logic ensures we get "Chaoyang District" instead of just "Beijing" if possible
             const region = addr.district || addr.suburb || addr.county;
             const city = addr.city || addr.state;
             
             if (region) {
                 locationName = region;
             } else if (city) {
                 locationName = city;
             } else {
                 locationName = addr.town || addr.village || '未知地区';
             }
          } catch(e) {
              console.warn("Location fetch failed, using fallback");
          }

          // 2. Get Weather (Open-Meteo)
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
          );
          const data = await res.json();
          const { temperature, weathercode } = data.current_weather;
          
          let mappedCode = 0;
          if (weathercode === 0) mappedCode = 0;
          else if (weathercode >= 1 && weathercode <= 3) mappedCode = 1;
          else if (weathercode >= 45 && weathercode <= 48) mappedCode = 3;
          else if (weathercode >= 51 && weathercode <= 67) mappedCode = 61;
          else if (weathercode >= 71 && weathercode <= 86) mappedCode = 71;
          else if (weathercode >= 95) mappedCode = 95;
          else mappedCode = 1;

          const type = WEATHER_TYPES.find(t => t.code === mappedCode) || WEATHER_TYPES[0];

          const newWeather = {
            temperature: Math.round(temperature),
            code: mappedCode,
            condition: type.label,
            locationName
          };

          // Save to Cache
          localStorage.setItem(CACHE_KEY, JSON.stringify({
              timestamp: Date.now(),
              data: newWeather
          }));

          onChange(newWeather);
        } catch (error) {
          console.error("Weather fetch failed", error);
          alert("获取天气失败，请检查网络");
        } finally {
          setLoading(false);
        }
    };

    const error = (err: GeolocationPositionError) => {
        setLoading(false);
        console.error(err);
        alert("无法定位，请确保浏览器已授权位置权限");
    };

    navigator.geolocation.getCurrentPosition(success, error, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
    });
  };

  const handleManualSelect = (type: typeof WEATHER_TYPES[0]) => {
    onChange({
      temperature: value?.temperature || 24,
      code: type.code,
      condition: type.label,
      locationName: value?.locationName || '手动'
    });
    setShowSelector(false);
  };

  const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const temp = parseInt(e.target.value);
      if (!isNaN(temp) && value) {
          onChange({ ...value, temperature: temp });
      }
  };

  const currentType = value ? WEATHER_TYPES.find(t => t.code === value.code) || WEATHER_TYPES[0] : null;
  const CurrentIcon = currentType?.icon || Sun;

  return (
    <div className="relative z-10 w-full">
        <div className="flex gap-2">
            {!value ? (
                <button
                    onClick={() => fetchWeather(false)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/50 backdrop-blur-md border border-stone-200/50 rounded-2xl text-stone-500 text-xs font-medium hover:bg-white/80 transition-all"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Sun size={16} />}
                    <span>{loading ? '定位中...' : '一键获取天气'}</span>
                </button>
            ) : (
                <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md border border-stone-200/50 rounded-2xl p-1.5 pr-4 shadow-sm w-full max-w-[200px]">
                    {/* Icon Selector Trigger */}
                    <button 
                        onClick={() => setShowSelector(!showSelector)}
                        className={`flex-shrink-0 w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm ${currentType?.color} hover:scale-105 transition-transform`}
                    >
                        <CurrentIcon size={18} />
                    </button>

                    {/* Location Name Display */}
                    <div className="flex-1 flex flex-col justify-center min-w-0 px-1 border-r border-stone-200">
                        <span className="text-[10px] text-stone-400 line-clamp-1">{value.locationName || '未知'}</span>
                        <span className="text-[10px] text-stone-600 font-medium">{currentType?.label}</span>
                    </div>

                    {/* Temperature Input */}
                    <div className="flex items-center pl-2">
                        <input 
                            type="number" 
                            value={value.temperature}
                            onChange={handleTempChange}
                            className="w-10 bg-transparent text-sm font-semibold text-stone-700 text-right focus:outline-none border-b border-transparent hover:border-stone-200 focus:border-stone-400 transition-colors"
                        />
                        <span className="text-xs text-stone-400 ml-0.5">°C</span>
                    </div>

                    <button 
                        onClick={() => fetchWeather(true)} 
                        className="ml-1 p-1.5 text-stone-300 hover:text-stone-500 hover:bg-stone-200/50 rounded-full transition-colors"
                        title="刷新天气"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
                    </button>
                </div>
            )}
            
            {!value && (
                <button
                    onClick={() => {
                        onChange({ temperature: 24, code: 0, condition: '晴朗', locationName: '手动' });
                        setShowSelector(true);
                    }}
                    className="px-4 py-2.5 bg-white/30 border border-stone-100/50 rounded-2xl text-stone-400 text-xs hover:bg-white/50 transition-all"
                >
                    手动添加
                </button>
            )}
        </div>

        {/* Dropdown Selector */}
        <AnimatePresence>
            {showSelector && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 p-2 bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl rounded-2xl grid grid-cols-3 gap-2 w-max z-50"
                >
                    {WEATHER_TYPES.map(type => (
                        <button
                            key={type.code}
                            onClick={() => handleManualSelect(type)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors hover:bg-stone-100 ${value?.code === type.code ? 'bg-stone-50 ring-1 ring-stone-200' : ''}`}
                        >
                            <type.icon size={20} className={type.color} />
                            <span className="text-[10px] text-stone-600">{type.label}</span>
                        </button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};
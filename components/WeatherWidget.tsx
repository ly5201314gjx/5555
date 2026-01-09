import React, { useState } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Loader2, Thermometer, ChevronDown, MapPin } from 'lucide-react';
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

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  const fetchWeather = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      alert("您的设备不支持定位");
      setLoading(false);
      return;
    }

    const success = async (position: GeolocationPosition) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // 1. Get Location Name using pure browser Geolocation reverse lookup (via Nominatim for detailed Chinese name)
          // This is a free, open source way to get location names in China without keys.
          let locationName = '本地';
          try {
             // Use Nominatim (OSM) for reverse geocoding with strict Chinese language preference
             const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1&accept-language=zh-CN`);
             const geoData = await geoRes.json();
             
             // Smart name extraction for China: District -> City -> Province
             const addr = geoData.address;
             locationName = addr.district || addr.county || addr.city || addr.town || addr.village || addr.state || '未知';
          } catch(e) {
              console.warn("Location name fetch failed, defaulting to '本地'");
          }

          // 2. Get Weather using Open-Meteo
          // Open-Meteo works well globally including China, requires no API key, and is very fast.
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
          );
          const data = await res.json();
          const { temperature, weathercode } = data.current_weather;
          
          // Map WMO codes to our simplified types
          let mappedCode = 0;
          if (weathercode === 0) mappedCode = 0; // Clear
          else if (weathercode >= 1 && weathercode <= 3) mappedCode = 1; // Cloudy
          else if (weathercode >= 45 && weathercode <= 48) mappedCode = 3; // Fog/Overcast
          else if (weathercode >= 51 && weathercode <= 67) mappedCode = 61; // Rain
          else if (weathercode >= 71 && weathercode <= 86) mappedCode = 71; // Snow
          else if (weathercode >= 95) mappedCode = 95; // Thunderstorm
          else mappedCode = 1;

          const type = WEATHER_TYPES.find(t => t.code === mappedCode) || WEATHER_TYPES[0];

          onChange({
            temperature: Math.round(temperature),
            code: mappedCode,
            condition: type.label,
            locationName
          });
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

    // Use high accuracy to ensure we get a good fix for the city name
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
                    onClick={fetchWeather}
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

                    {/* Temperature Input - Improved width */}
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
                        onClick={fetchWeather} 
                        className="ml-1 p-1.5 text-stone-300 hover:text-stone-500 hover:bg-stone-200/50 rounded-full transition-colors"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
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
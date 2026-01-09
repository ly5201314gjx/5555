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

// Helper to map AMap weather string to our code
const mapAMapWeatherToCode = (weather: string): number => {
    if(weather.includes('晴')) return 0;
    if(weather.includes('多云')) return 1;
    if(weather.includes('阴')) return 3;
    if(weather.includes('雨') && weather.includes('雷')) return 95;
    if(weather.includes('雨')) return 61;
    if(weather.includes('雪')) return 71;
    return 1; // Default
};

const CACHE_KEY = 'gourmet_weather_cache_amap';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  // Auto-load cache
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
    
    // Check cache
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
        } catch (e) { }
    }

    if (!window.AMap) {
        alert("地图服务初始化中，请稍后再试");
        setLoading(false);
        return;
    }

    window.AMap.plugin('AMap.Weather', function() {
        // Create Weather Instance
        const weather = new window.AMap.Weather();
        
        // Use Adcode or City. 
        // We first need to know where we are. Using AMap.Geolocation first.
        window.AMap.plugin('AMap.Geolocation', function() {
            const geolocation = new window.AMap.Geolocation({
                enableHighAccuracy: true,
                timeout: 5000,
            });

            geolocation.getCurrentPosition(function(status: string, result: any){
                if(status === 'complete'){
                    // Get Adcode (District code) for accurate weather
                    const adcode = result.addressComponent.adcode;
                    const district = result.addressComponent.district;

                    weather.getLive(adcode, function(err: any, data: any) {
                        setLoading(false);
                        if (!err) {
                            const code = mapAMapWeatherToCode(data.weather);
                            const newWeather = {
                                temperature: parseInt(data.temperature),
                                code: code,
                                condition: data.weather,
                                locationName: district || data.city
                            };

                            localStorage.setItem(CACHE_KEY, JSON.stringify({
                                timestamp: Date.now(),
                                data: newWeather
                            }));
                            
                            onChange(newWeather);
                        } else {
                            console.error(err);
                            alert("天气查询失败");
                        }
                    });
                } else {
                    setLoading(false);
                    alert("定位失败，无法获取天气");
                }
            });
        });
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
                        <span className="text-[10px] text-stone-600 font-medium">{currentType?.label || value.condition}</span>
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
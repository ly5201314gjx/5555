import React, { useState } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Loader2, Thermometer, ChevronDown } from 'lucide-react';
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
      alert("不支持地理定位");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const data = await res.json();
          const { temperature, weathercode } = data.current_weather;
          
          // Map WMO code to our simple types
          let mappedCode = 0;
          if (weathercode >= 1 && weathercode <= 3) mappedCode = 1;
          else if (weathercode >= 45 && weathercode <= 48) mappedCode = 3;
          else if (weathercode >= 51 && weathercode <= 67) mappedCode = 61;
          else if (weathercode >= 71 && weathercode <= 86) mappedCode = 71;
          else if (weathercode >= 95) mappedCode = 95;

          const type = WEATHER_TYPES.find(t => t.code === mappedCode) || WEATHER_TYPES[0];

          onChange({
            temperature: Math.round(temperature),
            code: mappedCode,
            condition: type.label
          });
        } catch (error) {
          console.error("Weather fetch failed", error);
          alert("获取天气失败，请手动选择");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setLoading(false);
        alert("无法获取位置");
      }
    );
  };

  const handleManualSelect = (type: typeof WEATHER_TYPES[0]) => {
    onChange({
      temperature: value?.temperature || 24,
      code: type.code,
      condition: type.label
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
    <div className="relative z-10">
        <div className="flex gap-2">
            {/* Main Display / Fetch Button */}
            {!value ? (
                <button
                    onClick={fetchWeather}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/50 backdrop-blur-md border border-stone-200/50 rounded-2xl text-stone-500 text-xs font-medium hover:bg-white/80 transition-all"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Sun size={16} />}
                    <span>{loading ? '获取中...' : '添加天气'}</span>
                </button>
            ) : (
                <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md border border-stone-200/50 rounded-2xl p-1.5 pr-4 shadow-sm">
                    {/* Icon Selector Trigger */}
                    <button 
                        onClick={() => setShowSelector(!showSelector)}
                        className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm ${currentType?.color} hover:scale-105 transition-transform`}
                    >
                        <CurrentIcon size={18} />
                    </button>

                    {/* Temperature Input */}
                    <div className="flex items-center gap-1">
                        <input 
                            type="number" 
                            value={value.temperature}
                            onChange={handleTempChange}
                            className="w-8 bg-transparent text-sm font-semibold text-stone-700 text-center focus:outline-none border-b border-transparent hover:border-stone-200 focus:border-stone-400 transition-colors"
                        />
                        <span className="text-xs text-stone-400">°C</span>
                    </div>

                    <button 
                        onClick={fetchWeather} 
                        className="ml-2 p-1.5 text-stone-300 hover:text-stone-500 hover:bg-stone-200/50 rounded-full transition-colors"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Thermometer size={12} />}
                    </button>
                </div>
            )}
            
            {/* Manual Preset Button (if not already set) */}
            {!value && (
                <button
                    onClick={() => {
                        onChange({ temperature: 24, code: 0, condition: '晴朗' });
                        setShowSelector(true);
                    }}
                    className="px-4 py-2.5 bg-white/30 border border-stone-100/50 rounded-2xl text-stone-400 text-xs hover:bg-white/50 transition-all"
                >
                    手动预设
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
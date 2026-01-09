import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Tag, Plus, Save, Star, ArrowLeft } from 'lucide-react';
import { MiniCapsule } from '../components/MiniCapsule';
import { LocationPicker } from '../components/LocationPicker';
import { WeatherWidget } from '../components/WeatherWidget';
import { FoodEntry, WeatherInfo } from '../types';

interface AddEntryViewProps {
  initialEntry?: FoodEntry;
  onSave: (entry: FoodEntry) => void;
  onCancel?: () => void;
}

export const AddEntryView: React.FC<AddEntryViewProps> = ({ onSave, onCancel, initialEntry }) => {
  // State for form fields
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>(['早餐', '约会', '甜点', '健康', '微醺']);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | undefined>(undefined);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load initial data if editing
  useEffect(() => {
      if (initialEntry) {
          setTitle(initialEntry.title);
          setLocation(initialEntry.location);
          setDescription(initialEntry.description);
          setRating(initialEntry.rating);
          setImagePreview(initialEntry.imageUrl);
          setSelectedTags(initialEntry.tags);
          setWeather(initialEntry.weather);
          // Ensure tags exist in available tags
          const newTags = initialEntry.tags.filter(t => !availableTags.includes(t));
          if (newTags.length > 0) {
              setAvailableTags(prev => [...prev, ...newTags]);
          }
      }
  }, [initialEntry]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
        setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
        setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddTag = () => {
    const inputValue = window.prompt("请输入新标签名称：");
    if (!inputValue || inputValue.trim() === "") return;

    const tag = inputValue.trim();
    if (availableTags.includes(tag)) {
        if (!selectedTags.includes(tag)) setSelectedTags(prev => [...prev, tag]);
    } else {
        setAvailableTags(prev => [...prev, tag]);
        setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 800; 

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    setImagePreview(compressedDataUrl);
                }
            };
            if (event.target?.result) {
                img.src = event.target.result as string;
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  const handleSave = () => {
      if (!title) {
          alert("请输入标题");
          return;
      }
      
      const newEntry: FoodEntry = {
          id: initialEntry ? initialEntry.id : Date.now().toString(),
          title,
          location: location || '未知地点',
          date: initialEntry ? initialEntry.date : new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          imageUrl: imagePreview || `https://picsum.photos/seed/${Date.now()}/800/1000`, 
          tags: selectedTags,
          rating: rating > 0 ? rating : 0,
          description: description || '暂无描述',
          weather: weather
      };
      
      onSave(newEntry);
  };

  const inputClass = "w-full bg-white/50 backdrop-blur-md border border-stone-200/50 rounded-2xl px-5 py-3 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:bg-white/80 focus:border-stone-300 focus:shadow-sm transition-all duration-300";

  return (
    <div className="pb-40 pt-8 px-6 max-w-2xl mx-auto h-full overflow-y-auto no-scrollbar">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex justify-between items-center mb-6">
             <button onClick={onCancel} className="p-2 -ml-2 text-stone-400 hover:text-stone-800 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <h2 className="serif text-xl text-stone-800 tracking-wide font-medium">
                {initialEntry ? '编辑记录' : '记录美好'}
            </h2>
            <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Photo Upload Area */}
        <div 
            onClick={triggerFileInput}
            className="w-full aspect-video bg-white/40 backdrop-blur-sm rounded-[2rem] border border-stone-100 flex flex-col items-center justify-center mb-10 group cursor-pointer hover:bg-white/60 hover:shadow-sm transition-all duration-300 relative overflow-hidden shadow-inner shadow-stone-200/50"
        >
             <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
             />
             
             {imagePreview ? (
                <>
                    <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-stone-900/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-white/90 backdrop-blur-xl border border-white/50 px-5 py-2.5 rounded-full text-stone-800 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2">
                             <Camera size={16} strokeWidth={2.5} />
                             <span className="text-xs font-bold tracking-widest uppercase">更换图片</span>
                        </div>
                    </div>
                </>
             ) : (
                 <>
                     <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md text-stone-400 group-hover:text-stone-600 transition-colors z-10">
                        <Camera size={22} strokeWidth={1.5} />
                     </div>
                     <p className="mt-3 text-[10px] font-medium text-stone-400 tracking-widest z-10">上传影像</p>
                 </>
             )}
        </div>

        {/* Form Inputs */}
        <div className="space-y-6">
            <div className="group relative">
                <label className="block text-[10px] font-medium text-stone-400 tracking-widest uppercase mb-2 ml-4">主题</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例如：午后的焦糖拿铁" 
                    className={inputClass}
                />
            </div>

            <div className="group relative">
                <label className="block text-[10px] font-medium text-stone-400 tracking-widest uppercase mb-2 ml-4">地点</label>
                <LocationPicker 
                    value={location} 
                    onChange={setLocation} 
                />
            </div>
            
            <div className="group relative">
                <label className="block text-[10px] font-medium text-stone-400 tracking-widest uppercase mb-2 ml-4">天气</label>
                <WeatherWidget value={weather} onChange={setWeather} />
            </div>

            <div className="relative">
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2 text-stone-400">
                        <Tag size={14} strokeWidth={1.5} />
                        <span className="text-[10px] font-medium tracking-wide uppercase">选择标签</span>
                    </div>
                </div>
                {/* Optimized Tag layout with transitions */}
                <motion.div layout className="flex flex-wrap gap-2 p-4 rounded-3xl bg-white/30 border border-stone-100/50">
                    <AnimatePresence>
                        {availableTags.map(tag => (
                            <motion.div key={tag} layout>
                                <MiniCapsule 
                                    label={tag} 
                                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                                    active={selectedTags.includes(tag)}
                                    onClick={() => toggleTag(tag)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <button 
                        onClick={handleAddTag}
                        className="h-7 px-3 rounded-full border border-dashed border-stone-300 flex items-center justify-center text-stone-400 hover:border-stone-500 hover:text-stone-600 transition-all active:scale-95 bg-white/50"
                    >
                        <Plus size={12} />
                    </button>
                </motion.div>
            </div>

            <div className="group relative">
                 <label className="block text-[10px] font-medium text-stone-400 tracking-widest uppercase mb-2 ml-4">评分</label>
                 <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-1.5 bg-white/50 backdrop-blur-md border border-stone-200/50 rounded-2xl px-4 py-2.5 shadow-sm transition-all hover:bg-white/80 w-max">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="focus:outline-none transform transition-transform hover:scale-110 active:scale-90"
                            >
                                <Star
                                    size={22}
                                    className={`${star <= rating ? "fill-amber-400 text-amber-400" : "text-stone-300 fill-stone-100"}`}
                                    strokeWidth={1.5}
                                />
                            </button>
                        ))}
                    </div>
                 </div>
            </div>

             <div className="group relative">
                <label className="block text-[10px] font-medium text-stone-400 tracking-widest uppercase mb-2 ml-4">心得</label>
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="记录此时此刻的心情与风味..." 
                    rows={4}
                    className={`${inputClass} resize-none leading-relaxed`}
                />
            </div>
        </div>

        {/* Floating Action Button for Save - Positioned Higher */}
        <div className="fixed bottom-8 right-6 z-40">
            <button 
                onClick={handleSave}
                className="bg-stone-800 text-stone-50 w-14 h-14 rounded-full shadow-xl shadow-stone-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300"
            >
                <Save size={24} strokeWidth={1.5} />
            </button>
        </div>

      </motion.div>
    </div>
  );
};
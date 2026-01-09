import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Tag, Plus, Save, Star, ArrowLeft, X, Check, ImagePlus } from 'lucide-react';
import { MiniCapsule } from '../components/MiniCapsule';
import { LocationPicker } from '../components/LocationPicker';
import { WeatherWidget } from '../components/WeatherWidget';
import { FoodEntry, WeatherInfo } from '../types';

interface AddEntryViewProps {
  initialEntry?: FoodEntry;
  onSave: (entry: FoodEntry) => void;
  onCancel?: () => void;
  globalTags: string[]; // Received from App
}

export const AddEntryView: React.FC<AddEntryViewProps> = ({ onSave, onCancel, initialEntry, globalTags }) => {
  // State for form fields
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  
  // Images
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  // Tags
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [weather, setWeather] = useState<WeatherInfo | undefined>(undefined);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize Data
  useEffect(() => {
    // Merge global tags with any unique ones here if needed, 
    // but mostly rely on globalTags for the options.
    setAvailableTags(globalTags);

    if (initialEntry) {
        setTitle(initialEntry.title);
        setLocation(initialEntry.location);
        setDescription(initialEntry.description);
        setRating(initialEntry.rating);
        
        // Handle image migration
        if (initialEntry.images && initialEntry.images.length > 0) {
            setImages(initialEntry.images);
            setCoverIndex(initialEntry.coverImageIndex || 0);
        } else if ((initialEntry as any).imageUrl) {
            setImages([(initialEntry as any).imageUrl]);
            setCoverIndex(0);
        }

        setSelectedTags(initialEntry.tags);
        setWeather(initialEntry.weather);
    }
  }, [initialEntry, globalTags]);

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
    if (!availableTags.includes(tag)) {
        setAvailableTags(prev => [...prev, tag]);
    }
    if (!selectedTags.includes(tag)) {
        setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (images.length >= 99) {
        alert("最多只能上传 99 张图片");
        return;
    }

    const files = e.target.files;
    if (files && files.length > 0) {
        const remainingSlots = 99 - images.length;
        const filesToProcess = Array.from(files).slice(0, remainingSlots);

        filesToProcess.forEach((file: File) => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // Increased max size for better clarity (2.5K resolution)
                    const MAX_SIZE = 2560; 

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
                        // Increased quality to 0.95 for high fidelity
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                        setImages(prev => [...prev, compressedDataUrl]);
                    }
                };
                if (event.target?.result) {
                    img.src = event.target.result as string;
                }
            };
            reader.readAsDataURL(file);
        });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      if (coverIndex === index) {
          setCoverIndex(0);
      } else if (coverIndex > index) {
          setCoverIndex(coverIndex - 1);
      }
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
          images: images.length > 0 ? images : [`https://picsum.photos/seed/${Date.now()}/800/1000`], 
          coverImageIndex: coverIndex >= images.length ? 0 : coverIndex,
          tags: selectedTags,
          rating: rating > 0 ? rating : 0,
          description: description || '暂无描述',
          weather: weather
      };
      
      onSave(newEntry);
  };

  const inputClass = "w-full bg-white/50 backdrop-blur-md border border-stone-200/50 rounded-2xl px-5 py-3 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:bg-white/80 focus:border-stone-300 focus:shadow-sm transition-all duration-300";

  return (
    <div className="pb-40 pt-8 px-6 max-w-2xl mx-auto h-full overflow-y-auto no-scrollbar relative">
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
            <div className="w-10"></div> 
        </div>

        {/* Photo Upload Area - Scrollable Horizontal List if multiple */}
        <div className="mb-8">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {images.map((img, idx) => (
                    <div key={idx} className="relative flex-shrink-0 w-40 h-52 rounded-2xl overflow-hidden group border border-stone-100 shadow-sm">
                        <img src={img} className="w-full h-full object-cover" alt={`Upload ${idx}`} />
                        
                        {/* Remove Button */}
                        <button 
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={12} />
                        </button>

                        {/* Cover Indicator/Selector */}
                        <button 
                            onClick={() => setCoverIndex(idx)}
                            className={`absolute bottom-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-md transition-colors ${coverIndex === idx ? 'bg-amber-400 text-white shadow-sm' : 'bg-black/30 text-white/70 hover:bg-black/50'}`}
                        >
                            {coverIndex === idx ? <Star size={10} fill="currentColor" /> : null}
                            <span>{coverIndex === idx ? '封面' : '设为封面'}</span>
                        </button>
                    </div>
                ))}

                {/* Add Button */}
                {images.length < 99 && (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0 w-40 h-52 bg-white/40 backdrop-blur-sm rounded-2xl border border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 hover:border-stone-400 transition-all text-stone-400"
                    >
                         <input 
                            ref={fileInputRef}
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                         />
                         <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-2">
                             <ImagePlus size={20} />
                         </div>
                         <span className="text-xs">添加图片</span>
                         <span className="text-[9px] mt-1 text-stone-300">{images.length}/99</span>
                    </div>
                )}
            </div>
            {images.length === 0 && (
                 <p className="text-center text-xs text-stone-400 mt-2">至少上传一张图片</p>
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

        {/* Refined Save Button */}
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-40 pointer-events-none">
            <button 
                onClick={handleSave}
                className="pointer-events-auto bg-stone-800 text-stone-50 px-8 py-3 rounded-full shadow-lg shadow-stone-300/50 flex items-center gap-3 hover:bg-stone-900 active:scale-95 transition-all duration-300"
            >
                <Save size={18} strokeWidth={2} />
                <span className="text-sm font-medium tracking-widest">保存记录</span>
            </button>
        </div>

      </motion.div>
    </div>
  );
};
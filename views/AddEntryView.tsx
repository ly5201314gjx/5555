import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Tag, Plus, Save, Star, ArrowLeft, X, Check, ImagePlus, Trash2, CheckCircle } from 'lucide-react';
import { MiniCapsule } from '../components/MiniCapsule';
import { LocationPicker } from '../components/LocationPicker';
import { WeatherWidget } from '../components/WeatherWidget';
import { FoodEntry, WeatherInfo } from '../types';

interface AddEntryViewProps {
  initialEntry?: FoodEntry;
  onSave: (entry: FoodEntry) => void;
  onCancel?: () => void;
  availableTags: string[]; // Received from App
  onAddTag: (tag: string) => void; // Call to add global tag
}

export const AddEntryView: React.FC<AddEntryViewProps> = ({ onSave, onCancel, initialEntry, availableTags, onAddTag }) => {
  // State for form fields
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  
  // Images
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  // Image Selection (Batch Delete)
  const [isImageSelectionMode, setIsImageSelectionMode] = useState(false);
  const [selectedImageIndices, setSelectedImageIndices] = useState<Set<number>>(new Set());
  const imageTimerRef = useRef<{ [key: number]: number }>({});

  // Tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [weather, setWeather] = useState<WeatherInfo | undefined>(undefined);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saving States
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Initialize Data
  useEffect(() => {
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
  }, [initialEntry]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
        setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
        setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCreateTag = () => {
    const inputValue = window.prompt("请输入新标签名称：");
    if (!inputValue || inputValue.trim() === "") return;

    const tag = inputValue.trim();
    // Add to global state immediately
    onAddTag(tag);
    // Select it locally
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Image Selection Logic ---
  
  const handleImageLongPress = (index: number) => {
      // Trigger selection mode
      if (!isImageSelectionMode) {
          setIsImageSelectionMode(true);
          setSelectedImageIndices(new Set([index]));
          if (navigator.vibrate) navigator.vibrate(50);
      }
  };

  const handleImagePointerDown = (index: number) => {
      if (!isImageSelectionMode) {
          imageTimerRef.current[index] = window.setTimeout(() => handleImageLongPress(index), 400);
      }
  };

  const handleImagePointerUp = (index: number) => {
      if (imageTimerRef.current[index]) {
          clearTimeout(imageTimerRef.current[index]);
          delete imageTimerRef.current[index];
      }
  };

  const handleImageClick = (index: number) => {
      if (isImageSelectionMode) {
          const newSet = new Set(selectedImageIndices);
          if (newSet.has(index)) {
              newSet.delete(index);
              if (newSet.size === 0) {
                  // Optional: Exit mode if nothing selected? Let's keep mode active for UX consistency
              }
          } else {
              newSet.add(index);
          }
          setSelectedImageIndices(newSet);
      }
  };

  const cancelImageSelection = () => {
      setIsImageSelectionMode(false);
      setSelectedImageIndices(new Set());
  };

  const deleteSelectedImages = () => {
      const indicesToDelete = (Array.from(selectedImageIndices) as number[]).sort((a, b) => b - a); // Descending order
      let newImages = [...images];
      
      indicesToDelete.forEach(idx => {
          newImages.splice(idx, 1);
      });

      setImages(newImages);
      
      // Reset cover index logic
      // If cover was deleted or shifted, default to 0
      if (selectedImageIndices.has(coverIndex) || coverIndex >= newImages.length) {
          setCoverIndex(0);
      } else {
          // Calculate shift
          let shift = 0;
          indicesToDelete.forEach(idx => {
              if (idx < coverIndex) shift++;
          });
          setCoverIndex(coverIndex - shift);
      }

      setIsImageSelectionMode(false);
      setSelectedImageIndices(new Set());
  };

  // --- End Image Selection Logic ---


  const handleSave = () => {
      // Prevent multiple clicks
      if (isSaving) return;

      if (!title) {
          alert("请输入标题");
          return;
      }
      
      setIsSaving(true);

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
      
      // Simulate save delay for feedback, then call actual save
      setTimeout(() => {
          onSave(newEntry);
          setShowSuccess(true);
          
          // Wait a bit for the success animation before unmounting/closing
          setTimeout(() => {
              // The parent component usually handles the view switch, 
              // but we rely on onSave triggering a state change in parent.
              // We just reset saving state for safety.
              setIsSaving(false);
          }, 1000);
      }, 500);
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
        <div className="mb-8 relative">
            {isImageSelectionMode && (
                <div className="absolute -top-8 right-0 flex items-center gap-2">
                     <span className="text-xs text-stone-500 font-medium">已选 {selectedImageIndices.size} 张</span>
                </div>
            )}
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-2">
                {images.map((img, idx) => {
                    const isSelected = selectedImageIndices.has(idx);
                    
                    return (
                        <motion.div 
                            key={idx} 
                            layout
                            className={`relative flex-shrink-0 w-40 h-52 rounded-2xl overflow-hidden group border transition-all duration-300 ${
                                isImageSelectionMode 
                                    ? (isSelected ? 'border-amber-500 ring-2 ring-amber-500 ring-offset-2 scale-95' : 'border-stone-200 opacity-60 scale-90') 
                                    : 'border-stone-100 shadow-sm'
                            }`}
                            onPointerDown={() => handleImagePointerDown(idx)}
                            onPointerUp={() => handleImagePointerUp(idx)}
                            onPointerLeave={() => handleImagePointerUp(idx)}
                            onClick={() => handleImageClick(idx)}
                        >
                            <img src={img} className="w-full h-full object-cover" alt={`Upload ${idx}`} />
                            
                            {/* Selection Checkbox Overlay */}
                            {isImageSelectionMode ? (
                                <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-amber-500 border-amber-500' : 'bg-black/20 border-white'}`}>
                                    {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                                </div>
                            ) : (
                                <>
                                    {/* Normal Mode Overlays */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setCoverIndex(idx); }}
                                        className={`absolute bottom-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-md transition-colors ${coverIndex === idx ? 'bg-amber-400 text-white shadow-sm' : 'bg-black/30 text-white/70 hover:bg-black/50'}`}
                                    >
                                        {coverIndex === idx ? <Star size={10} fill="currentColor" /> : null}
                                        <span>{coverIndex === idx ? '封面' : '设为封面'}</span>
                                    </button>
                                </>
                            )}
                        </motion.div>
                    );
                })}

                {/* Add Button - Hidden in selection mode */}
                {!isImageSelectionMode && images.length < 99 && (
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
        <div className={`space-y-6 transition-opacity duration-300 ${isImageSelectionMode ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
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
                        onClick={handleCreateTag}
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

        {/* Action Bar (Save or Delete) - New Mini Capsule Design */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none">
            <AnimatePresence mode="wait">
                {isImageSelectionMode ? (
                    <motion.div
                        key="delete-action"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl shadow-red-200/30 rounded-full p-1.5 flex items-center gap-1.5"
                    >
                        <button 
                            onClick={cancelImageSelection}
                            className="px-4 py-2 rounded-full text-stone-500 text-[10px] font-medium hover:bg-stone-100 transition-colors"
                        >
                            取消
                        </button>
                        {selectedImageIndices.size > 0 && (
                            <button 
                                onClick={deleteSelectedImages}
                                className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg shadow-red-200 flex items-center gap-1.5 hover:bg-red-600 active:scale-95 transition-all"
                            >
                                <Trash2 size={12} />
                                <span className="text-[10px] font-medium tracking-widest">删除 ({selectedImageIndices.size})</span>
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.button 
                        key="save-action"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        onClick={handleSave}
                        disabled={isSaving}
                        // Refined Design: Mini Capsule, Dark Stone color for elegance
                        className={`pointer-events-auto px-6 py-2 rounded-full shadow-xl flex items-center gap-2 transition-all duration-300 ${
                            isSaving 
                                ? 'bg-stone-300 text-stone-500 cursor-not-allowed' 
                                : 'bg-stone-900 text-stone-50 hover:bg-black active:scale-95 shadow-stone-400/50'
                        }`}
                    >
                        {isSaving ? (
                             <div className="w-3 h-3 border-2 border-stone-400 border-t-stone-600 rounded-full animate-spin" />
                        ) : (
                             <Save size={14} strokeWidth={2.5} />
                        )}
                        <span className="text-xs font-bold tracking-widest">{isSaving ? '保存中' : '保存'}</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>

        {/* Success Modal */}
        <AnimatePresence>
            {showSuccess && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-3"
                    >
                        <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle size={28} />
                        </div>
                        <h3 className="text-stone-800 font-bold text-sm">保存成功</h3>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};
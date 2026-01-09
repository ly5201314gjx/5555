import React from 'react';
import { motion } from 'framer-motion';

export const DiscoverView: React.FC = () => {
    // Generate grid items with different spans for masonry effect
    const gridItems = [
        { id: 1, span: 'col-span-1 row-span-1', img: 'https://picsum.photos/id/292/400/400' },
        { id: 2, span: 'col-span-1 row-span-2', img: 'https://picsum.photos/id/488/400/800' },
        { id: 3, span: 'col-span-1 row-span-1', img: 'https://picsum.photos/id/493/400/400' },
        { id: 4, span: 'col-span-2 row-span-1', img: 'https://picsum.photos/id/365/800/400' },
        { id: 5, span: 'col-span-1 row-span-1', img: 'https://picsum.photos/id/425/400/400' },
        { id: 6, span: 'col-span-1 row-span-1', img: 'https://picsum.photos/id/429/400/400' },
    ];

  return (
    <div className="pb-32 pt-10 px-6 max-w-3xl mx-auto h-full min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-end mb-10">
            <div>
                <h2 className="serif text-3xl text-stone-800 mb-1">拾光</h2>
                <p className="text-xs text-stone-400 tracking-wider">光影流转的瞬间</p>
            </div>
            <div className="text-[10px] font-medium tracking-widest text-stone-400 border border-stone-200 rounded-full px-4 py-1.5 uppercase">
                248 个瞬间
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 auto-rows-[180px]">
            {gridItems.map((item, idx) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05, duration: 0.6 }}
                    className={`relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 cursor-pointer ${item.span}`}
                >
                    <img src={item.img} className="w-full h-full object-cover opacity-95 hover:opacity-100 transition-opacity duration-500 hover:scale-105 transform" alt="Gallery" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/10 to-transparent pointer-events-none" />
                </motion.div>
            ))}
        </div>
      </motion.div>
    </div>
  );
};
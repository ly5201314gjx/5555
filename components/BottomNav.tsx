import React from 'react';
import { Home, Search, Plus, User } from 'lucide-react';
import { ViewState } from '../types';
import { motion } from 'framer-motion';

interface BottomNavProps {
  currentView: ViewState;
  onChange: (view: ViewState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChange }) => {
  const navItems = [
    { id: ViewState.HOME, icon: Home },
    { id: ViewState.SEARCH, icon: Search },
    { id: ViewState.ADD, icon: Plus, isAction: true }, // Special styling for add
    { id: ViewState.PROFILE, icon: User },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <div className="pointer-events-auto bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-stone-200/50 rounded-full px-6 py-4 flex items-center gap-8 md:gap-12 transition-all duration-300">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          if (item.isAction) {
             return (
                <motion.button
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-stone-900 text-white p-3 rounded-full shadow-lg shadow-stone-300 flex items-center justify-center group"
                >
                    <Icon size={22} strokeWidth={2} className="group-hover:rotate-90 transition-transform duration-300" />
                </motion.button>
             )
          }

          return (
            <motion.button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="relative p-2 flex flex-col items-center justify-center group"
              whileTap={{ scale: 0.8 }}
            >
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-colors duration-300 ${
                  isActive ? 'text-stone-900' : 'text-stone-400 group-hover:text-stone-600'
                }`} 
              />
              {/* Active Indicator Dot - Animated */}
              {isActive && (
                <motion.span 
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-stone-900"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
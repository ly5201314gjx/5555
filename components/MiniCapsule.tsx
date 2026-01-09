import React, { useRef } from 'react';
import { MiniCapsuleProps } from '../types';

interface ExtendedMiniCapsuleProps extends MiniCapsuleProps {
  onLongPress?: () => void;
  className?: string;
}

export const MiniCapsule: React.FC<ExtendedMiniCapsuleProps> = ({ 
  label, 
  active = false, 
  onClick, 
  onLongPress,
  variant = 'default',
  className = ''
}) => {
  const timerRef = useRef<number | null>(null);

  const startPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (onLongPress) {
        onLongPress();
      }
    }, 500); // 500ms for long press
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  let baseClasses = "px-4 py-1.5 rounded-full text-[11px] font-medium tracking-wide transition-all duration-300 ease-out cursor-pointer select-none flex items-center justify-center touch-none border shadow-sm";
  
  let variantClasses = "";
  
  if (variant === 'default') {
    variantClasses = active 
      ? "bg-stone-800 border-stone-800 text-white shadow-md scale-105" 
      : "bg-white border-stone-100 text-stone-500 hover:border-stone-300 hover:text-stone-700 hover:bg-stone-50";
  } else if (variant === 'outline') {
    variantClasses = "bg-transparent border-stone-200 text-stone-400 hover:border-stone-400 hover:text-stone-600";
  } else if (variant === 'blur') {
    variantClasses = "bg-white/40 backdrop-blur-md border-white/50 text-stone-700 shadow-sm";
  } else if (variant === 'danger') {
      variantClasses = "bg-red-50 border-red-100 text-red-500 hover:bg-red-100";
  }

  return (
    <div 
      onClick={onClick}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {label}
    </div>
  );
};
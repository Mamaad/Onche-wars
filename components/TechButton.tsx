
import React from 'react';

export const TechButton = ({ children, onClick, disabled, variant = 'primary', className = "" }: any) => {
  const baseStyle = "relative px-4 py-2 font-display text-sm uppercase tracking-wider transition-all duration-200 clip-path-polygon";
  
  const variants = {
    primary: "bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 hover:bg-yellow-500 hover:text-black hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]",
    secondary: "bg-slate-800/50 text-slate-300 border border-slate-600 hover:border-slate-400 hover:text-white hover:bg-slate-700",
    danger: "bg-red-900/20 text-red-500 border border-red-800 hover:bg-red-600 hover:text-white",
    disabled: "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${disabled ? variants.disabled : variants[variant]} ${className}`}
      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
    >
      {children}
    </button>
  );
};

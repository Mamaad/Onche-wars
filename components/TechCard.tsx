import React from 'react';

interface TechCardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: (e?: any) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const TechCard: React.FC<TechCardProps> = ({ 
  children, 
  className = "", 
  onClick, 
  onMouseEnter, 
  onMouseLeave 
}) => (
  <div 
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className={`relative bg-space-black/60 backdrop-blur-md border border-slate-800 shadow-xl overflow-hidden group ${className} ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-tech-gold/50"></div>
    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-tech-gold/50"></div>
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-tech-gold/50"></div>
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-tech-gold/50"></div>
    <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
    {children}
  </div>
);
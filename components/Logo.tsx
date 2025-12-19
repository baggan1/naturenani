
import React from 'react';

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
  showSlogan?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "h-8 w-8", 
  textClassName = "text-xl",
  showText = true,
  showSlogan = true
}) => {
  return (
    <div className="flex items-center gap-2 select-none overflow-hidden">
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`text-[#4a7c59] flex-shrink-0 ${className}`}
      >
        {/* Top Leaf */}
        <path 
          d="M12 3C10 9 10 14 12 21C14 14 14 9 12 3Z" 
          fill="#4a7c59" 
          fillOpacity="0.2"
        />
        {/* Left Leaf */}
        <path 
          d="M12 21C8 17 4 13 4 9C4 6 7 6 10 9" 
          fill="#4a7c59" 
          fillOpacity="0.2"
        />
        {/* Right Leaf */}
        <path 
          d="M12 21C16 17 20 13 20 9C20 6 17 6 14 9" 
          fill="#4a7c59" 
          fillOpacity="0.2"
        />
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-serif font-bold text-[#8B0000] tracking-tight leading-none ${textClassName}`}>
            NatureNani
          </span>
          {showSlogan && (
            <span className="text-[9px] md:text-[10px] text-sage-600 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap hidden sm:block">
              Ancient Wisdom for Modern Holistic Wellness
            </span>
          )}
        </div>
      )}
    </div>
  );
};

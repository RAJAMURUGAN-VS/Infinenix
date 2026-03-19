import { useState } from "react";

interface Cube3DIconProps {
  onClick?: () => void;
  className?: string;
}

const Cube3DIcon = ({ onClick, className = "" }: Cube3DIconProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative cursor-pointer transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'} ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 100 100"
        className="transform-gpu w-8 h-8"
        style={{
          transform: isHovered ? 'rotateX(15deg) rotateY(15deg)' : 'rotateX(0deg) rotateY(0deg)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* 3D Network/Globe Icon */}
        <defs>
          <linearGradient id="sphereGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#1d4ed8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Main sphere/globe outline */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="url(#sphereGradient)"
          strokeWidth="2"
          className={`transition-all duration-300 ${isHovered ? 'stroke-neural-cyan' : ''}`}
        />

        {/* Inner sphere for 3D effect */}
        <circle
          cx="50"
          cy="50"
          r="28"
          fill="url(#sphereGradient)"
          opacity="0.3"
          className={`transition-all duration-300 ${isHovered ? 'opacity-50' : ''}`}
        />

        {/* Network nodes */}
        <circle cx="35" cy="35" r="3" fill="url(#nodeGradient)" opacity={isHovered ? "1" : "0.8"} />
        <circle cx="65" cy="35" r="3" fill="url(#nodeGradient)" opacity={isHovered ? "1" : "0.8"} />
        <circle cx="35" cy="65" r="3" fill="url(#nodeGradient)" opacity={isHovered ? "1" : "0.8"} />
        <circle cx="65" cy="65" r="3" fill="url(#nodeGradient)" opacity={isHovered ? "1" : "0.8"} />
        <circle cx="50" cy="30" r="2.5" fill="url(#nodeGradient)" opacity={isHovered ? "1" : "0.7"} />
        <circle cx="70" cy="50" r="2.5" fill="url(#nodeGradient)" opacity={isHovered ? "1" : "0.7"} />
        <circle cx="50" cy="70" r="2.5" fill="url(#nodeGradient)" opacity={isHovered ? "1" : "0.7"} />
        <circle cx="30" cy="50" r="2.5" fill="url(#nodeGradient)" opacity={isHovered ? "1" : "0.7"} />

        {/* Connection lines */}
        <line x1="35" y1="35" x2="50" y2="30" stroke="#60a5fa" strokeWidth="1" opacity={isHovered ? "0.8" : "0.5"} />
        <line x1="65" y1="35" x2="50" y2="30" stroke="#60a5fa" strokeWidth="1" opacity={isHovered ? "0.8" : "0.5"} />
        <line x1="35" y1="65" x2="30" y2="50" stroke="#60a5fa" strokeWidth="1" opacity={isHovered ? "0.8" : "0.5"} />
        <line x1="65" y1="65" x2="70" y2="50" stroke="#60a5fa" strokeWidth="1" opacity={isHovered ? "0.8" : "0.5"} />
        <line x1="35" y1="35" x2="30" y2="50" stroke="#60a5fa" strokeWidth="1" opacity={isHovered ? "0.8" : "0.5"} />
        <line x1="65" y1="35" x2="70" y2="50" stroke="#60a5fa" strokeWidth="1" opacity={isHovered ? "0.8" : "0.5"} />
        <line x1="35" y1="65" x2="50" y2="70" stroke="#60a5fa" strokeWidth="1" opacity={isHovered ? "0.8" : "0.5"} />
        <line x1="65" y1="65" x2="50" y2="70" stroke="#60a5fa" strokeWidth="1" opacity={isHovered ? "0.8" : "0.5"} />

        {/* Orbital rings for 3D effect */}
        <ellipse
          cx="50"
          cy="50"
          rx="35"
          ry="15"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          opacity="0.6"
          className={`transition-all duration-300 ${isHovered ? 'stroke-neural-cyan opacity-80' : ''}`}
        />
        <ellipse
          cx="50"
          cy="50"
          rx="15"
          ry="35"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          opacity="0.6"
          className={`transition-all duration-300 ${isHovered ? 'stroke-neural-cyan opacity-80' : ''}`}
        />

        {/* Hover pulse effect */}
        {isHovered && (
          <>
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1"
              opacity="0.6"
              className="animate-pulse"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="0.5"
              opacity="0.3"
              className="animate-pulse"
              style={{ animationDelay: '0.5s' }}
            />
          </>
        )}
      </svg>
      
      {/* Additional glow effect on hover */}
      {isHovered && (
        <div className="absolute inset-0 rounded-full bg-neural-cyan/20 animate-pulse blur-sm" />
      )}
    </div>
  );
};

export default Cube3DIcon; 
import React, { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false, 
  className = '' 
}) => {
  const baseClasses = "w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-gray-800/50 border border-cyan-500/30 text-cyan-400 hover:bg-gray-700/50 hover:border-purple-500/30 hover:text-purple-400"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
    </button>
  );
};
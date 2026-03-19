import React, { ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps {
  type: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: ReactNode;
  required?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export const Input: React.FC<InputProps> = ({ 
  type, 
  name, 
  placeholder, 
  value, 
  onChange, 
  icon, 
  required = false, 
  showPassword, 
  onTogglePassword 
}) => {
  return (
    <div className="relative group">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 group-focus-within:text-purple-400 transition-colors duration-300">
        {icon}
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full pl-12 pr-12 py-4 bg-gray-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-400/20 transition-all duration-300 backdrop-blur-sm"
      />
      {(type === 'password' || (type === 'text' && name.includes('password'))) && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-purple-400 transition-colors duration-300"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
};
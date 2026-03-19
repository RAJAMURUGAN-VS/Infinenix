// pages/AuthPage.tsx
import React, { useState, useEffect } from 'react';
import { Zap, Shield, User } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Generate animated particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 6
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a0d2e 25%, #2d1b4e 50%, #1e1b4b 75%, #0f0f23 100%)'
    }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              background: `rgba(${Math.random() > 0.5 ? '6, 182, 212' : '168, 85, 247'}, 0.6)`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center">
        <div className="flex items-center justify-center">
          <Zap className="w-6 h-6 text-cyan-400 mr-2 animate-pulse" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Infinenix Arcane Luminaries
          </h1>
          <Zap className="w-6 h-6 text-purple-400 ml-2 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Main Auth Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="relative">
          {/* Glowing Border */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur-sm opacity-75 animate-pulse" />
          
          {/* Form Container */}
          <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/30 shadow-2xl">
            {/* Tab Switcher */}
            <div className="flex mb-8 bg-gray-800/50 rounded-full p-1 border border-cyan-500/30">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center ${
                  isLogin
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 mr-2" />
                Access
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center ${
                  !isLogin
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4 mr-2" />
                Register
              </button>
            </div>

            {/* Forms */}
            {isLogin ? (
              <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
            ) : (
              <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
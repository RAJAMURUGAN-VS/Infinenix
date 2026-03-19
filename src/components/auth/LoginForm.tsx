// components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { Mail, Lock, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/LoginInput';
import { Button } from '../ui/LoginButton';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup }) => {
  const { login, loading, resetPassword } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (!result.success) {
        setError(result.error || 'Login failed');
      } else {
        navigate('/DomainSelector');
      }
      // Success is handled by the auth context and will redirect automatically
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await resetPassword(formData.email);

      if (result.success) {
        setSuccess('Password reset email sent! Check your inbox.');
        setShowForgotPassword(false);
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="w-full max-w-md flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }


  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-cyan-400 mr-2 animate-pulse" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Access Terminal
          </h2>
        </div>
        <p className="text-gray-400">Enter your credentials to proceed</p>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg text-sm bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg text-sm bg-green-500/10 border border-green-500/30 text-green-400">
            {success}
          </div>
        )}

        <Input
          type="email"
          name="email"
          placeholder="Neural Link Address"
          value={formData.email}
          onChange={handleInputChange}
          icon={<Mail size={20} />}
          required
        />

        <Input
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Security Protocol"
          value={formData.password}
          onChange={handleInputChange}
          icon={<Lock size={20} />}
          required
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />

        <Button 
          type="button" 
          disabled={isLoading || loading} 
          onClick={handleSubmit}
        >
          {isLoading ? 'Authenticating...' : 'Initialize Connection'}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={isLoading || loading}
            className="text-sm text-cyan-400 hover:text-purple-400 transition-colors duration-300 disabled:opacity-50"
          >
            Recovery Protocol Needed?
          </button>
        </div>

        <div className="text-center pt-6 border-t border-gray-700">
          <p className="text-gray-400 text-sm mb-2">New to the Neural Network?</p>
          <button
            type="button"
            onClick={onSwitchToSignup}
            disabled={isLoading || loading}
            className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 hover:from-purple-400 hover:to-pink-400 transition-all duration-300 font-medium disabled:opacity-50"
          >
            Register New Identity
          </button>
        </div>
      </div>
    </div>
  );
};
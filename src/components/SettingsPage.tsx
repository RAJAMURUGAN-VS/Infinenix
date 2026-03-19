import React, { useState, useEffect, useCallback } from "react";
import { 
  X, 
  Settings,
  MessageSquare,
  Bell,
  User,
  Sun,
  Moon,
  Monitor,
  Palette,
  Edit,
  Save,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Trash2,
  Check,
  AlertTriangle
} from "lucide-react";

// TypeScript interfaces
interface ProfileData {
  name: string;
  email: string;
  password: string;
}

interface SettingsPageProps {
  isOpen?: boolean;
  onClose?: () => void;
  isDarkMode?: boolean;
}

type TabType = 'voice' | 'appearance' | 'notifications' | 'profile';
type ThemeMode = 'light' | 'dark' | 'system';

import { useNavigate } from "react-router-dom";

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  isOpen = true, 
  onClose = () => {}, 
  isDarkMode = true 
}) => {
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    // Redirect to the page where Sidebar is visible
    // Assuming Sidebar is visible on /Chat page or other page, update accordingly
    navigate("/Chat");
  };
  const [activeTab, setActiveTab] = useState<TabType>('voice');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('Motivator');
  const [isCharactersEnabled, setIsCharactersEnabled] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [responseAlerts, setResponseAlerts] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123'
  });
  const [editProfileData, setEditProfileData] = useState<ProfileData>(profileData);

  const characters: string[] = [
    'Motivator', 'Detective', 'Teacher', 'Funny', 'Friendly',
    'Professional', 'Psychologist', 'Poetic'
  ];

  const tabs = [
    { id: 'voice' as TabType, label: 'Voice & Tone', icon: MessageSquare, shortLabel: 'Voice', rotation: 0 },
    { id: 'appearance' as TabType, label: 'Appearance', icon: Palette, shortLabel: 'Theme', rotation: 90 },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell, shortLabel: 'Alerts', rotation: 180 },
    { id: 'profile' as TabType, label: 'Profile', icon: User, shortLabel: 'Profile', rotation: 270 }
  ];

  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const wheelRotation = activeTabIndex !== -1 ? -tabs[activeTabIndex].rotation : 0;

  // Handle escape key press to close modal
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleEscapeKey]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSaveProfile = async (): Promise<void> => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    setProfileData(editProfileData);
    setIsEditingProfile(false);
    setIsSaving(false);
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 3000);
  };

  const handleDeleteAllChats = async (): Promise<void> => {
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate deletion
    setIsDeleting(false);
    setShowDeleteConfirm(true);
    setTimeout(() => setShowDeleteConfirm(false), 3000);
    console.log('All chats deleted');
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const cn = (...classes: (string | boolean | undefined)[]): string => 
    classes.filter(Boolean).join(' ');

  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "ghost";
    size?: "default" | "sm" | "icon";
    children: React.ReactNode;
    loading?: boolean;
  }

  const Button: React.FC<ButtonProps> = ({ 
    children, 
    variant = "default", 
    size = "default", 
    className = "", 
    onClick, 
    loading = false,
    disabled,
    ...props 
  }) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform active:scale-95";
    const variants = {
      default: "bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl",
      destructive: "bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl",
      outline: cn(
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md",
        isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-200" : "border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
      ),
      ghost: cn(
        "hover:bg-accent hover:text-accent-foreground",
        isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"
      )
    };
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      icon: "h-10 w-10"
    };
    
    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        onClick={onClick}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {children}
      </button>
    );
  };

  interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

  const Input: React.FC<InputProps> = ({ className = "", ...props }) => (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
        isDarkMode 
          ? "bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-400" 
          : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500",
        className
      )}
      {...props}
    />
  );

  // Animated Theme Components
  const LightThemeAnimation = () => (
    <div className="relative w-full h-20 bg-gradient-to-b from-blue-200 via-blue-100 to-yellow-100 rounded-lg overflow-hidden">
      <div className="absolute top-2 right-4 w-6 h-6 bg-yellow-400 rounded-full animate-pulse shadow-lg">
        <div className="absolute inset-1 bg-yellow-300 rounded-full"></div>
      </div>
      <div className="absolute top-6 left-6 w-8 h-4 bg-white rounded-full opacity-80 animate-float"></div>
      <div className="absolute top-4 left-12 w-6 h-3 bg-white rounded-full opacity-60 animate-float-delay"></div>
      <div className="absolute top-8 left-2 w-4 h-2 bg-white rounded-full opacity-70 animate-float-slow"></div>
    </div>
  );

  const DarkThemeAnimation = () => (
    <div className="relative w-full h-20 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900 rounded-lg overflow-hidden">
      <div className="absolute top-2 right-4 w-6 h-6 bg-gray-100 rounded-full animate-pulse shadow-lg">
        <div className="absolute inset-1 bg-gray-200 rounded-full"></div>
        <div className="absolute top-1 right-1 w-1 h-1 bg-slate-600 rounded-full"></div>
      </div>
      <div className="absolute top-6 left-6 w-8 h-4 bg-slate-600 rounded-full opacity-80 animate-float"></div>
      <div className="absolute top-4 left-12 w-6 h-3 bg-slate-600 rounded-full opacity-60 animate-float-delay"></div>
      <div className="absolute top-8 left-2 w-4 h-2 bg-slate-600 rounded-full opacity-70 animate-float-slow"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-slate-700 opacity-20"></div>
    </div>
  );

  const SystemThemeAnimation = () => (
    <div className="relative w-full h-20 bg-gradient-to-r from-blue-100 via-slate-200 to-slate-700 rounded-lg overflow-hidden">
      <div className="absolute top-2 right-4 w-6 h-6 bg-gradient-to-r from-yellow-400 to-gray-200 rounded-full animate-pulse shadow-lg"></div>
      <div className="absolute top-6 left-6 w-8 h-4 bg-gradient-to-r from-white to-slate-600 rounded-full opacity-80 animate-float"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-10"></div>
    </div>
  );

  // Confirmation Messages
  const ConfirmationMessage: React.FC<{ show: boolean; message: string; type: 'success' | 'error' }> = ({ show, message, type }) => (
    <div className={cn(
      "fixed top-4 right-4 z-[60] transition-all duration-300 transform",
      show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
    )}>
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm",
        type === 'success' 
          ? "bg-green-500/90 text-white" 
          : "bg-red-500/90 text-white"
      )}>
        {type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Confirmation Messages */}
      <ConfirmationMessage show={showSaveConfirm} message="Your changes have been saved!" type="success" />
      <ConfirmationMessage show={showDeleteConfirm} message="All chats have been deleted!" type="success" />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={handleBackdropClick}
          aria-label="Close settings"
        />
        
        {/* Settings Modal */}
        <div className={cn(
          "relative w-full max-w-5xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl transform transition-all duration-300 scale-100",
          "border border-opacity-20 backdrop-blur-xl",
          isDarkMode 
            ? "bg-slate-900/95 border-slate-700 text-slate-100" 
            : "bg-white/95 border-slate-200 text-slate-900"
        )}>
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-3 sm:p-6 border-b",
            isDarkMode ? "border-slate-700" : "border-slate-200"
          )}>
            <div className="flex items-center gap-3">
              {/* Rotating Settings Wheel */}
              <div className="relative">
                <div className={cn(
                  "p-2 sm:p-3 rounded-xl transition-all duration-500 ease-in-out",
                  isDarkMode ? "bg-slate-800" : "bg-slate-100"
                )}>
                  <Settings 
                    size={20} 
                    className="text-blue-500 transition-transform duration-500 ease-in-out" 
                    style={{ transform: `rotate(${wheelRotation}deg)` }}
                  />
                </div>
                {/* Color indicator */}
                <div className={cn(
                  "absolute -top-1 -right-1 w-3 h-3 rounded-full transition-colors duration-300",
                  activeTab === 'voice' ? "bg-green-500" :
                  activeTab === 'appearance' ? "bg-purple-500" :
                  activeTab === 'notifications' ? "bg-yellow-500" : "bg-blue-500"
                )} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Settings</h2>
                <p className={cn(
                  "text-xs sm:text-sm hidden sm:block", 
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                )}>
                  Customize your AI assistant experience
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className={cn(
                "h-8 w-8 rounded-lg transition-colors",
                isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
              )}
              aria-label="Close settings"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className={cn(
            "flex border-b overflow-x-auto scrollbar-hide",
            isDarkMode ? "border-slate-700" : "border-slate-200"
          )}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-all duration-300 relative whitespace-nowrap min-w-0 transform hover:scale-105",
                  activeTab === tab.id
                    ? (isDarkMode ? "text-blue-400" : "text-blue-600")
                    : (isDarkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-600 hover:text-slate-900")
                )}
              >
                <tab.icon size={16} className="flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full transition-all duration-300" />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-3 sm:p-6 max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-500 scrollbar-track-transparent">
            {/* Voice & Tone Tab */}
            {activeTab === 'voice' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-blue-500" />
                      <span className="font-medium text-sm sm:text-base">Characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsCharactersEnabled(!isCharactersEnabled)}
                        className={cn(
                          "relative w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-all duration-300",
                          isCharactersEnabled ? "bg-blue-500 shadow-lg" : (isDarkMode ? "bg-slate-700" : "bg-slate-300")
                        )}
                        aria-label={`Turn characters ${isCharactersEnabled ? 'off' : 'on'}`}
                      >
                        <div className={cn(
                          "absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md",
                          isCharactersEnabled ? "left-5 sm:left-7" : "left-0.5 sm:left-1"
                        )} />
                      </button>
                      <span className={cn(
                        "text-xs sm:text-sm font-medium", 
                        isCharactersEnabled ? "text-green-500" : (isDarkMode ? "text-slate-400" : "text-slate-500")
                      )}>
                        {isCharactersEnabled ? "On" : "Off"}
                      </span>
                    </div>
                  </div>

                  {isCharactersEnabled && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                      {characters.map((character) => (
                        <button
                          key={character}
                          onClick={() => setSelectedCharacter(character)}
                          className={cn(
                            "p-2 sm:p-3 rounded-lg border text-left transition-all duration-200 transform hover:scale-105",
                            selectedCharacter === character
                              ? (isDarkMode ? "bg-blue-900/50 border-blue-500 text-blue-300 shadow-lg" : "bg-blue-50 border-blue-500 text-blue-700 shadow-lg")
                              : (isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-200" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800")
                          )}
                        >
                          <div className="font-medium text-xs sm:text-sm">{character}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Palette size={16} className="text-blue-500" />
                    <span className="font-medium text-sm sm:text-base">Theme</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <button
                      onClick={() => setThemeMode('light')}
                      className={cn(
                        "flex flex-col gap-3 p-4 rounded-lg border transition-all duration-300 transform hover:scale-105",
                        themeMode === 'light'
                          ? (isDarkMode ? "bg-blue-900/50 border-blue-500 shadow-lg" : "bg-blue-50 border-blue-500 shadow-lg")
                          : (isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-750" : "bg-slate-50 border-slate-200 hover:bg-slate-100")
                      )}
                    >
                      <LightThemeAnimation />
                      <div className="flex items-center justify-center gap-2">
                        <Sun size={18} className="text-yellow-500" />
                        <span className="text-sm font-medium">Light</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setThemeMode('dark')}
                      className={cn(
                        "flex flex-col gap-3 p-4 rounded-lg border transition-all duration-300 transform hover:scale-105",
                        themeMode === 'dark'
                          ? (isDarkMode ? "bg-blue-900/50 border-blue-500 shadow-lg" : "bg-blue-50 border-blue-500 shadow-lg")
                          : (isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-750" : "bg-slate-50 border-slate-200 hover:bg-slate-100")
                      )}
                    >
                      <DarkThemeAnimation />
                      <div className="flex items-center justify-center gap-2">
                        <Moon size={18} className="text-slate-400" />
                        <span className="text-sm font-medium">Dark</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setThemeMode('system')}
                      className={cn(
                        "flex flex-col gap-3 p-4 rounded-lg border transition-all duration-300 transform hover:scale-105",
                        themeMode === 'system'
                          ? (isDarkMode ? "bg-blue-900/50 border-blue-500 shadow-lg" : "bg-blue-50 border-blue-500 shadow-lg")
                          : (isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-750" : "bg-slate-50 border-slate-200 hover:bg-slate-100")
                      )}
                    >
                      <SystemThemeAnimation />
                      <div className="flex items-center justify-center gap-2">
                        <Monitor size={18} className="text-slate-500" />
                        <span className="text-sm font-medium">System</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell size={16} className="text-blue-500" />
                    <div>
                      <div className="font-medium text-sm sm:text-base">Response Alert</div>
                      <div className={cn("text-xs sm:text-sm", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                        Get notified when AI responds
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setResponseAlerts(!responseAlerts)}
                    className={cn(
                      "relative w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-all duration-300",
                      responseAlerts ? "bg-green-500 shadow-lg" : (isDarkMode ? "bg-slate-700" : "bg-slate-300")
                    )}
                    aria-label={`Turn response alerts ${responseAlerts ? 'off' : 'on'}`}
                  >
                    <div className={cn(
                      "absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md",
                      responseAlerts ? "left-5 sm:left-7" : "left-0.5 sm:left-1"
                    )} />
                  </button>
                </div>

                <div className={cn(
                  "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t",
                  isDarkMode ? "border-slate-700" : "border-slate-200"
                )}>
                  <div className="flex items-center gap-3">
                    <Trash2 size={16} className="text-red-500" />
                    <div>
                      <div className="font-medium text-sm sm:text-base">Delete All Chats</div>
                      <div className={cn("text-xs sm:text-sm", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                        Permanently remove all conversation history
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleDeleteAllChats}
                    variant="destructive"
                    size="sm"
                    loading={isDeleting}
                    className="flex-shrink-0 w-full sm:w-auto"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete All'}
                  </Button>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0 shadow-lg">
                    {profileData.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-center sm:text-left min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold truncate">{profileData.name}</h3>
                    <p className={cn("text-sm truncate", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                      {profileData.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <User size={14} />
                      Name
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={isEditingProfile ? editProfileData.name : profileData.name}
                        onChange={(e) => setEditProfileData({...editProfileData, name: e.target.value})}
                        disabled={!isEditingProfile}
                        className="flex-1"
                        placeholder="Enter your name"
                      />
                      {!isEditingProfile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsEditingProfile(true)}
                          className="h-10 w-10 flex-shrink-0"
                          aria-label="Edit name"
                        >
                          <Edit size={14} />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Mail size={14} />
                      Email
                    </label>
                    <Input
                      value={isEditingProfile ? editProfileData.email : profileData.email}
                      onChange={(e) => setEditProfileData({...editProfileData, email: e.target.value})}
                      disabled={!isEditingProfile}
                      placeholder="Enter your email"
                      type="email"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Lock size={14} />
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={isEditingProfile ? editProfileData.password : profileData.password}
                        onChange={(e) => setEditProfileData({...editProfileData, password: e.target.value})}
                        disabled={!isEditingProfile}
                        className="pr-10"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isEditingProfile && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                      <Button
                        onClick={handleSaveProfile}
                        className="flex-1"
                        loading={isSaving}
                      >
                        <Save size={14} className="mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setEditProfileData(profileData);
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes float-delay {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-delay {
          animation: float-delay 3s ease-in-out infinite 0.5s;
        }
        
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite 1s;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thumb-slate-500::-webkit-scrollbar-thumb {
          background-color: rgb(100 116 139);
          border-radius: 0.25rem;
        }
        
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
      `}</style>
    </>
  );
};

export default SettingsPage;

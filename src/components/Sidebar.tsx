import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterTag, Message } from "@/types/chat";
import { 
  X, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Sparkles, 
  Star,
  MessageSquare,
  Settings,
  Brain,
  Palette,
  Code2,
  Lightbulb,
  PlusCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  starredMessages: Message[];
  messages: Message[];
  onToggleStar: (messageId: string) => void;
  onMessageClick: (messageId: string) => void;
  onNewChat?: () => void;
}

const Sidebar = ({ 
  isOpen, 
  toggleSidebar, 
  starredMessages,
  messages,
  onToggleStar,
  onMessageClick,
  onNewChat
}: SidebarProps) => {
  const [filterTags, setFilterTags] = useState<FilterTag[]>(() => {
    try {
      const saved = localStorage.getItem("filters");
      const savedFilters: FilterTag[] = saved ? JSON.parse(saved) : [];
      return savedFilters.length > 0 ? savedFilters : [
        { id: "1", label: "Learning", type: "category" },
        { id: "2", label: "Creative", type: "visual" },
        { id: "3", label: "Code Help", type: "category" },
      ];
    } catch (error) {
      return [
        { id: "1", label: "Learning", type: "category" },
        { id: "2", label: "Creative", type: "visual" },
        { id: "3", label: "Code Help", type: "category" },
      ];
    }
  });

  const [newFilterValue, setNewFilterValue] = useState("");
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
  
  const [selectedModel, setSelectedModel] = useState(() => {
    try {
      return localStorage.getItem("selectedModel") || "sonar";
    } catch (error) {
      return "sonar";
    }
  });

  const models = [
    { name: "sonar", icon: Brain, color: "text-emerald-600" },
    { name: "sonar-pro", icon: Sparkles, color: "text-purple-600" },
    { name: "sonar-reasoning", icon: Star, color: "text-blue-600" },
    { name: "sonar-reasoning-pro", icon: Code2, color: "text-orange-600" },
    { name: "sonar-deep-research", icon: Brain, color: "text-green-600" }
  ];

  const { isDarkMode } = useTheme();

  const getFilterIcon = (type: string) => {
    switch (type) {
      case 'visual': return Palette;
      case 'category': return Brain;
      default: return Lightbulb;
    }
  };

  const addFilter = () => {
    const newFilter: FilterTag = {
      id: Date.now().toString(),
      label: "",
      type: "category",
    };
    const updatedFilters = [...filterTags, newFilter];
    setFilterTags(updatedFilters);
    setEditingFilterId(newFilter.id);
    
    try {
      localStorage.setItem("filters", JSON.stringify(updatedFilters));
    } catch (error) {
      console.error("Failed to save filters to localStorage:", error);
    }
  };

  const updateFilterLabel = (id: string, label: string) => {
    const updatedFilters = filterTags.map(filter => 
      filter.id === id ? { ...filter, label } : filter
    );
    setFilterTags(updatedFilters);
    
    try {
      localStorage.setItem("filters", JSON.stringify(updatedFilters));
    } catch (error) {
      console.error("Failed to update filters in localStorage:", error);
    }
  };

  const finishEditingFilter = (id: string) => {
    const filter = filterTags.find(f => f.id === id);
    if (filter && !filter.label.trim()) {
      removeFilter(id);
    }
    setEditingFilterId(null);
    setNewFilterValue("");
  };

  const removeFilter = (id: string) => {
    const updatedFilters = filterTags.filter((tag) => tag.id !== id);
    setFilterTags(updatedFilters);
    
    try {
      localStorage.setItem("filters", JSON.stringify(updatedFilters));
    } catch (error) {
      console.error("Failed to update filters in localStorage:", error);
    }
  };

  const selectModel = (model: string) => {
    setSelectedModel(model);
    try {
      localStorage.setItem("selectedModel", model);
    } catch (error) {
      console.error("Failed to save selected model to localStorage:", error);
    }
  };

  const currentModel = models.find(m => m.name === selectedModel) || models[0];


  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          "relative transition-all duration-300 ease-in-out flex flex-col h-full",
          isDarkMode ? "bg-slate-900 border-r border-slate-700 text-slate-200" : "bg-white border-r border-slate-200",
          isOpen ? "w-80" : "w-16"
        )}
      >
        {/* Header - New Chat Card and Toggle */}
        <div className={`p-3 border-b ${isDarkMode ? "border-slate-700" : "border-slate-100"} ${!isOpen && "px-2 justify-center"}`}>
          {isOpen ? (
            <div className="flex items-start gap-2">
              {/* Enhanced New Chat Button */}
              <button
                className={cn(
                  "group relative flex-1 flex items-center gap-3 h-12 px-4 rounded-xl font-medium text-sm transition-all duration-300 overflow-hidden",
                  "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500",
                  "text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                )}
                onClick={onNewChat}
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

                {/* Icon with animation */}
                <div className="relative z-10 p-1.5 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors duration-200">
                  <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                </div>

                {/* Text with shimmer effect */}
                <div className="relative z-10 flex flex-col items-start">
                  <span className="font-semibold">Start New Chat</span>
                  <span className="text-xs text-blue-100 opacity-80">Begin a fresh conversation</span>
                </div>

                {/* Sparkle animation */}
                <div className="absolute top-2 right-3 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Sparkles size={14} className="text-yellow-300 animate-pulse" />
                </div>
              </button>

              {/* Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 flex-shrink-0 mt-2", isDarkMode && "hover:bg-slate-800")}
                onClick={toggleSidebar}
              >
                <ChevronLeft size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 
              text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200
              flex items-center justify-center group"
                onClick={onNewChat}
              >
                <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
              
              {/* Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 flex-shrink-0", isDarkMode && "hover:bg-slate-800")}
                onClick={toggleSidebar}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>

        {/* Filters Section - At the top with max 4 visible */}
        <div className={cn("p-3", !isOpen && "px-2")} data-tour-element="filter-section">
          <div className={cn("flex items-center justify-between mb-3", !isOpen && "justify-center")}>
            {isOpen ? (
              <span className={cn("text-sm font-semibold", isDarkMode ? "text-slate-100" : "text-slate-700")}>Smart Filters</span>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Filter size={16} className={isDarkMode ? "text-slate-400" : "text-slate-700"} />
                </TooltipTrigger>
                <TooltipContent side="right" className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>Smart Filters</TooltipContent>
              </Tooltip>
            )}
            {isOpen && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn("text-xs h-4", isDarkMode && "bg-slate-700 text-slate-300")}>
                  {filterTags.length}
                </Badge>
                <Button variant="ghost" size="icon" className={cn("h-6 w-6", isDarkMode && "hover:bg-slate-800")}
                  onClick={addFilter} data-tour-element="filter-add-button">
                  <Plus size={14} />
                </Button>
              </div>
            )}
          </div>

          {isOpen && (
            <div className={cn("space-y-1", filterTags.length > 4 ? "max-h-48 overflow-y-auto pr-2" : "")}>
              {filterTags.map((tag) => (
                <div key={tag.id} className={cn("flex items-center justify-between p-2 rounded-md text-sm", isDarkMode ? "bg-slate-800 text-slate-200 border border-slate-700" : "bg-slate-100 text-slate-800 border border-slate-200")}>
                  <div className="flex items-center gap-2 flex-1">
                    {getFilterIcon(tag.type) && <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>{React.createElement(getFilterIcon(tag.type), { size: 14 })}</span>}
                    {editingFilterId === tag.id ? (
                      <Input
                        type="text"
                        value={tag.label}
                        onChange={(e) => updateFilterLabel(tag.id, e.target.value)}
                        placeholder="Filter name..."
                        className={cn("h-6 text-sm border-0 bg-transparent p-0 focus-visible:ring-0", isDarkMode ? "text-slate-200 placeholder:text-slate-400" : "")}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            finishEditingFilter(tag.id);
                          } else if (e.key === 'Escape') {
                            finishEditingFilter(tag.id);
                          }
                        }}
                        onBlur={() => finishEditingFilter(tag.id)}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="flex-1 cursor-pointer"
                        onClick={() => setEditingFilterId(tag.id)}
                      >
                        {tag.label || "Untitled Filter"}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className={cn("h-6 w-6", isDarkMode && "hover:bg-slate-700")}
                    onClick={() => removeFilter(tag.id)}>
                    <X size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-1"></div>

        {/* Separator between filters and model */}
        <div className={cn("px-3", !isOpen && "px-2")}>
          <Separator className={isDarkMode ? "bg-slate-700" : ""} />
        </div>

        {/* AI Model Selector - Moved to bottom */}
        <div className={cn("p-3", !isOpen && "px-2")} data-tour-element="ai-model-section">
          {isOpen && (
            <div className="flex items-center gap-2 mb-3">
              <currentModel.icon size={14} className={currentModel.color} />
              <span className={cn("text-sm font-semibold", isDarkMode ? "text-slate-100" : "text-slate-700")}>AI Model</span>
            </div>
          )}
          
          <div className="space-y-1">
            {models.map((model) => (
              <Tooltip key={model.name}>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedModel === model.name ? "default" : "ghost"}
                    size={isOpen ? "sm" : "icon"}
                    className={cn(
                      "w-full transition-colors h-8",
                      isOpen ? "justify-start gap-3" : "justify-center",
                      selectedModel === model.name 
                        ? (isDarkMode ? "bg-blue-700 text-white border-blue-600 hover:bg-blue-600" : "bg-blue-50 text-blue-700 border-blue-200")
                        : (isDarkMode ? "hover:bg-slate-800 text-slate-200" : "")
                    )}
                    onClick={() => selectModel(model.name)}
                  >
                    <div className="flex items-center justify-center">
                      <model.icon size={14} className={model.color} />
                    </div>
                    {isOpen && <span className="truncate text-xs">{model.name}</span>}
                  </Button>
                </TooltipTrigger>
                {!isOpen && <TooltipContent side="right" className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>{model.name}</TooltipContent>}
              </Tooltip>
            ))}
          </div>
        </div>

        <div className={cn("px-3", !isOpen && "px-2")}>
           <Separator className={isDarkMode ? "bg-slate-700" : ""} />
        </div>

        {/* User Profile */}
        <div className={cn("p-3", !isOpen && "px-2")}>
          {isOpen ? (
            <div className="flex items-center gap-3">
              <button 
                className={cn(
                  "w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm hover:from-blue-600 hover:to-purple-700 transition-colors",
                )}
                onClick={() => {/* Handle profile click */}}
              >
                JD
              </button>
              <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-medium truncate", isDarkMode ? "text-slate-100" : "text-slate-900")}>
                  John Doe
                </div>
                <div className={cn("text-xs truncate", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                  john.doe@example.com
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/settings">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8 flex-shrink-0", isDarkMode && "hover:bg-slate-800 text-slate-200")}
                    >
                      <Settings size={16} />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className={`pointer-events-auto ${isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}`}
                >
                  <span>Settings</span>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={cn(
                    "w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm hover:from-blue-600 hover:to-purple-700 transition-colors mx-auto",
                  )}
                  onClick={() => {/* Handle profile click */}}
                >
                  JD
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                John Doe
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Message } from "@/types/chat";
import {
  X, Plus, ChevronLeft, ChevronRight, Filter,
  Sparkles, Star, MessageSquare, Settings,
  Brain, Palette, Code2, Lightbulb, PlusCircle, Trash2, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { FilterTag } from "@/types/chat";

interface ChatHistory {
  id: string;
  messages: Message[];
  folderId: string;
  title: string;
  updatedAt: number;
}

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  starredMessages: Message[];
  messages: Message[];
  onToggleStar: (messageId: string) => void;
  onMessageClick: (messageId: string) => void;
  onNewChat?: () => void;
  // Chat history props
  chatHistories?: ChatHistory[];
  currentChatId?: string;
  onLoadChat?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
}

const Sidebar = ({
  isOpen,
  toggleSidebar,
  starredMessages,
  messages,
  onToggleStar,
  onMessageClick,
  onNewChat,
  chatHistories = [],
  currentChatId,
  onLoadChat,
  onDeleteChat,
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
    } catch {
      return [
        { id: "1", label: "Learning", type: "category" },
        { id: "2", label: "Creative", type: "visual" },
        { id: "3", label: "Code Help", type: "category" },
      ];
    }
  });

  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(() => {
    try { return localStorage.getItem("selectedModel") || "sonar"; }
    catch { return "sonar"; }
  });

  const models = [
    { name: "sonar", icon: Brain, color: "text-emerald-600" },
    { name: "sonar-pro", icon: Sparkles, color: "text-purple-600" },
    { name: "sonar-reasoning", icon: Star, color: "text-blue-600" },
    { name: "sonar-reasoning-pro", icon: Code2, color: "text-orange-600" },
    { name: "sonar-deep-research", icon: Brain, color: "text-green-600" },
  ];

  const { isDarkMode } = useTheme();
  const { currentUser, logout } = useAuth();

  const getFilterIcon = (type: string) => {
    switch (type) {
      case "visual": return Palette;
      case "category": return Brain;
      default: return Lightbulb;
    }
  };

  const saveFilters = (updated: FilterTag[]) => {
    setFilterTags(updated);
    try { localStorage.setItem("filters", JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const addFilter = () => {
    const newFilter: FilterTag = { id: Date.now().toString(), label: "", type: "category" };
    const updated = [...filterTags, newFilter];
    saveFilters(updated);
    setEditingFilterId(newFilter.id);
  };

  const updateFilterLabel = (id: string, label: string) => {
    saveFilters(filterTags.map(f => f.id === id ? { ...f, label } : f));
  };

  const finishEditingFilter = (id: string) => {
    const filter = filterTags.find(f => f.id === id);
    if (filter && !filter.label.trim()) removeFilter(id);
    setEditingFilterId(null);
  };

  const removeFilter = (id: string) => {
    saveFilters(filterTags.filter(t => t.id !== id));
  };

  const selectModel = (model: string) => {
    setSelectedModel(model);
    try { localStorage.setItem("selectedModel", model); } catch { /* ignore */ }
  };

  const currentModel = models.find(m => m.name === selectedModel) || models[0];

  const handleLogout = async () => {
    try { await logout(); } catch { /* handled in context */ }
  };

  const userInitials = currentUser?.username
    ? currentUser.username.slice(0, 2).toUpperCase()
    : "JD";
  const userDisplayName = currentUser?.username || "John Doe";
  const userEmail = currentUser?.email || "john.doe@example.com";

  return (
    <>
      <div
        className={cn(
          "relative transition-all duration-300 ease-in-out flex flex-col h-full",
          isDarkMode ? "bg-slate-900 border-r border-slate-700 text-slate-200" : "bg-white border-r border-slate-200",
          isOpen ? "w-72" : "w-16"
        )}
      >
        {/* ── Header: New Chat + Toggle ── */}
        <div className={cn("p-3 border-b flex-shrink-0", isDarkMode ? "border-slate-700" : "border-slate-100")}>
          {isOpen ? (
            <div className="flex items-center gap-2">
              <button
                className={cn(
                  "group relative flex-1 flex items-center gap-2 h-10 px-3 rounded-xl font-medium text-sm transition-all duration-300",
                  "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500",
                  "text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                )}
                onClick={onNewChat}
                aria-label="Start new chat"
              >
                <PlusCircle size={16} className="group-hover:rotate-90 transition-transform duration-300 flex-shrink-0" />
                <span className="font-semibold">New Chat</span>
              </button>
              <Button
                variant="ghost" size="icon"
                className={cn("h-8 w-8 flex-shrink-0", isDarkMode && "hover:bg-slate-800")}
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group"
                onClick={onNewChat}
                aria-label="New chat"
              >
                <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
              <Button
                variant="ghost" size="icon"
                className={cn("h-8 w-8 flex-shrink-0", isDarkMode && "hover:bg-slate-800")}
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>

        {/* ── Chat History List ── */}
        {isOpen && (
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            <div className="px-3 pt-3 pb-1">
              <span className={cn("text-xs font-semibold uppercase tracking-wider", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                Recent Chats
              </span>
            </div>

            {chatHistories.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <MessageSquare size={24} className={cn("mx-auto mb-2", isDarkMode ? "text-slate-600" : "text-slate-300")} />
                <p className={cn("text-xs", isDarkMode ? "text-slate-500" : "text-muted-foreground")}>
                  No chats yet. Start one!
                </p>
              </div>
            ) : (
              <div className="px-2 pb-2 space-y-0.5">
                {chatHistories.map(chat => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                      chat.id === currentChatId
                        ? isDarkMode
                          ? "bg-slate-800 border-l-2 border-blue-400 pl-[10px]"
                          : "bg-blue-50 border-l-2 border-blue-500 pl-[10px]"
                        : isDarkMode
                          ? "hover:bg-slate-800 border-l-2 border-transparent pl-[10px]"
                          : "hover:bg-slate-100 border-l-2 border-transparent pl-[10px]"
                    )}
                    onClick={() => onLoadChat?.(chat.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === "Enter") onLoadChat?.(chat.id); }}
                  >
                    <span className={cn(
                      "truncate flex-1 text-xs leading-5",
                      chat.id === currentChatId
                        ? isDarkMode ? "text-slate-100 font-medium" : "text-slate-900 font-medium"
                        : isDarkMode ? "text-slate-300" : "text-slate-700"
                    )}>
                      {chat.title}
                    </span>

                    {onDeleteChat && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ml-1 flex-shrink-0",
                              isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-200"
                            )}
                            onClick={e => e.stopPropagation()}
                            aria-label="Chat options"
                          >
                            <MoreHorizontal size={13} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={e => {
                              e.stopPropagation();
                              onDeleteChat(chat.id);
                            }}
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Spacer — only when sidebar is collapsed (icon-only mode) */}
        {!isOpen && <div className="flex-1" />}

        {/* ── Model Selector ── */}
        <div className={cn("px-3 flex-shrink-0", !isOpen && "px-2")}>
          <Separator className={isDarkMode ? "bg-slate-700" : ""} />
        </div>

        <div className={cn("p-3 flex-shrink-0", !isOpen && "px-2")} data-tour-element="ai-model-section">
          {isOpen && (
            <div className="flex items-center gap-2 mb-2">
              <currentModel.icon size={13} className={currentModel.color} />
              <span className={cn("text-xs font-semibold uppercase tracking-wider", isDarkMode ? "text-slate-400" : "text-slate-500")}>AI Model</span>
            </div>
          )}
          <div className="space-y-0.5">
            {models.map(model => (
              <Tooltip key={model.name}>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedModel === model.name ? "default" : "ghost"}
                    size={isOpen ? "sm" : "icon"}
                    className={cn(
                      "w-full transition-colors h-8",
                      isOpen ? "justify-start gap-2" : "justify-center",
                      selectedModel === model.name
                        ? isDarkMode ? "bg-blue-700 text-white border-blue-600 hover:bg-blue-600" : "bg-blue-50 text-blue-700 border-blue-200"
                        : isDarkMode ? "hover:bg-slate-800 text-slate-200" : ""
                    )}
                    onClick={() => selectModel(model.name)}
                  >
                    <model.icon size={13} className={model.color} />
                    {isOpen && <span className="truncate text-xs">{model.name}</span>}
                  </Button>
                </TooltipTrigger>
                {!isOpen && (
                  <TooltipContent side="right" className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                    {model.name}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        </div>

        {/* ── User Profile ── */}
        <div className={cn("px-3 flex-shrink-0", !isOpen && "px-2")}>
          <Separator className={isDarkMode ? "bg-slate-700" : ""} />
        </div>

        <div className={cn("p-3 flex-shrink-0", !isOpen && "px-2")}>
          {isOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-medium truncate", isDarkMode ? "text-slate-100" : "text-slate-900")}>{userDisplayName}</div>
                <div className={cn("text-xs truncate", isDarkMode ? "text-slate-400" : "text-slate-500")}>{userEmail}</div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/settings">
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 flex-shrink-0", isDarkMode && "hover:bg-slate-800 text-slate-200")} aria-label="Settings">
                      <Settings size={15} />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className={`pointer-events-auto ${isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}`}>
                  <Button size="sm" variant="ghost" onClick={handleLogout} className="text-destructive hover:text-destructive">
                    Logout
                  </Button>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs mx-auto cursor-pointer">
                  {userInitials}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                {userDisplayName}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;

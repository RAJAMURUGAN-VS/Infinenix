import React, { useState, useEffect, useMemo } from "react";
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
  ChevronLeft, ChevronRight,
  MessageSquare, Settings,
  PlusCircle, Trash2, MoreHorizontal,
  Folder, FolderOpen, ChevronDown, ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

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
  chatHistories?: ChatHistory[];
  currentChatId?: string;
  onLoadChat?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  onMoveChatToFolder?: (chatId: string, folderId: string) => void;
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
  onMoveChatToFolder,
}: SidebarProps) => {
  const { isDarkMode } = useTheme();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try { await logout(); } catch { /**/ }
  };

  const isDragging = React.useRef(false);

  React.useEffect(() => {
    const handleDragStart = () => { isDragging.current = true; };
    const handleDragEnd = () => { setTimeout(() => { isDragging.current = false; }, 200); };
    window.addEventListener('appDragStart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);
    return () => {
      window.removeEventListener('appDragStart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  // ── Drag handlers (drag SOURCE only — drop targets are in History modal) ──
  const handleDragStart = (e: React.DragEvent, chatId: string) => {
    e.dataTransfer.setData("chatId", chatId);
    e.dataTransfer.effectAllowed = "move";
    window.dispatchEvent(new Event('appDragStart'));
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
          isDarkMode
            ? "bg-slate-900 border-r border-slate-700 text-slate-200"
            : "bg-white border-r border-slate-200",
          isOpen ? "w-72" : "w-16"
        )}
      >
        {/* ── Header ── */}
        <div
          className={cn(
            "px-3 pt-6 pb-4 border-b flex-shrink-0",
            isDarkMode ? "border-slate-700" : "border-slate-100"
          )}
        >
          {isOpen ? (
            <div className="flex items-center gap-1">
              <button
                className="group relative flex-1 flex items-center gap-1.5 h-8 px-3 rounded-md text-sm text-white active:scale-[0.98] overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 transition-all duration-300"
                onClick={onNewChat}
                aria-label="Start new chat"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <PlusCircle
                  size={13}
                  className="relative flex-shrink-0 group-hover:rotate-90 transition-transform duration-300"
                />
                <span className="relative font-semibold text-xs">New Chat</span>
              </button>
              <button
                className={cn(
                  "h-8 w-8 flex-shrink-0 rounded-md flex items-center justify-center transition-colors",
                  isDarkMode
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                )}
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={15} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <button
                className="group h-8 w-8 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white active:scale-95 transition-all duration-300 flex items-center justify-center overflow-hidden"
                onClick={onNewChat}
                aria-label="New chat"
              >
                <PlusCircle
                  size={15}
                  className="group-hover:rotate-90 transition-transform duration-300"
                />
              </button>
              <button
                className={cn(
                  "h-8 w-8 rounded-md flex items-center justify-center transition-colors",
                  isDarkMode
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                )}
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>

        {/* ── Chat History (folder-grouped, drag-source only) ── */}
        {isOpen && (
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            <div className="px-3 pt-3 pb-1 flex items-center justify-between">
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                )}
              >
                Chats
              </span>
              <span
                className={cn(
                  "text-[10px]",
                  isDarkMode ? "text-slate-600" : "text-slate-400"
                )}
                title="Drag a chat to the History button to move it into a folder"
              >
                drag → History to move
              </span>
            </div>

            {chatHistories.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <MessageSquare
                  size={24}
                  className={cn(
                    "mx-auto mb-2",
                    isDarkMode ? "text-slate-600" : "text-slate-300"
                  )}
                />
                <p
                  className={cn(
                    "text-xs",
                    isDarkMode ? "text-slate-500" : "text-muted-foreground"
                  )}
                >
                  No chats yet. Start one!
                </p>
              </div>
            ) : (
              <div className="px-2 pb-2 space-y-0.5">
                {chatHistories.map((chat) => {
                  const isActive = chat.id === currentChatId;
                  return (
                    <div
                      key={chat.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, chat.id)}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing text-sm transition-colors select-none",
                        isActive
                          ? isDarkMode
                            ? "bg-slate-800 border-l-2 border-blue-400 pl-[10px]"
                            : "bg-gradient-to-r from-blue-50 to-purple-50 border-l-2 border-blue-400 pl-[10px]"
                          : isDarkMode
                            ? "hover:bg-slate-800 border-l-2 border-transparent pl-[10px]"
                            : "hover:bg-slate-100 border-l-2 border-transparent pl-[10px]"
                      )}
                      onClick={() => {
                        if (isDragging.current) return;
                        onLoadChat?.(chat.id);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onLoadChat?.(chat.id);
                      }}
                      title="Drag to History button to move to a folder"
                    >
                      <span
                        className={cn(
                          "truncate flex-1 text-xs leading-5",
                          isActive
                            ? isDarkMode
                              ? "text-slate-100 font-medium"
                              : "text-slate-900 font-medium"
                            : isDarkMode
                              ? "text-slate-300"
                              : "text-slate-700"
                        )}
                      >
                        {chat.title}
                      </span>

                      {onDeleteChat && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ml-1 flex-shrink-0",
                                isDarkMode
                                  ? "hover:bg-slate-700"
                                  : "hover:bg-slate-200"
                              )}
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Chat options"
                            >
                              <MoreHorizontal size={13} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className={
                              isDarkMode
                                ? "bg-slate-700 border-slate-600 text-slate-200"
                                : ""
                            }
                          >
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={(e) => {
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
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!isOpen && <div className="flex-1" />}

        {/* ── User Profile ── */}
        <div className={cn("px-3 flex-shrink-0", !isOpen && "px-2")}>
          <Separator className={isDarkMode ? "bg-slate-700" : ""} />
        </div>

        <div className={cn("p-3 flex-shrink-0", !isOpen && "px-2")}>
          {isOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "text-sm font-medium truncate",
                    isDarkMode ? "text-slate-100" : "text-slate-900"
                  )}
                >
                  {userDisplayName}
                </div>
                <div
                  className={cn(
                    "text-xs truncate",
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  {userEmail}
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/settings">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 flex-shrink-0",
                        isDarkMode && "hover:bg-slate-800 text-slate-200"
                      )}
                      aria-label="Settings"
                    >
                      <Settings size={15} />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className={`pointer-events-auto ${
                    isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""
                  }`}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-destructive hover:text-destructive"
                  >
                    Logout
                  </Button>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-xs mx-auto cursor-pointer">
                  {userInitials}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className={
                  isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""
                }
              >
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
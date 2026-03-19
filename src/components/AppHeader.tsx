import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, MessageSquare, History, BookOpen, Folder, Plus, FolderOpen, Edit3, Check, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StepType, TourProvider } from '@reactour/tour';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "@/components/Icons";
import LibraryModal from './LibraryModal';
import Cube3DIcon from './Cube3DIcon';
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { StartTourButton } from "./StartTourButton";

interface AppHeaderProps {
  messages: Message[];
  onLoadChat: (chatId: string) => void;
  currentChatId: string;
  onNewChat: () => void;
  selectedDomain?: {
    id: string;
    label: string;
    icon: React.ReactNode;
    description: string;
  };
}

interface ChatFolder {
  id: string;
  name: string;
  chats: { id: string; messages: Message[] }[];
  createdAt: string;
}

const AppHeader = ({ messages, onLoadChat, currentChatId, onNewChat, selectedDomain }: AppHeaderProps) => {
  const getActiveFolder = () => {
    return localStorage.getItem('activeFolderId') || 'default';
  };

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [foldersVersion, setFoldersVersion] = useState(0);
  const [selectedFolderId, setSelectedFolderId] = useState(getActiveFolder());
  const [currentChatFolderId, setCurrentChatFolderId] = useState<string>('default');
  // Drag-and-drop state
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const isDragging = React.useRef(false);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  // Reset drag state if user aborts a drag (releases mouse outside)
  React.useEffect(() => {
    const handleDragStart = () => {
      isDragging.current = true;
    };
    const handleDragEnd = () => {
      // Delay false so the immediate post-drag click gets ignored
      setTimeout(() => { isDragging.current = false; }, 200);
    };
    window.addEventListener('appDragStart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);
    return () => {
      window.removeEventListener('appDragStart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  React.useEffect(() => {
    setIsHistoryOpen(false); // Close modal when navigating between chats
    if (currentChatId) {
      const chatData = localStorage.getItem(`chat_${currentChatId}`);
      if (chatData) {
        try {
          const parsedData = JSON.parse(chatData);
          setCurrentChatFolderId(parsedData.folderId || 'default');
        } catch {
          setCurrentChatFolderId('default');
        }
      }
    }
  }, [currentChatId]);

  const { folders, unorganizedChats } = useMemo(() => {
    const savedFolders = JSON.parse(localStorage.getItem('chatFolders') || '[]') as ChatFolder[];

    const defaultFolder: ChatFolder = {
      id: 'default',
      name: 'General',
      chats: [],
      createdAt: new Date().toISOString()
    };

    const allChats: { id: string; messages: Message[]; folderId?: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('chat_')) {
        const chatId = key.replace('chat_', '');
        const chatData = localStorage.getItem(key);
        if (chatData) {
          const parsedData = JSON.parse(chatData);
          if (parsedData.messages && Array.isArray(parsedData.messages)) {
            allChats.push({ id: chatId, messages: parsedData.messages, folderId: parsedData.folderId || 'default' });
          } else {
            allChats.push({ id: chatId, messages: parsedData, folderId: 'default' });
          }
        }
      }
    }

    const foldersMap = new Map<string, ChatFolder>();
    foldersMap.set('default', defaultFolder);
    savedFolders.forEach(folder => {
      foldersMap.set(folder.id, { ...folder, chats: [] });
    });

    allChats.sort((a, b) => {
      const aTime = new Date(a.messages[0]?.timestamp || 0).getTime();
      const bTime = new Date(b.messages[0]?.timestamp || 0).getTime();
      return bTime - aTime;
    });

    allChats.forEach(chat => {
      const folderId = chat.folderId || 'default';
      const folder = foldersMap.get(folderId);
      if (folder) {
        folder.chats.push({ id: chat.id, messages: chat.messages });
      }
    });

    return { folders: Array.from(foldersMap.values()), unorganizedChats: [] };
  }, [messages, selectedFolderId, foldersVersion]);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: ChatFolder = {
        id: Date.now().toString(),
        name: newFolderName.trim(),
        chats: [],
        createdAt: new Date().toISOString()
      };
      const savedFolders = JSON.parse(localStorage.getItem('chatFolders') || '[]');
      savedFolders.push(newFolder);
      localStorage.setItem('chatFolders', JSON.stringify(savedFolders));
      setNewFolderName("");
      setIsCreatingFolder(false);
      setFoldersVersion(v => v + 1);
    }
  };

  const handleEditFolder = (folderId: string, newName: string) => {
    if (newName.trim() && folderId !== 'default') {
      const savedFolders = JSON.parse(localStorage.getItem('chatFolders') || '[]');
      const updatedFolders = savedFolders.map((folder: ChatFolder) =>
        folder.id === folderId ? { ...folder, name: newName.trim() } : folder
      );
      localStorage.setItem('chatFolders', JSON.stringify(updatedFolders));
      setEditingFolderId(null);
      setEditingFolderName("");
      setFoldersVersion(v => v + 1);
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (folderId === 'default') return;
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      folder.chats.forEach(chat => {
        const chatData = { messages: chat.messages, folderId: 'default' };
        localStorage.setItem(`chat_${chat.id}`, JSON.stringify(chatData));
      });
    }
    const savedFolders = JSON.parse(localStorage.getItem('chatFolders') || '[]');
    const updatedFolders = savedFolders.filter((folder: ChatFolder) => folder.id !== folderId);
    localStorage.setItem('chatFolders', JSON.stringify(updatedFolders));
    if (selectedFolderId === folderId) {
      setSelectedFolderId('default');
      localStorage.setItem('activeFolderId', 'default');
    }
    setFoldersVersion(v => v + 1);
  };

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
  };

  // ── Drag-and-drop helpers ──
  const handleChatDragStart = (e: React.DragEvent, chatId: string) => {
    e.dataTransfer.setData('chatId', chatId);
    e.dataTransfer.effectAllowed = 'move';
    isDragging.current = true;
    window.dispatchEvent(new Event('appDragStart'));
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleFolderDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleFolderDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const chatId = e.dataTransfer.getData('chatId');
    if (chatId) {
      // Move the chat to the target folder
      const raw = localStorage.getItem(`chat_${chatId}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const updatedData = { messages: parsed.messages ?? parsed, folderId: targetFolderId };
          localStorage.setItem(`chat_${chatId}`, JSON.stringify(updatedData));
          // Notify other components (e.g. Sidebar) via storage event
          window.dispatchEvent(new StorageEvent('storage', { key: `chat_${chatId}` }));
          setFoldersVersion(v => v + 1);
        } catch { /**/ }
      }
    }
    setDragOverFolderId(null);
    isDragging.current = false;
    // Don't auto-close; let user see result
  };

  const handleLoadChat = (chatId: string) => {
    // If a drag literally just finished, ignore the click so we don't accidentally navigate
    if (isDragging.current) return;

    if (messages.length > 0 && currentChatId && currentChatId !== chatId) {
      const raw = localStorage.getItem(`chat_${currentChatId}`);
      let chatData: any = { messages: messages, folderId: currentChatFolderId };
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          chatData = { ...parsed, messages: messages, folderId: currentChatFolderId };
        } catch { /**/ }
      }
      localStorage.setItem(`chat_${currentChatId}`, JSON.stringify(chatData));
    }
    const chatData = localStorage.getItem(`chat_${chatId}`);
    if (chatData) {
      try {
        const parsedData = JSON.parse(chatData);
        setSelectedFolderId(parsedData.folderId || 'default');
        setCurrentChatFolderId(parsedData.folderId || 'default');
      } catch {
        setSelectedFolderId('default');
        setCurrentChatFolderId('default');
      }
    }
    onLoadChat(chatId);
  };

  const handleNewChat = () => {
    if (messages.length > 0 && currentChatId) {
      const raw = localStorage.getItem(`chat_${currentChatId}`);
      let chatData: any = { messages: messages, folderId: currentChatFolderId };
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          chatData = { ...parsed, messages: messages, folderId: currentChatFolderId };
        } catch { /**/ }
      }
      localStorage.setItem(`chat_${currentChatId}`, JSON.stringify(chatData));
    }
    setCurrentChatFolderId(selectedFolderId);
    localStorage.setItem('newChatFolderId', selectedFolderId);
    onNewChat();
  };

  const steps: StepType[] = [
    {
      selector: '[data-tour-element="chracter-showcase-button"]',
      content: 'Explore the character showcase. Click to view available characters.',
    },
    {
      selector: '[data-tour-element="filter-section"]',
      content: 'Filter your chat history by domain or type. Click to open filter options.'
    },
    {
      selector: '[data-tour-element="ai-model-section"]',
      content: 'Select the AI model for your chat. Click to choose a different model.',
    },
    {
      selector: '[data-tour-element="prompt-input"]',
      content: 'Type your message here. Press Enter to send.',
    },
    {
      selector: '[data-tour-element="history-button"]',
      content: 'Used to find history of your chats. Click to open chat history.',
    },
    {
      selector: '[data-tour-element="library-button"]',
      content: 'Access the library of prompts and resources. Click to open the library modal.'
    },
  ];

  return (
    <TourProvider steps={steps} styles={{
      maskArea: (base) => ({ ...base, rx: 8 }),
      popover: (base) => ({
        ...base,
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '20px',
        margin: '13px',
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      }),
      badge: (base) => ({ ...base, backgroundColor: '#9333ea', color: 'white' }),
      close: (base) => ({ ...base, color: 'white' }),
    }}>
      {/* FIX 11: removed backdrop-blur-md shadow-sm, kept border */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 border-b border-border/40 bg-background transition-colors duration-200">
        {/* Left — Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* FIX 1: flat violet, no shadow */}
            <div className="bg-violet-600 p-2.5 rounded-xl flex items-center justify-center text-white">
              <MessageSquare size={20} />
            </div>
            <div className="hidden sm:block">
              {/* FIX 2: plain text, corrected spelling */}
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Infenix
              </h1>
              <p className="text-xs text-muted-foreground">Intelligent Assistant</p>
            </div>
          </div>
        </div>

        <StartTourButton />

        {/* Center — Navigation */}
        <div className="flex items-center gap-2">
          <DropdownMenu
            open={isHistoryOpen}
            onOpenChange={(open) => {
              setIsHistoryOpen(open);
              if (!open) setSelectedFolderId(currentChatFolderId);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-4"
                data-tour-element="history-button"
                // Auto-open when a sidebar chat is dragged over this button
                onDragEnter={() => {
                  isDragging.current = true;
                  setIsHistoryOpen(true);
                }}
              >
                <Folder size={16} />
                <span className="hidden sm:inline">Folders</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="w-[380px] p-0"
              onInteractOutside={(e) => {
                const target = e.target as HTMLElement;
                if (!target || !target.closest) return;

                // If a drag is anywhere in progress, absolutely do not close
                if (isDragging.current) {
                  e.preventDefault();
                } 
                // If pressing down on a draggable item anywhere (like the sidebar), 
                // keep open until we know if it's a real drag or just a click.
                else if (
                  target.closest('.sidebar-chat-item') || 
                  target.closest('[draggable]')
                ) {
                  e.preventDefault();
                }
              }}
              onCloseAutoFocus={e => e.preventDefault()}
            >
              {/* FIX 3: flat violet-50 header */}
              <div className="flex items-center justify-between p-4 border-b bg-violet-50 dark:bg-violet-950/30">
                <h3 className="font-semibold text-base">Folders</h3>
              </div>

              {/* Folder Management */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Folders</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreatingFolder(true)}
                    className="h-7 w-7 p-0 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-full transition-colors"
                  >
                    <Plus size={14} />
                  </Button>
                </div>

                {isCreatingFolder && (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name"
                      className="h-8 text-sm bg-white dark:bg-gray-800"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateFolder();
                        if (e.key === 'Escape') { setIsCreatingFolder(false); setNewFolderName(""); }
                      }}
                      autoFocus
                    />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full transition-colors" onClick={handleCreateFolder}>
                      <Check size={14} className="text-green-600" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors" onClick={() => { setIsCreatingFolder(false); setNewFolderName(""); }}>
                      <X size={14} className="text-red-600" />
                    </Button>
                  </div>
                )}

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-200 group",
                        dragOverFolderId === folder.id
                          ? "bg-violet-100 dark:bg-violet-900/40 ring-2 ring-violet-400 dark:ring-violet-500 scale-[1.01]"
                          : selectedFolderId === folder.id
                            ? "bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800/50"
                      )}
                      onClick={() => handleSelectFolder(folder.id)}
                      onDragOver={e => handleFolderDragOver(e, folder.id)}
                      onDragLeave={handleFolderDragLeave}
                      onDrop={e => handleFolderDrop(e, folder.id)}
                    >
                      <div className="flex items-center gap-2.5">
                        {selectedFolderId === folder.id ? (
                          // FIX 6: no drop-shadow, no animate-pulse
                          <FolderOpen size={16} className="text-violet-600 dark:text-violet-400" />
                        ) : (
                          <Folder size={16} className="text-muted-foreground" />
                        )}

                        {editingFolderId === folder.id ? (
                          <Input
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            className="h-7 text-sm w-32 bg-white dark:bg-gray-800"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditFolder(folder.id, editingFolderName);
                              if (e.key === 'Escape') { setEditingFolderId(null); setEditingFolderName(""); }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className={cn(
                            "text-sm font-medium",
                            // FIX 5: violet text
                            selectedFolderId === folder.id ? "text-violet-700 dark:text-violet-400 font-semibold" : "text-foreground"
                          )}>
                            {folder.name}
                          </span>
                        )}

                        <Badge variant="secondary" className="h-5 px-1.5 text-xs font-medium">
                          {folder.chats.length}
                        </Badge>
                      </div>

                      {folder.id !== 'default' && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {editingFolderId === folder.id ? (
                            <>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full transition-colors"
                                onClick={(e) => { e.stopPropagation(); handleEditFolder(folder.id, editingFolderName); }}>
                                <Check size={12} className="text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
                                onClick={(e) => { e.stopPropagation(); setEditingFolderId(null); setEditingFolderName(""); }}>
                                <X size={12} className="text-red-600" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-full transition-colors"
                                onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}>
                                <Edit3 size={12} className="text-violet-600" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
                                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}>
                                <X size={12} className="text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat History for Active Folder */}
              <div className="max-h-[300px] overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {folders.find(f => f.id === selectedFolderId)?.name || 'General'} Chats
                    </span>
                  </div>

                  {folders.find(f => f.id === selectedFolderId)?.chats.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      No chats in this folder
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {folders.find(f => f.id === selectedFolderId)?.chats.map((chat) => {
                        const firstMessage = chat.messages[0];
                        const lastMessage = chat.messages[chat.messages.length - 1];
                        return (
                          <div
                            key={chat.id}
                            draggable
                            onDragStart={e => handleChatDragStart(e, chat.id)}
                            onDragEnd={() => { setDragOverFolderId(null); }}
                            className={cn(
                              "flex flex-col items-start p-3 cursor-grab active:cursor-grabbing rounded-lg select-none transition-colors",
                              currentChatId === chat.id
                                ? "bg-violet-50 dark:bg-violet-900/20"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                            )}
                            onClick={() => handleLoadChat(chat.id)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <MessageSquare size={14} className="text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium line-clamp-1">
                                {firstMessage?.content.length > 30
                                  ? firstMessage.content.substring(0, 30) + '...'
                                  : firstMessage?.content || 'New Chat'}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground ml-6 mt-0.5">
                              {lastMessage?.timestamp
                                ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'No messages'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-2 px-4"
            data-tour-element="library-button"
          >
            <BookOpen size={16} />
            <span className="hidden sm:inline">Library</span>
          </Button>

          {/* FIX 8: Domain display button — flat violet */}
          {selectedDomain ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200/60 dark:border-violet-800/50 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
            >
              <ArrowLeft size={14} className="text-violet-600 dark:text-violet-400" />
              <div className="flex items-center gap-2">
                {selectedDomain.icon}
                <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                  {selectedDomain.label}
                </span>
              </div>
            </Button>
          ) : (
            // FIX 9: hover violet
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/DomainSelector")}
              className="flex items-center gap-2 px-4 hover:bg-violet-50 dark:hover:bg-violet-900/50 transition-colors"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Select Domain</span>
            </Button>
          )}
        </div>

        {/* Right — User Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 p-0 [&_svg]:!size-8"
            onClick={() => navigate("/DomainSelector")}
          >
            <Cube3DIcon />
          </Button>

          {/* FIX 10: flat violet button with User icon instead of robot emoji */}
          <button
            className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white hover:bg-violet-700 transition-colors cursor-pointer"
            onClick={() => navigate("/CharacterShowcase")}
            data-tour-element="chracter-showcase-button"
            aria-label="Character showcase"
          >
            <User size={16} />
          </button>
        </div>
      </header>

      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />
    </TourProvider>
  );
};

export default AppHeader;
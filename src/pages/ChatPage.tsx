import { useState, useEffect, useCallback, useRef } from "react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import MessageInput from "@/components/MessageInput";
import { useChatLogic } from "@/hooks/useChatLogic";
import { useLocation } from "react-router-dom";

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const location = useLocation();

  const {
    messages,
    isLoading,
    chatLoading,
    handleSendMessage,
    handleRetry,
    handleTextToSpeech,
    toggleStarMessage,
    handleNewChat,
    loadChat,
    deleteChat,
    moveChatToFolder,
    currentChatId,
    starredMessages,
    currentlyPlaying,
    getChatHistories,
  } = useChatLogic();

  useEffect(() => {
    if (location.state?.domain) {
      setSelectedDomain({
        id: location.state.domain.id,
        label: location.state.domain.label,
        icon: location.state.domain.icon,
        description: location.state.domain.description,
      });
    }
  }, [location.state]);

  // Reload once on first visit so the browser fully calculates the scroll
  // container height. requestAnimationFrame defers until after first paint
  // so the page renders visually before the reload fires — no blank flash.
  const didReload = useRef(false);
  useEffect(() => {
    if (didReload.current) return;
    didReload.current = true;
    const KEY = "infenix_chat_reloaded";
    if (!sessionStorage.getItem(KEY)) {
      sessionStorage.setItem(KEY, "1");
      requestAnimationFrame(() => window.location.reload());
    } else {
      sessionStorage.removeItem(KEY);
    }
  }, []);

  const handleChipClick = useCallback((text: string) => {
    setInputText(text);
  }, []);

  const chatHistories = getChatHistories();

  // Sidebar width — must match Sidebar's w-72 (288px) / w-16 (64px)
  const sidebarWidth = isSidebarOpen ? 288 : 64;

  return (
    <div className="h-screen overflow-hidden bg-background">

      {/* Fixed header — z-50 always on top */}
      <AppHeader
        messages={messages}
        onLoadChat={loadChat}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        selectedDomain={selectedDomain}
      />

      {/* Fixed sidebar — below header, z-40 */}
      <div
        className="fixed left-0 top-[65px] bottom-0 z-40 transition-all duration-300"
        style={{ width: sidebarWidth }}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen((v) => !v)}
          starredMessages={starredMessages}
          messages={messages}
          onToggleStar={toggleStarMessage}
          onMessageClick={() => {}}
          onNewChat={handleNewChat}
          chatHistories={chatHistories}
          currentChatId={currentChatId}
          onLoadChat={loadChat}
          onDeleteChat={deleteChat}
          onMoveChatToFolder={moveChatToFolder}
        />
      </div>

      {/* Main column — pushed right of sidebar, below header */}
      <div
        className="flex flex-col h-screen pt-[65px] overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* THE scroll container — only element that scrolls */}
        <div
          key={currentChatId}
          id="chat-scroll-container"
          className="flex-1 min-h-0 overflow-y-auto"
        >
          <ChatArea
            messages={messages}
            isLoading={isLoading}
            chatLoading={chatLoading}
            onToggleStar={toggleStarMessage}
            onPlayMessage={handleTextToSpeech}
            currentlyPlaying={currentlyPlaying}
            onRetry={handleRetry}
            onChipClick={handleChipClick}
            selectedDomain={selectedDomain}
            onPromptClick={handleChipClick}
          />
        </div>

        {/* Input bar — natural bottom of flex column */}
        <MessageInput
          onSendMessage={handleSendMessage}
          inputText={inputText}
          setInputText={setInputText}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
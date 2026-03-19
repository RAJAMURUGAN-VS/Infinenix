// pages/ChatPage.tsx
import { useState, useEffect, useCallback } from "react";
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
    currentChatId,
    starredMessages,
    currentlyPlaying,
    getChatHistories,
  } = useChatLogic();

  // Load selected domain from location state
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

  // Initial load auto-reload: Every single time the user visits the page, do a hard reload exactly once.
  useEffect(() => {
    const isReloading = sessionStorage.getItem('isReloadingChat');
    if (!isReloading) {
      // First time visiting or entering this session: set flag and force hard reload
      sessionStorage.setItem('isReloadingChat', 'true');
      window.location.reload();
    } else {
      // We just hard reloaded. Clear the flag so the NEXT time they visit, it will hard reload again.
      sessionStorage.removeItem('isReloadingChat');
    }
  }, []);

  // Fill textarea when a suggestion chip is clicked (no auto-send)
  const handleChipClick = useCallback((text: string) => {
    setInputText(text);
  }, []);

  const chatHistories = getChatHistories();

  return (
    <div className="flex flex-col h-screen min-h-0 bg-background">
      <AppHeader
        messages={messages}
        onLoadChat={loadChat}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        selectedDomain={selectedDomain}
      />

      <div className="flex flex-row flex-1 min-h-0 pt-20">
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
        />

        <div className="flex-1 flex flex-col min-h-0">
          {/* key={currentChatId} remounts ChatArea on chat switch → triggers fade-in animation */}
          <div
            key={currentChatId}
            className="flex-grow overflow-y-auto min-h-0 animate-in fade-in duration-200"
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

          <MessageInput
            onSendMessage={handleSendMessage}
            inputText={inputText}
            setInputText={setInputText}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

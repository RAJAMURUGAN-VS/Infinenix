// pages/ChatPage.tsx
import { useState, useEffect } from "react";
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
    handleSendMessage,
    handleTextToSpeech,
    toggleStarMessage,
    handleNewChat,
    loadChat,
    currentChatId,
    starredMessages,
    currentlyPlaying,
  } = useChatLogic();


  // Load selected domain from location state
  useEffect(() => {
    if (location.state?.domain) {
      setSelectedDomain({
        id: location.state.domain.id,
        label: location.state.domain.label,
        icon: location.state.domain.icon,
        description: location.state.domain.description
      });
    }
  }, [location.state]);

  const handlePromptClick = (prompt: string) => {
    setInputText(prompt);
  };

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
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          starredMessages={starredMessages}
          messages={messages}
          onToggleStar={toggleStarMessage}
          onMessageClick={() => {}}
          onNewChat={handleNewChat}
        />
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-grow overflow-y-auto min-h-0">
            <ChatArea
              messages={messages}
              isLoading={isLoading}
              onToggleStar={toggleStarMessage}
              onPlayMessage={handleTextToSpeech}
              currentlyPlaying={currentlyPlaying}
              selectedDomain={selectedDomain}
              onPromptClick={handlePromptClick}
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

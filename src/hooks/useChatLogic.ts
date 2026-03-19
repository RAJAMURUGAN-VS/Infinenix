// hooks/useChatLogic.ts
import { useState, useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import { ApiService, IntentResult } from "@/services/apiService";
import { CharacterService } from "../services/characterService";
import { PromptService } from "../services/promptService";
import { toast } from "sonner";

export interface CharacterData {
  characterId: number;
  name: string;
  role: string;
  systemPrompt: string;
  voiceId: string;
  lifeStage: {
    stage: string;
    description: string;
  };
}

export interface ParsedAIResponse {
  response: string;
  code: string;
}

export const useChatLogic = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string>(() => {
    return localStorage.getItem('currentChatId') || Date.now().toString();
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load character data on mount
  useEffect(() => {
    const character = CharacterService.getEngagedCharacter();
    if (character) {
      setCharacterData(character);
    }
  }, []);

  // Helper function to get active folder ID
  const getActiveFolderId = () => {
    return localStorage.getItem('activeFolderId') || 'default';
  };

  // Helper function to save chat with folder info
  const saveChatWithFolder = (chatId: string, chatMessages: Message[], folderId?: string) => {
    const targetFolderId = folderId || getActiveFolderId();
    const chatData = {
      messages: chatMessages,
      folderId: targetFolderId
    };
    localStorage.setItem(`chat_${chatId}`, JSON.stringify(chatData));
  };

  // Helper function to load chat data
  const loadChatData = (chatId: string) => {
    const savedData = localStorage.getItem(`chat_${chatId}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      // Handle both old format (just messages array) and new format (with folder info)
      if (Array.isArray(parsed)) {
        // Old format - just messages
        return { messages: parsed, folderId: 'default' };
      } else if (parsed.messages) {
        // New format - with folder info
        return { messages: parsed.messages, folderId: parsed.folderId || 'default' };
      }
    }
    return { messages: [], folderId: 'default' };
  };

  // Load messages for current chat
  useEffect(() => {
    const { messages: loadedMessages } = loadChatData(currentChatId);
    setMessages(loadedMessages);
  }, [currentChatId]);

  // Save messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      // Check if this is a new chat that should be saved to a specific folder
      const newChatFolderId = localStorage.getItem('newChatFolderId');
      if (newChatFolderId) {
        // Save to the designated folder and clear the designation
        saveChatWithFolder(currentChatId, messages, newChatFolderId);
        localStorage.removeItem('newChatFolderId');
      } else {
        // Save to current active folder or maintain existing folder
        const existingData = loadChatData(currentChatId);
        saveChatWithFolder(currentChatId, messages, existingData.folderId);
      }
    }
  }, [messages, currentChatId]);

  /**
   * Parses AI response, attempting JSON first, falling back to raw content
   */
  const parseAIResponse = (rawContent: string): ParsedAIResponse => {
    try {
      const jsonStart = rawContent.indexOf("{");
      const jsonString = jsonStart >= 0 ? rawContent.slice(jsonStart) : rawContent;
      return JSON.parse(jsonString);
    } catch (err) {
      console.warn("Failed to parse AI response as JSON, using raw content.", err);
      return { response: rawContent, code: "" };
    }
  };

  /**
   * Handles the complete message sending flow
   */
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const newMessage: Message = {
      id: `${currentChatId}-${Date.now()}`,
      content,
      sender: "user",
      timestamp: new Date(),
      starred: false
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Classify intent
      const intent = await ApiService.classifyIntent(content);
      const threshold = 0.3;

      // Determine system prompt based on intent
      let systemPrompt: string;
      let shouldShowIntentToast = false;

      if (intent.matched_intention && intent.confidence >= threshold) {
        systemPrompt = PromptService.createOptimizedSystemPrompt(intent);
        shouldShowIntentToast = true;
      } else {
        systemPrompt = PromptService.createCasualSystemPrompt(characterData);
      }

      // Get AI response
      const aiRawContent = await ApiService.getSonarResponse(content, systemPrompt);
      const aiParsed = parseAIResponse(aiRawContent);

      // Create AI message
      const aiMessage: Message = {
        id: `${currentChatId}-${Date.now() + 1}`,
        content:
          aiParsed.response +
          (aiParsed.code ? `\n\n### Render Code Below ###\n${aiParsed.code}` : ""),
        sender: "ai",
        timestamp: new Date(),
        starred: false
      };

      setMessages(prev => [...prev, aiMessage]);

      // Show intent detection toast if applicable
      if (shouldShowIntentToast) {
        toast.success(
          `🎯 Detected: ${intent.matched_intention} (${Math.round(intent.confidence * 100)}% confidence)`
        );
      }
    } catch (error) {
      console.error("Error handling message:", error);
      const errorMessage = error instanceof Error ? error.message : "Sorry, I couldn't process your request right now.";
      
      setMessages((prev) => [
        ...prev,
        {
          id: `${currentChatId}-${Date.now() + 1}`,
          content: errorMessage,
          sender: "ai",
          timestamp: new Date(),
          starred: false,
        },
      ]);
      toast.error("Failed to process your message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles text-to-speech conversion and playback
   */
  const handleTextToSpeech = async (messageId: string, content: string) => {
    if (currentlyPlaying === messageId) {
      // If currently playing this message, stop it
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setCurrentlyPlaying(null);
    } else {
      // If playing a different message, stop it first
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setCurrentlyPlaying(messageId);
      if (!characterData) {
        toast.error("Character data not loaded for text-to-speech.");
        setCurrentlyPlaying(null);
        return;
      }
      try {
        toast.info("Converting text to speech...");
        console.log("About to call convertToSpeech", { content, characterData });
        const audioBlob = await ApiService.convertToSpeech({
          text: content,
          character: {
            role: characterData.lifeStage.stage,
            voiceId: characterData.voiceId,
          }
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
        audioRef.current.play();
        audioRef.current.onended = () => {
          setCurrentlyPlaying(null);
          URL.revokeObjectURL(audioUrl);
        };
        audioRef.current.onerror = (error) => {
          console.error("Audio playback error:", error);
          toast.error("Failed to play audio.");
          setCurrentlyPlaying(null);
          URL.revokeObjectURL(audioUrl);
        };
      } catch (error) {
        console.error("Error during text-to-speech:", error);
        toast.error(`Failed to generate speech: ${error instanceof Error ? error.message : ''}`);
        setCurrentlyPlaying(null);
      }
    }
  };

  /**
   * Toggles starred status of a message
   */
  const toggleStarMessage = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, starred: !msg.starred } : msg
      )
    );

    const message = messages.find((msg) => msg.id === messageId);
    if (message) {
      toast[!message.starred ? "success" : "info"](
        !message.starred
          ? "Message starred and saved to your collection"
          : "Message removed from starred collection"
      );
    }
  };

  const handleNewChat = () => {
    // Generate new chat ID
    const newChatId = Date.now().toString();
    
    // Save current chat if it has messages
    if (messages.length > 0) {
      const existingData = loadChatData(currentChatId);
      saveChatWithFolder(currentChatId, messages, existingData.folderId);
    }
    
    // Update current chat ID and clear messages
    setCurrentChatId(newChatId);
    localStorage.setItem('currentChatId', newChatId);
    setMessages([]);
  };

  const loadChat = (chatId: string) => {
    // Save current chat if it has messages
    if (messages.length > 0) {
      const existingData = loadChatData(currentChatId);
      saveChatWithFolder(currentChatId, messages, existingData.folderId);
    }
    
    // Load the selected chat
    setCurrentChatId(chatId);
    localStorage.setItem('currentChatId', chatId);
    
    // Load messages for the selected chat
    const { messages: loadedMessages } = loadChatData(chatId);
    setMessages(loadedMessages);
  };

  // Get all chat histories with folder information
  const getChatHistories = () => {
    const histories: { id: string; messages: Message[]; folderId: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('chat_')) {
        const chatId = key.replace('chat_', '');
        const { messages, folderId } = loadChatData(chatId);
        if (messages.length > 0) {
          histories.push({
            id: chatId,
            messages,
            folderId
          });
        }
      }
    }
    return histories;
  };

  return {
    messages,
    isLoading,
    characterData,
    currentlyPlaying,
    handleSendMessage,
    handleTextToSpeech,
    toggleStarMessage,
    handleNewChat,
    loadChat,
    currentChatId,
    starredMessages: messages.filter((msg) => msg.starred),
    getChatHistories,
  };
};
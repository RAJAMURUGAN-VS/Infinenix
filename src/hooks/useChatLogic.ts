// hooks/useChatLogic.ts
import { useState, useEffect, useRef, useCallback } from "react";
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

// --- localStorage helpers ---

const saveChatToStorage = (chatId: string, messages: Message[], folderId: string) => {
  try {
    localStorage.setItem(`chat_${chatId}`, JSON.stringify({ messages, folderId }));
  } catch (e) {
    console.warn("Failed to save chat to localStorage:", e);
  }
};

const loadChatFromStorage = (chatId: string): { messages: Message[]; folderId: string } => {
  try {
    const raw = localStorage.getItem(`chat_${chatId}`);
    if (!raw) return { messages: [], folderId: "default" };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { messages: parsed, folderId: "default" };
    if (parsed.messages) return { messages: parsed.messages, folderId: parsed.folderId || "default" };
  } catch {
    // Corrupt data — ignore
  }
  return { messages: [], folderId: "default" };
};

// --- Hook ---

export const useChatLogic = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string>(() => {
    try {
      return localStorage.getItem("currentChatId") || Date.now().toString();
    } catch {
      return Date.now().toString();
    }
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load character data on mount
  useEffect(() => {
    const character = CharacterService.getEngagedCharacter();
    if (character) setCharacterData(character);
  }, []);

  // Load messages when chat ID changes
  useEffect(() => {
    setChatLoading(true);
    const { messages: loaded } = loadChatFromStorage(currentChatId);
    const delay = loaded.length > 0 ? 150 : 0;
    const timer = setTimeout(() => {
      setMessages(loaded);
      setChatLoading(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [currentChatId]);

  // Persist messages to localStorage whenever they change
  // Skip messages that are still streaming — wait until complete
  useEffect(() => {
    if (messages.length === 0) return;
    const hasStreaming = messages.some(m => m.isStreaming);
    if (hasStreaming) return; // don't persist mid-stream

    try {
      const newChatFolderId = localStorage.getItem("newChatFolderId");
      if (newChatFolderId) {
        saveChatToStorage(currentChatId, messages, newChatFolderId);
        localStorage.removeItem("newChatFolderId");
      } else {
        const { folderId } = loadChatFromStorage(currentChatId);
        saveChatToStorage(currentChatId, messages, folderId);
      }
    } catch (e) {
      console.warn("Failed to persist messages:", e);
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
    } catch {
      return { response: rawContent, code: "" };
    }
  };

  /**
   * Handles the complete message sending flow with streaming.
   *
   * Flow:
   * 1. Add user message immediately
   * 2. Add a placeholder AI message with isStreaming=true and empty content
   * 3. Stream chunks → append to that message's content in real time
   * 4. When stream ends → set isStreaming=false, parse for code blocks
   */
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const userMessage: Message = {
      id: `${currentChatId}-${Date.now()}`,
      content,
      sender: "user",
      timestamp: new Date(),
      starred: false,
    };

    // Placeholder AI message — shown while streaming
    const aiMessageId = `${currentChatId}-${Date.now() + 1}`;
    const aiPlaceholder: Message = {
      id: aiMessageId,
      content: "",
      sender: "ai",
      timestamp: new Date(),
      starred: false,
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, aiPlaceholder]);
    setIsLoading(true);

    try {
      const intent = await ApiService.classifyIntent(content);
      const threshold = 0.3;

      let systemPrompt: string;
      let shouldShowIntentToast = false;

      if (intent.matched_intention && intent.confidence >= threshold) {
        systemPrompt = PromptService.createOptimizedSystemPrompt(intent);
        shouldShowIntentToast = true;
      } else {
        systemPrompt = PromptService.createCasualSystemPrompt(characterData);
      }

      // Stream response — each chunk appends to the AI message content
      const fullText = await ApiService.getSonarResponseStream(
        content,
        systemPrompt,
        (chunk: string) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === aiMessageId
                ? { ...m, content: m.content + chunk }
                : m
            )
          );
        }
      );

      // Stream complete — parse for code blocks, clear streaming flag
      const aiParsed = parseAIResponse(fullText);
      const finalContent =
        aiParsed.response +
        (aiParsed.code ? `\n\n### Render Code Below ###\n${aiParsed.code}` : "");

      setMessages(prev =>
        prev.map(m =>
          m.id === aiMessageId
            ? { ...m, content: finalContent, isStreaming: false }
            : m
        )
      );

      if (shouldShowIntentToast) {
        toast.success(
          `🎯 Detected: ${intent.matched_intention} (${Math.round(intent.confidence * 100)}% confidence)`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sorry, I couldn't process your request right now.";

      // Replace placeholder with error message
      setMessages(prev =>
        prev.map(m =>
          m.id === aiMessageId
            ? { ...m, content: errorMessage, isStreaming: false, isError: true }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, characterData]);

  /**
   * Retries the last failed request
   */
  const handleRetry = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === "user");
    if (!lastUserMsg) return;
    setMessages(prev => prev.filter(m => !m.isError));
    handleSendMessage(lastUserMsg.content);
  }, [messages, handleSendMessage]);

  /**
   * Text-to-speech
   */
  const handleTextToSpeech = async (messageId: string, content: string) => {
    if (currentlyPlaying === messageId) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setCurrentlyPlaying(null);
      return;
    }

    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setCurrentlyPlaying(messageId);

    if (!characterData) {
      toast.error("Character data not loaded for text-to-speech.");
      setCurrentlyPlaying(null);
      return;
    }

    try {
      toast.info("Converting text to speech...");
      const audioBlob = await ApiService.convertToSpeech({
        text: content,
        character: {
          role: characterData.lifeStage.stage,
          voiceId: characterData.voiceId,
        },
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => {
        setCurrentlyPlaying(null);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        toast.error("Failed to play audio.");
        setCurrentlyPlaying(null);
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      toast.error(`Failed to generate speech: ${error instanceof Error ? error.message : ""}`);
      setCurrentlyPlaying(null);
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
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      toast[!message.starred ? "success" : "info"](
        !message.starred
          ? "Message starred and saved to your collection"
          : "Message removed from starred collection"
      );
    }
  };

  const handleNewChat = () => {
    const newChatId = Date.now().toString();
    if (messages.length > 0) {
      const { folderId } = loadChatFromStorage(currentChatId);
      saveChatToStorage(currentChatId, messages, folderId);
    }
    setCurrentChatId(newChatId);
    try { localStorage.setItem("currentChatId", newChatId); } catch {}
    setMessages([]);
  };

  const loadChat = (chatId: string) => {
    if (messages.length > 0) {
      const { folderId } = loadChatFromStorage(currentChatId);
      saveChatToStorage(currentChatId, messages, folderId);
    }
    setMessages([]); // Clear synchronously so persistence effect doesn't overwrite new chatId with old messages
    setCurrentChatId(chatId);
    try { localStorage.setItem("currentChatId", chatId); } catch {}
  };

  const deleteChat = (chatId: string) => {
    try { localStorage.removeItem(`chat_${chatId}`); } catch {}
    if (chatId === currentChatId) handleNewChat();
    else setHistoryVersion(v => v + 1);
    toast.success("Chat deleted");
  };

  const moveChatToFolder = (chatId: string, targetFolderId: string) => {
    try {
      const { messages: msgs } = loadChatFromStorage(chatId);
      saveChatToStorage(chatId, msgs, targetFolderId);
      setHistoryVersion(v => v + 1);
      toast.success("Chat moved to folder");
    } catch (e) {
      console.warn("Failed to move chat to folder:", e);
    }
  };

  const getChatHistories = (): {
    id: string; messages: Message[]; folderId: string; title: string; updatedAt: number
  }[] => {
    const histories: { id: string; messages: Message[]; folderId: string; title: string; updatedAt: number }[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("chat_")) {
          const chatId = key.replace("chat_", "");
          const { messages: msgs, folderId } = loadChatFromStorage(chatId);
          if (msgs.length > 0) {
            const firstUserMsg = msgs.find(m => m.sender === "user");
            const title = firstUserMsg
              ? firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? "…" : "")
              : "Untitled Chat";
            histories.push({ id: chatId, messages: msgs, folderId, title, updatedAt: parseInt(chatId, 10) || 0 });
          }
        }
      }
    } catch {}
    return histories.sort((a, b) => b.updatedAt - a.updatedAt);
  };

  return {
    messages,
    isLoading,
    chatLoading,
    characterData,
    currentlyPlaying,
    handleSendMessage,
    handleRetry,
    handleTextToSpeech,
    toggleStarMessage,
    handleNewChat,
    loadChat,
    deleteChat,
    moveChatToFolder,
    currentChatId,
    starredMessages: messages.filter(msg => msg.starred),
    getChatHistories,
  };
};
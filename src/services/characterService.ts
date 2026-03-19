// services/characterService.ts
import { Message } from "@/types/chat";

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

export class CharacterService {
  private static readonly ENGAGED_CHARACTER_KEY = "engagedCharacter";
  private static readonly CHAT_MESSAGES_KEY = "chatMessages";

  /**
   * Retrieves the currently engaged character from localStorage
   */
  static getEngagedCharacter(): CharacterData | null {
    try {
      const savedCharacter = localStorage.getItem(this.ENGAGED_CHARACTER_KEY);
      if (!savedCharacter) return null;

      const parsedData = JSON.parse(savedCharacter);
      // Handle array structure and get the first character
      return Array.isArray(parsedData) && parsedData.length > 0 ? parsedData[0] : parsedData;
    } catch (error) {
      console.error("Error parsing character data:", error);
      return null;
    }
  }

  /**
   * Saves character data to localStorage
   */
  static saveEngagedCharacter(character: CharacterData): void {
    try {
      localStorage.setItem(this.ENGAGED_CHARACTER_KEY, JSON.stringify(character));
    } catch (error) {
      console.error("Error saving character data:", error);
    }
  }

  /**
   * Retrieves saved messages from localStorage
   */
  static getSavedMessages(): Message[] {
    try {
      const savedMessages = localStorage.getItem(this.CHAT_MESSAGES_KEY);
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      console.error("Error parsing saved messages:", error);
      return [];
    }
  }

  /**
   * Saves messages to localStorage
   */
  static saveMessages(messages: Message[]): void {
    try {
      localStorage.setItem(this.CHAT_MESSAGES_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving messages:", error);
    }
  }

  /**
   * Clears all saved data
   */
  static clearSavedData(): void {
    try {
      localStorage.removeItem(this.ENGAGED_CHARACTER_KEY);
      localStorage.removeItem(this.CHAT_MESSAGES_KEY);
    } catch (error) {
      console.error("Error clearing saved data:", error);
    }
  }
}
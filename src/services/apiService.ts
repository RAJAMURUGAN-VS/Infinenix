/**
 * API Service for intent classification and AI responses
 * 
 * Architecture:
 * 1. Local intent classification uses precomputed embeddings (no ML at runtime)
 * 2. Falls back to Sonar API for AI responses
 * 3. Graceful error handling at each step
 */

import { classifyIntent as localClassifyIntent } from './intentClassifier';

// In dev, Vite proxy forwards to Perplexity directly (uses VITE_SONAR_API_TOKEN).
// In production, requests go to a Netlify serverless function that holds the token server-side.
const getSonarApiUrl = () => import.meta.env.DEV
  ? "/api/perplexity/chat/completions"
  : "/.netlify/functions/sonar-proxy";

// Only used in development; production token lives in the serverless function
const getSonarApiToken = () => import.meta.env.DEV ? import.meta.env.VITE_SONAR_API_TOKEN : null;

export interface IntentResult {
  matched_intention: string | null;
  confidence: number;
  recommended_tools: Array<{
    name: string;
    description: string;
    confidence: number;
  }>;
}

export interface SpeechRequest {
  text: string;
  character: {
    role: string;
    voiceId: string;
  };
}

export class ApiService {
  /**
   * Classifies user intent using local precomputed embeddings
   * No ML libraries are loaded - uses pure JavaScript cosine similarity
   * 
   * @param prompt - The user's message to classify
   * @returns Intent classification result (may have null matched_intention)
   */
  static async classifyIntent(prompt: string): Promise<IntentResult> {
    try {
      console.log('[ApiService] Starting local intent classification...');
      const response = await localClassifyIntent(prompt, 0.3);
      
      console.log('[ApiService] Local intent classification result:', {
        matched: response.matchedIntention,
        confidence: response.confidence,
        isFallback: response.isFallback,
      });
      
      // Map response to match the expected IntentResult format
      return {
        matched_intention: response.matchedIntention,
        confidence: response.confidence,
        recommended_tools: response.recommendedTools,
      };
    } catch (error) {
      // Log error but don't crash - return a fallback result
      console.warn('[ApiService] Local intent classification failed:', error);
      console.log('[ApiService] Returning fallback intent result');
      
      return { 
        matched_intention: null, 
        confidence: 0, 
        recommended_tools: [] 
      };
    }
  }

  /**
   * Fetches AI response from Sonar API
   * 
   * @param userMessage - The user's message
   * @param systemContent - System prompt for the AI
   * @returns AI response text
   * @throws Error if API request fails
   */
  static async getSonarResponse(userMessage: string, systemContent: string): Promise<string> {
    const SONAR_API_TOKEN = getSonarApiToken();

    // In development, a token is required (Vite proxy forwards to Perplexity directly).
    // In production, the serverless function supplies the token.
    if (import.meta.env.DEV && !SONAR_API_TOKEN) {
      console.error('[ApiService] VITE_SONAR_API_TOKEN is not configured for development');
      throw new Error(
        'Sonar API is not configured. Please set VITE_SONAR_API_TOKEN environment variable.'
      );
    }

    const requestPayload = {
      model: "sonar",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userMessage },
      ],
    };

    console.log('[ApiService] Sending request to Sonar AI...');

    try {
      const SONAR_API_URL = getSonarApiUrl();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      // Only attach Authorization header in dev (production uses serverless proxy)
      if (SONAR_API_TOKEN) {
        headers.Authorization = `Bearer ${SONAR_API_TOKEN}`;
      }
      const response = await fetch(SONAR_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        
        // Handle specific HTTP errors
        if (response.status === 401) {
          console.error('[ApiService] Sonar API authentication failed (401 Unauthorized)');
          throw new Error(
            'Sonar API authentication failed. Please check your API token.'
          );
        }
        
        if (response.status === 429) {
          console.error('[ApiService] Sonar API rate limit exceeded (429)');
          throw new Error(
            'Rate limit exceeded. Please try again in a moment.'
          );
        }
        
        console.error(`[ApiService] Sonar API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Sonar API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[ApiService] Sonar AI response received successfully');

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.warn('[ApiService] Sonar API returned empty response');
        return "I received your message but couldn't generate a response. Please try again.";
      }
      
      return content;
    } catch (error) {
      // Re-throw if it's already a formatted error
      if (error instanceof Error && error.message.includes('Sonar API')) {
        throw error;
      }
      
      // Network or other errors
      console.error('[ApiService] Network error calling Sonar API:', error);
      throw new Error(
        'Unable to reach the AI service. Please check your internet connection and try again.'
      );
    }
  }

  /**
   * Converts text to speech using browser's Web Speech API
   * Falls back gracefully if speech synthesis is not available
   */
  static async convertToSpeech(speechRequest: SpeechRequest): Promise<Blob> {
    // Use browser's Web Speech API
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(speechRequest.text);
      
      // Try to find a suitable voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Try to find an English voice
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        // Return an empty blob since we're using native speech
        resolve(new Blob([], { type: 'audio/wav' }));
      };
      
      utterance.onerror = (event) => {
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }
}
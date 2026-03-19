/**
 * API Service for intent classification and AI responses
 *
 * Architecture:
 * 1. Local intent classification uses precomputed embeddings (no ML at runtime)
 * 2. Falls back to Sonar API for AI responses
 * 3. Streaming support via getSonarResponseStream()
 * 4. Graceful error handling at each step
 */

import { classifyIntent as localClassifyIntent } from './intentClassifier';

const getSonarApiUrl = () => import.meta.env.DEV
  ? "/api/perplexity/chat/completions"
  : "/.netlify/functions/sonar-proxy";

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
      return {
        matched_intention: response.matchedIntention,
        confidence: response.confidence,
        recommended_tools: response.recommendedTools,
      };
    } catch (error) {
      console.warn('[ApiService] Local intent classification failed:', error);
      return { matched_intention: null, confidence: 0, recommended_tools: [] };
    }
  }

  /**
   * Builds the shared fetch request for Sonar — used by both stream and non-stream paths.
   */
  private static buildRequest(
    userMessage: string,
    systemContent: string,
    stream: boolean
  ): { url: string; init: RequestInit } {
    const token = getSonarApiToken();

    if (import.meta.env.DEV && !token) {
      throw new Error(
        'Sonar API is not configured. Please set VITE_SONAR_API_TOKEN environment variable.'
      );
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const selectedModel = (() => {
      try { return localStorage.getItem("selectedModel") || "sonar"; }
      catch { return "sonar"; }
    })();

    return {
      url: getSonarApiUrl(),
      init: {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: selectedModel,
          stream,
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userMessage },
          ],
        }),
      },
    };
  }

  /**
   * STREAMING path — calls onChunk(text) for each token, returns full text when done.
   * Usage: await ApiService.getSonarResponseStream(msg, sys, (chunk) => appendToMessage(chunk))
   */
  static async getSonarResponseStream(
    userMessage: string,
    systemContent: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const { url, init } = ApiService.buildRequest(userMessage, systemContent, true);

    const response = await fetch(url, init);
    console.log('[ApiService] Sonar AI stream connection established (status: ' + response.status + ')');

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      if (response.status === 401) throw new Error('Sonar API authentication failed. Please check your API token.');
      if (response.status === 429) throw new Error('Rate limit exceeded. Please try again in a moment.');
      throw new Error(`Sonar API request failed: ${response.status} ${response.statusText} — ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body available for streaming');

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Each chunk may contain multiple SSE lines: "data: {...}\n\ndata: {...}\n\n"
      const raw = decoder.decode(value, { stream: true });
      const lines = raw.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const jsonStr = trimmed.slice(5).trim();
        if (jsonStr === '[DONE]') {
          console.log('[ApiService] Stream [DONE] signal received');
          continue;
        }

        console.log('[ApiService] Raw SSE data received:', jsonStr);

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            console.log('[ApiService] Stream chunk extracted. Delta length:', delta.length);
            fullText += delta;
            onChunk(delta);
          }
        } catch (e) {
          console.log('[ApiService] Failed to parse JSON chunk:', jsonStr, e);
        }
      }
    }

    console.log('[ApiService] Sonar AI streaming complete. Final text length:', fullText.length);
    console.log('[ApiService] Full Response:', fullText);

    return fullText;
  }

  /**
   * NON-STREAMING path — kept for fallback/retry scenarios.
   */
  static async getSonarResponse(userMessage: string, systemContent: string): Promise<string> {
    const { url, init } = ApiService.buildRequest(userMessage, systemContent, false);

    const response = await fetch(url, init);
    console.log('[ApiService] Sonar AI static request completed (status: ' + response.status + ')');

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      if (response.status === 401) throw new Error('Sonar API authentication failed. Please check your API token.');
      if (response.status === 429) throw new Error('Rate limit exceeded. Please try again in a moment.');
      throw new Error(`Sonar API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[ApiService] Sonar AI raw response object:', data);

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('[ApiService] Sonar API returned empty response, full raw data:', data);
      return "I received your message but couldn't generate a response. Please try again.";
    }
    
    console.log('[ApiService] Extracted Sonar AI content length:', content.length);
    return content;
  }

  /**
   * Text-to-speech via browser Web Speech API
   */
  static async convertToSpeech(speechRequest: SpeechRequest): Promise<Blob> {
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(speechRequest.text);
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) utterance.voice = englishVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => resolve(new Blob([], { type: 'audio/wav' }));
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
      window.speechSynthesis.speak(utterance);
    });
  }
}
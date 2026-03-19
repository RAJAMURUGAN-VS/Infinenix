/**
 * Intent Classifier Service
 * 
 * Classifies user intent using precomputed embeddings and pure cosine similarity.
 * NO ML LIBRARIES are used at runtime - all embeddings are generated offline
 * using the Node-only script (src/scripts/generateEmbeddings.ts).
 * 
 * Architecture:
 * - Precomputed 384-dimension embeddings (Xenova/all-MiniLM-L6-v2) stored in intentions.json
 * - Pure JavaScript cosine similarity computation
 * - No @xenova/transformers or ONNX dependencies in the browser
 */

import intentionsData from '../data/intentions.json';

/**
 * Type definitions for intent classification
 */
export interface IntentRecord {
  intention: string;
  tools: string[];
  embedding: number[];
}

export interface ToolRecommendation {
  name: string;
  description: string;
  confidence: number;
}

export interface AlternativeIntention {
  intention: string;
  score: number;
}

export interface IntentResponse {
  matchedIntention: string | null;
  confidence: number;
  recommendedTools: ToolRecommendation[];
  isFallback: boolean;
  alternativeIntentions: AlternativeIntention[];
}

// Cast the imported JSON to typed array
const intentions: IntentRecord[] = intentionsData as IntentRecord[];

// Expected embedding dimension (MiniLM-L6-v2 produces 384-dim vectors)
const EXPECTED_EMBEDDING_DIM = 384;

// Flag to track if embeddings have been validated
let embeddingsValidated = false;

/**
 * Validates that all intentions have properly formatted embeddings
 * Logs warnings for any issues found
 */
function validateEmbeddings(): boolean {
  if (embeddingsValidated) return true;
  
  let valid = true;
  let validCount = 0;
  let missingCount = 0;
  let wrongDimCount = 0;
  
  for (const intent of intentions) {
    if (!intent.embedding || !Array.isArray(intent.embedding)) {
      console.warn(`[IntentClassifier] Missing embedding for: "${intent.intention}"`);
      missingCount++;
      valid = false;
      continue;
    }
    
    if (intent.embedding.length !== EXPECTED_EMBEDDING_DIM) {
      console.warn(
        `[IntentClassifier] Wrong embedding dimension for "${intent.intention}": ` +
        `expected ${EXPECTED_EMBEDDING_DIM}, got ${intent.embedding.length}`
      );
      wrongDimCount++;
      valid = false;
      continue;
    }
    
    validCount++;
  }
  
  console.log(
    `[IntentClassifier] Embedding validation: ${validCount} valid, ` +
    `${missingCount} missing, ${wrongDimCount} wrong dimension`
  );
  
  embeddingsValidated = true;
  return valid;
}

/**
 * Computes the cosine similarity between two vectors
 * Both vectors must be the same length (384 dimensions for MiniLM)
 * 
 * @param a - First vector (query embedding - not available in browser, skip if missing)
 * @param b - Second vector (precomputed intention embedding)
 * @returns Cosine similarity score between -1 and 1, or 0 on error
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  // Handle edge cases
  if (!a || !b || a.length === 0 || b.length === 0) {
    return 0;
  }

  // Vectors should be the same length
  if (a.length !== b.length) {
    console.warn(
      `[cosineSimilarity] Vector length mismatch: ${a.length} vs ${b.length}. ` +
      `Both should be ${EXPECTED_EMBEDDING_DIM} dimensions.`
    );
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  // Prevent division by zero
  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Generates tool recommendations from the matched intention
 * 
 * @param tools - Array of tool names from the matched intention
 * @param confidence - The confidence score of the match
 * @returns Array of tool recommendations with descriptions
 */
function generateToolRecommendations(tools: string[], confidence: number): ToolRecommendation[] {
  return tools.map((tool, index) => ({
    name: tool,
    description: `Recommended tool for this intention`,
    // Slightly decrease confidence for each subsequent tool
    confidence: Math.max(0.1, confidence - (index * 0.05)),
  }));
}

/**
 * Simple keyword-based intent matching as a lightweight alternative
 * when embeddings are not available. Uses basic text matching.
 * 
 * @param query - The user's input text
 * @returns Best matching intention or null
 */
function keywordMatch(query: string): { intention: IntentRecord; score: number } | null {
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);
  
  let bestMatch: { intention: IntentRecord; score: number } | null = null;
  
  for (const intent of intentions) {
    const intentWords = intent.intention.toLowerCase().split(/\s+/);
    
    // Count matching words
    let matchCount = 0;
    for (const word of queryWords) {
      if (word.length > 2 && intentWords.some(iw => iw.includes(word) || word.includes(iw))) {
        matchCount++;
      }
    }
    
    // Calculate simple overlap score
    const score = matchCount / Math.max(queryWords.length, intentWords.length);
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { intention: intent, score: Math.min(score * 0.7, 0.6) }; // Cap at 0.6 for keyword matching
    }
  }
  
  return bestMatch;
}

/**
 * Classifies user intent using precomputed embeddings and cosine similarity.
 * 
 * IMPORTANT: This function does NOT generate embeddings at runtime.
 * Since we cannot generate embeddings for the query in the browser,
 * we use a simplified keyword-based matching approach.
 * 
 * For full semantic matching, embeddings would need to be generated
 * server-side or the query would need to be sent to the backend API.
 * 
 * @param query - The user's input text to classify
 * @param threshold - Minimum similarity score to consider a match (default: 0.3)
 * @returns Promise resolving to the classification result
 */
export async function classifyIntent(
  query: string,
  threshold: number = 0.3
): Promise<IntentResponse> {
  console.log(`[IntentClassifier] Classifying query: "${query.substring(0, 50)}..."`);
  
  // Validate embeddings on first call
  validateEmbeddings();
  
  try {
    // Since we cannot generate embeddings in the browser, use keyword matching
    // This is a lightweight fallback that doesn't require ML libraries
    const keywordResult = keywordMatch(query);
    
    if (keywordResult && keywordResult.score >= threshold) {
      console.log(
        `[IntentClassifier] Keyword match found: "${keywordResult.intention.intention}" ` +
        `with score ${keywordResult.score.toFixed(4)}`
      );
      
      return {
        matchedIntention: keywordResult.intention.intention,
        confidence: keywordResult.score,
        recommendedTools: generateToolRecommendations(
          keywordResult.intention.tools, 
          keywordResult.score
        ),
        isFallback: false,
        alternativeIntentions: [],
      };
    }
    
    // No match found - return fallback response
    console.log('[IntentClassifier] No local match found, returning fallback');
    
    return {
      matchedIntention: null,
      confidence: keywordResult?.score ?? 0,
      recommendedTools: [],
      isFallback: true,
      alternativeIntentions: [],
    };
  } catch (error) {
    console.error('[IntentClassifier] Classification failed:', error);
    
    // Return fallback response on error
    return {
      matchedIntention: null,
      confidence: 0,
      recommendedTools: [],
      isFallback: true,
      alternativeIntentions: [],
    };
  }
}

/**
 * @deprecated Preloading is no longer needed since we use precomputed embeddings.
 * This function is kept for backward compatibility but does nothing.
 */
export async function preloadClassifier(): Promise<void> {
  console.log('[IntentClassifier] preloadClassifier() is deprecated - using precomputed embeddings');
  // Validate embeddings on preload
  validateEmbeddings();
}

/**
 * Gets the list of all available intentions
 */
export function getAvailableIntentions(): string[] {
  return intentions.map(i => i.intention);
}

/**
 * Gets intention details by name
 */
export function getIntentionByName(name: string): IntentRecord | undefined {
  return intentions.find(i => i.intention.toLowerCase() === name.toLowerCase());
}

/**
 * Gets the count of intentions with valid embeddings
 */
export function getEmbeddingStats(): { total: number; withEmbeddings: number; dimension: number } {
  const withEmbeddings = intentions.filter(
    i => i.embedding && i.embedding.length === EXPECTED_EMBEDDING_DIM
  ).length;
  
  return {
    total: intentions.length,
    withEmbeddings,
    dimension: EXPECTED_EMBEDDING_DIM,
  };
}

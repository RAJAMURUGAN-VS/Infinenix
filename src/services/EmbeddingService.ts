/**
 * @deprecated This file is deprecated and should not be used.
 * 
 * IMPORTANT: Browser-side embedding generation using @xenova/transformers has been
 * removed from this project due to runtime issues with ONNX and Vite bundling.
 * 
 * The new architecture uses:
 * 1. Precomputed embeddings stored in src/data/intentions.json (generated offline)
 * 2. Pure JavaScript cosine similarity in the frontend (no ML dependencies)
 * 3. Node-only script (src/scripts/generateEmbeddings.ts) for embedding generation
 * 
 * DO NOT import @xenova/transformers or any ML libraries in frontend code.
 * 
 * @see src/services/intentClassifier.ts for the new implementation
 * @see src/scripts/generateEmbeddings.ts for embedding generation (Node-only)
 */

// This file is intentionally empty and deprecated.
// Keeping it to prevent import errors during migration.

console.warn(
  '[EmbeddingService] DEPRECATED: This module has been disabled. ' +
  'Intent classification now uses precomputed embeddings with pure cosine similarity. ' +
  'Do not use this module.'
);

export const EmbeddingService = {
  getEmbedding: async (_text: string): Promise<number[]> => {
    throw new Error(
      'EmbeddingService is deprecated. Browser-side embedding generation is no longer supported. ' +
      'Use precomputed embeddings with intentClassifier.ts instead.'
    );
  },
  preload: async (): Promise<void> => {
    console.warn('[EmbeddingService] preload() is deprecated and does nothing.');
  },
  clearCache: (): void => {
    console.warn('[EmbeddingService] clearCache() is deprecated and does nothing.');
  },
  getCacheSize: (): number => {
    console.warn('[EmbeddingService] getCacheSize() is deprecated.');
    return 0;
  },
};
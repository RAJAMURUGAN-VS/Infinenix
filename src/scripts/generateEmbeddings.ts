#!/usr/bin/env node
/**
 * Embedding Generation Script (Node-only)
 * 
 * Generates 384-dimension embeddings for all intentions using Xenova/all-MiniLM-L6-v2.
 * This script runs in Node.js and outputs precomputed embeddings to a JSON file.
 * 
 * IMPORTANT: This is a standalone Node ESM script, NOT part of the Vite frontend bundle.
 * 
 * Usage:
 *   node --loader ts-node/esm src/scripts/generateEmbeddings.ts
 * 
 * Or using tsx:
 *   npx tsx src/scripts/generateEmbeddings.ts
 * 
 * Requirements:
 *   - Node.js 18+
 *   - @xenova/transformers package (dev dependency)
 *   - Project must have "type": "module" in package.json
 * 
 * Output:
 *   - Updates src/data/intentions.json with embedding vectors
 *   - Each embedding is a 384-dimension normalized vector
 */

import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Expected embedding dimension for MiniLM-L6-v2
const EMBEDDING_DIM = 384;

interface IntentRecord {
  intention: string;
  tools: string[];
  embedding: number[];
}

async function generateEmbeddings(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║      Embedding Generation Script (Xenova/all-MiniLM-L6-v2)    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Resolve paths
  const intentionsPath = path.join(__dirname, '../data/intentions.json');
  
  console.log(`📂 Loading intentions from: ${intentionsPath}`);
  
  if (!fs.existsSync(intentionsPath)) {
    console.error('❌ Error: intentions.json not found at:', intentionsPath);
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(intentionsPath, 'utf-8');
  const intentions: IntentRecord[] = JSON.parse(rawData);
  
  console.log(`📊 Found ${intentions.length} intentions to process`);
  console.log('');
  console.log('🔄 Initializing embedding model (this may take a moment on first run)...');
  
  // Initialize the pipeline
  let extractor: FeatureExtractionPipeline;
  try {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Model loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load model:', error);
    process.exit(1);
  }
  
  console.log('');
  console.log('📝 Generating embeddings...');
  console.log('─'.repeat(60));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < intentions.length; i++) {
    const intent = intentions[i];
    const progress = `[${String(i + 1).padStart(3)}/${intentions.length}]`;
    
    try {
      // Generate embedding for the intention text
      const output = await extractor(intent.intention, {
        pooling: 'mean',
        normalize: true,
      });
      
      // Convert to flat array
      const embeddingData = output.tolist() as number[][] | number[];
      const embedding = Array.isArray(embeddingData[0]) 
        ? embeddingData[0] as number[]
        : embeddingData as number[];
      
      // Validate dimension
      if (embedding.length !== EMBEDDING_DIM) {
        console.warn(`${progress} ⚠️  Wrong dimension (${embedding.length}) for: "${intent.intention.substring(0, 40)}..."`);
      }
      
      // Update the intention with the embedding
      intent.embedding = embedding;
      
      console.log(`${progress} ✓ "${intent.intention.substring(0, 50)}${intent.intention.length > 50 ? '...' : ''}"`);
      successCount++;
    } catch (error) {
      console.error(`${progress} ✗ Failed: "${intent.intention.substring(0, 40)}..."`);
      console.error(`         Error: ${error instanceof Error ? error.message : error}`);
      intent.embedding = []; // Clear embedding on error
      errorCount++;
    }
  }
  
  console.log('─'.repeat(60));
  console.log('');
  
  // Write the updated data back
  console.log('💾 Writing updated intentions with embeddings...');
  
  try {
    fs.writeFileSync(
      intentionsPath,
      JSON.stringify(intentions, null, 2),
      'utf-8'
    );
    console.log(`✅ Saved to: ${intentionsPath}`);
  } catch (error) {
    console.error('❌ Failed to write file:', error);
    process.exit(1);
  }
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  Summary: ${successCount} success, ${errorCount} errors                              ║`);
  console.log(`║  Embedding dimension: ${EMBEDDING_DIM}                                    ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run the script
generateEmbeddings().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

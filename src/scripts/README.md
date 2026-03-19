# Scripts Directory

This directory contains Node.js scripts that are **not** part of the Vite frontend bundle.

## Embedding Generation Script

### Purpose

The `generateEmbeddings.ts` script generates 384-dimension embeddings for all intentions in `src/data/intentions.json` using the `Xenova/all-MiniLM-L6-v2` model.

### Why This Exists

The frontend **cannot** run ML models like Transformers.js due to:
- ONNX runtime bundling issues with Vite
- `registerBackend` errors in the browser
- Large bundle sizes and slow startup times

Instead, we:
1. Generate embeddings **once** offline using this Node.js script
2. Store the embeddings in `intentions.json`
3. Use pure JavaScript cosine similarity in the frontend

### How to Run

```bash
# Using npm script (recommended)
npm run generate:embeddings

# Using npx tsx directly
npx tsx src/scripts/generateEmbeddings.ts

# Using Node.js with ts-node loader
node --loader ts-node/esm src/scripts/generateEmbeddings.ts
```

### Requirements

- Node.js 18+
- `@xenova/transformers` package (installed as devDependency)
- Project must have `"type": "module"` in package.json

### Output

The script updates `src/data/intentions.json` with `embedding` arrays for each intention:

```json
{
  "intention": "Creating Memes or Marketing Content",
  "tools": ["Meme Templates", ...],
  "embedding": [0.05, -0.02, 0.08, ...]  // 384 dimensions
}
```

### When to Re-run

Re-run this script when:
- Adding new intentions to `intentions.json`
- Modifying existing intention text
- Upgrading the embedding model

### TypeScript Configuration

This script uses `tsconfig.scripts.json` which is configured for Node.js ESM:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022"
  }
}
```

### Troubleshooting

**Error: `bad option: --project`**
- Don't pass `--project` to `node`. Use `npx tsx` instead.

**Error: `Cannot find module '@xenova/transformers'`**
- Run `npm install` to install devDependencies.

**Error: Model download fails**
- Check internet connection. The model downloads from Hugging Face on first run.

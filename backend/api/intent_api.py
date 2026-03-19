from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Union
import requests
import io
import os
import time
import pickle
import warnings
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from dotenv import load_dotenv
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import torch
from collections import defaultdict
import re
from .intention_data import intention_data

# Define Pydantic models for request/response types
class IntentRequest(BaseModel):
    prompt: str
    threshold: float = 0.5

class ToolRecommendation(BaseModel):
    name: str
    description: str
    confidence: float

class AlternativeIntention(BaseModel):
    intention: str
    score: float

class IntentResponse(BaseModel):
    matched_intention: Optional[str]
    confidence: float
    recommended_tools: List[ToolRecommendation]
    is_fallback: bool
    alternative_intentions: List[AlternativeIntention]

class TTSRequest(BaseModel):
    text: str
    character: Dict[str, str]

# Suppress FutureWarning from huggingface_hub
warnings.filterwarnings("ignore", category=FutureWarning)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for caching
model = None
intention_embeddings = None
intention_texts = None
tools_mapping = None
keyword_cache = {}
similarity_cache = {}

# Thread pool for CPU-intensive tasks
executor = ThreadPoolExecutor(max_workers=4)

# Voice mappings for different roles
VOICE_MAPPING = {
    'child': '21m00Tcm4TlvDq8ikWAM',
    'teen': 'AZnzlk1XvdvUeBnXmlld',
    'adult': 'EXAVITQu4vr4xnSDxMaL',
    'senior': 'MF3mGyEYCl7XYWbV9V6O'
}

@lru_cache(maxsize=1000)
def preprocess_text_cached(text: str) -> str:
    """Preprocess text for intent classification."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    return text.strip()

@lru_cache(maxsize=1000)
def extract_keywords_cached(text: str) -> tuple:
    """Extract keywords from text."""
    words = text.split()
    return tuple(sorted(set(words)))

async def load_or_compute_embeddings():
    """Load or compute embeddings for intentions."""
    global model, intention_embeddings, intention_texts, tools_mapping
    
    if model is None:
        model = SentenceTransformer('all-MiniLM-L6-v2')
    
    if intention_embeddings is None:
        intention_texts = [item["intention"] for item in intention_data]
        intention_embeddings = model.encode(intention_texts)
        tools_mapping = {item["intention"]: item["tools"] for item in intention_data}

async def compute_similarity_batch(query_embedding: torch.Tensor) -> np.ndarray:
    """Compute similarity between query and all intentions."""
    def _compute():
        return cosine_similarity(
            query_embedding.reshape(1, -1),
            intention_embeddings
        )[0]
    
    return await asyncio.get_event_loop().run_in_executor(executor, _compute)

def calculate_keyword_bonus(query_keywords: tuple, intention: str, tools: List[str]) -> float:
    """Calculate bonus score based on keyword matches."""
    bonus = 0.0
    for keyword in query_keywords:
        if keyword in intention.lower():
            bonus += 0.1
        for tool in tools:
            if keyword in tool.lower():
                bonus += 0.05
    return min(bonus, 0.3)  # Cap bonus at 0.3

async def semantic_search_optimized(query: str, threshold: float) -> Dict:
    """Perform semantic search with optimizations."""
    # Preprocess query
    processed_query = preprocess_text_cached(query)
    query_keywords = extract_keywords_cached(processed_query)
    
    # Get query embedding
    query_embedding = model.encode(processed_query)
    
    # Compute similarities
    similarities = await compute_similarity_batch(query_embedding)
    
    # Add keyword bonus
    for i, intention in enumerate(intention_texts):
        tools = tools_mapping[intention]
        similarities[i] += calculate_keyword_bonus(query_keywords, intention, tools)
    
    # Get top matches
    top_indices = np.argsort(similarities)[::-1]
    top_scores = similarities[top_indices]
    
    # Prepare response
    matched_intention = None
    confidence = 0.0
    recommended_tools = []
    alternative_intentions = []
    
    if top_scores[0] >= threshold:
        matched_intention = intention_texts[top_indices[0]]
        confidence = float(top_scores[0])
        tools = tools_mapping[matched_intention]
        recommended_tools = [
            ToolRecommendation(name=tool, description="", confidence=confidence)
            for tool in tools
        ]
    
    # Add alternative intentions
    for i in range(1, min(4, len(top_scores))):
        if top_scores[i] >= threshold * 0.8:
            alternative_intentions.append(
                AlternativeIntention(
                    intention=intention_texts[top_indices[i]],
                    score=float(top_scores[i])
                )
            )
    
    return IntentResponse(
        matched_intention=matched_intention,
        confidence=confidence,
        recommended_tools=recommended_tools,
        is_fallback=confidence < threshold,
        alternative_intentions=alternative_intentions
    )

@app.on_event("startup")
async def startup_event():
    """Initialize resources on startup."""
    await load_or_compute_embeddings()

@app.post("/classify-intent", response_model=IntentResponse)
async def classify_intent(request: IntentRequest):
    """Classify the intent of a given prompt."""
    try:
        return await semantic_search_optimized(request.prompt, request.threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Intent API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# This is important for Vercel
app = app

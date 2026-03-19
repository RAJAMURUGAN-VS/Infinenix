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

# Enhanced intention database (same as before but optimized structure)
intention_data = [
    {
        "intention": "Creating Memes or Marketing Content",
        "tools": ["Meme Templates", "Branding Checklist", "Image Editing Shortcuts", "Color Palette Generator", "Font Pairing Guide", "Royalty-Free Image Libraries", "Content Calendar Template", "Swipe File", "Thumbnail Templates", "Hashtag Lists"],
    },
    {
        "intention": "Editing and Proofreading Text",
        "tools": ["Style Guide PDF", "Proofreading Checklist", "Readability Score Tools", "Common Error List", "Text-to-Speech Tools", "Redundancy List", "Consistency Tracker", "PDF Markup Guides"],
    },
    {
        "intention": "Improving Grammar and Vocabulary",
        "tools": ["Flashcard Decks", "Grammar Cheat Sheets", "Daily Writing Prompts", "Vocabulary Tracker", "Common Mistake Guides", "Idiom Dictionary", "Root Word List", "Synonym Wheels", "Grammar Quizzes", "Word-of-the-Day Calendar"],
    },
    {
        "intention": "Personalizing Learning",
        "tools": ["Learning Style Quiz PDF", "Goal-Setting Template", "Resource Library", "Progress Tracker", "Reflection Journal Template", "Skill Tree Diagram", "Time Audit Sheet", "Bookmark Organizer", "Note-Taking Templates", "Reward System Chart"],
    },
    {
        "intention": "Learning New Skills",
        "tools": ["Skill Roadmap PDF", "Project Checklist", "Resource Kit", "30-Day Challenge Calendar", "Troubleshooting Guide", "Project Templates", "Skill Assessment Quiz", "Habit Tracker", "Feedback Template", "Pomodoro Sheet"],
    },
    {
        "intention": "Learning Programming and Software Development",
        "tools": ["Code Learning Roadmaps", "Practice Project Ideas", "Debugging Guides", "Code Review Checklists", "Algorithm Practice", "Development Environment Setup", "Version Control Guides", "Documentation Templates"],
    },
    {
        "intention": "Advanced Code Learning and Analysis",
        "tools": ["Step-by-Step Code Explanation", "Algorithm Optimization Suggestions", "Code Profiling & Bottleneck Identification", "Auto-Generate Unit Tests & Documentation", "Experiment with Code Variants"],
    },
    {
        "intention": "Creating Memes/Marketing Content (Enhanced)",
        "tools": ["Meme Template Gallery", "Brand Color Palette", "Hashtag Bank", "Caption Formulas", "Thumbnail Cheat Sheet", "Royalty-Free Image Links"],
    },
    {
        "intention": "Editing/Proofreading Text (Enhanced)",
        "tools": ["Common Error Alerts", "Readability Score", "Tone Checker", "Redundancy Remover", "Consistency Flag", "Passive Voice Alert"],
    },
    {
        "intention": "Improving Grammar/Vocabulary (Enhanced)",
        "tools": ["Vocab Flashcard", "Grammar Rule Cards", "Daily Word Challenge", "Mnemonic Generator", "Synonym Wheel", "Error Quiz"],
    },
    {
        "intention": "Personalizing Learning (Enhanced)",
        "tools": ["Learning Style Quiz", "Goal Tracker", "Resource Kit", "Progress Bar", "Habit Streak", "Custom Study Plan"],
    },
    {
        "intention": "Learning New Skills (Enhanced)",
        "tools": ["Project Idea Bank", "Cheat Sheet", "30-Day Challenge", "Expert Tip"],
    },
    {
        "intention": "Prioritizing Tasks or Overcoming Procrastination",
        "tools": ["Eisenhower Matrix", "Time Blocking Planner", "2-Minute Rule Prompt", "Priority Ranking", "Procrastination Triggers List", "Pomodoro Timer Link", "Reward System"],
    },
    {
        "intention": "Seeking Encouragement or Motivation",
        "tools": ["Progress Celebrator", "Motivational Quote Bank", "Streak Tracker", "Failure Reframer", "Energy Check-In", "Vision Board Snippets", "Self-Care Nudge"],
    },
    {
        "intention": "Providing Feedback on Assignments",
        "tools": ["Rubric Shortcut", "Glow & Grow Template", "Plagiarism Check Link", "Tone Adjuster", "Wordiness Score", "Structure Feedback"],
    },
    {
        "intention": "Simulating Characters for Games/Stories",
        "tools": ["Character Profile Template", "Archetype Bank", "Motivation Generator", "Relationship Web Map", "Appearance Builder", "Voice Test", "Alignment Chart"],
    },
    {
        "intention": "Exploring Philosophical/Ethical Questions",
        "tools": ["Thought Experiment Primer", "Ethical Framework Guide", "Quote Analyzer", "Argument Structure", "Fallacy Identifier", "Philosophy Glossary", "Historical Context"],
    },
    {
        "intention": "Generating Fictional Characters, Worlds, or Societies",
        "tools": ["Character Trait Generator", "World-Building Checklist", "Society Structure Template", "Magic/Technology System Builder", "Dialogue Style Guide", "Conflict Scenario Bank", "Species/Race Creator", "Faction Template"],
    },
    {
        "intention": "Planning Travel Itineraries",
        "tools": ["Day-by-Day Planner", "Packing Checklist", "Local Experience Guide", "Transportation Matrix", "Souvenir Tracker"],
    },
    {
        "intention": "Providing Shopping Advice or Product Comparisons",
        "tools": ["Pros vs. Cons Table", "Durability Score", "User Review Summary", "Sustainability Check", "Deal Tracker", "Use-Case Matcher", "Return Policy Cheat Sheet"],
    },
    {
        "intention": "Simplifying or Rewriting Complex Texts",
        "tools": ["Visual Analogy", "Readability Score", "Chunking Tool"],
    },
    {
        "intention": "Entertainment (Jokes, Stories, Games)",
        "tools": ["Joke Formula Templates", "Trivia Question Bank", "Role-Playing Scenario", "Puzzle Generator", "Mini-Game Rules", "Plot Twist Generator", "Choose-Your-Own-Adventure"],
    },
    {
        "intention": "Creating Lesson Plans",
        "tools": ["Lesson Objective Builder", "Activity Bank", "Timeline Scheduler", "Assessment Rubric", "Differentiation Guide", "Resource Links", "Homework Generator"],
    },
    {
        "intention": "Creating Scripts for Videos/Podcasts",
        "tools": ["Script Outline Template", "Hook Generator", "Dialogue Flowchart", "SEO Keyword Injector", "Tone Guide", "Call-to-Action Library", "Timing Calculator"],
    },
    {
        "intention": "Generating AI Art Prompts",
        "tools": ["Style Modifiers", "Mood Descriptors", "Composition Hacks", "Artist Reference Prompts", "Iteration Tracker"],
    },
    {
        "intention": "Designing User Interfaces",
        "tools": ["Wireframe Skeleton", "Color Palette Generator", "Component Library", "User Flow Map", "Accessibility Checklist", "Style Guide Template"],
    },
    {
        "intention": "Prototyping Software Tools",
        "tools": ["Clickable Mockup Links", "User Feedback Form", "Edge Case Simulator", "Version Comparison", "Performance Metrics"],
    },
    {
        "intention": "Writing Technical Documentation",
        "tools": ["API Reference Template", "Jargon Glossary", "Troubleshooting Guide", "Step-by-Step Tutorial", "Version History Log", "Visual Aid Integrator"],
    },
    {
        "intention": "Writing Essays Reports or Academic Papers (Overview Users)",
        "tools": ["AI Essay Builder Wizard", "Paragraph Expander", "Thesis Statement Generator", "Outline-to-Essay Converter", "Citation & Reference Formatter"],
    },
    {
        "intention": "Writing Essays Reports or Academic Papers (Deep Users)",
        "tools": ["Topic-Aware Essay Generation Using Fine-Tuned GPT", "Transformer-Based Section Generator", "Academic Style Transfer via Prompt Engineering", "Citation-Aware Essay Composer with RAG", "Multi-Modal Essay Drafting Assistant"],
    },
    {
        "intention": "Practicing Conversation in Different Languages (Overview Users)",
        "tools": ["Roleplay Chatbots", "Daily Language Prompts", "Translation Flip Game", "Picture-Based Conversations", "Click-and-Listen Language Practice"],
    },
    {
        "intention": "Practicing Conversation in Different Languages (Deep Learning Users)",
        "tools": ["Multilingual Dialogue Agent with Context Memory", "Accent and Dialect Simulation", "Grammar Error Detection and Correction (Bi-Lingual)", "Voice-to-Text + TTS Feedback Loop", "Role-Based Scenarios with Multimodal Input"],
    },
    {
        "intention": "Summarizing Books and Articles (Skim Mode - Overview Users)",
        "tools": ["One Page Summary", "Animated Summary Video", "Bullet Point Summary"],
    },
    {
        "intention": "Summarizing Books and Articles (Skim Mode - Deep Learning)",
        "tools": ["Audio Summary", "Mind Map View"],
    },
    {
        "intention": "Summarizing Books and Articles (Dive Deep Mode)",
        "tools": ["Timer and Difficulty Indicator", "Meaning Translator in Reference to Book", "Make Your Own Notes", "Interactive Quiz", "Character Profiles", "Chapter-wise Notes with Thematic Messages"],
    },
    {
        "intention": "Studying for Exams",
        "tools": ["Custom Study Plan", "Flashcard Decks", "Pomodoro Sheet/Timer", "Skill Assessment Quiz", "Progress Tracker", "Resource Kit"],
    },
    {
        "intention": "Creative Writing",
        "tools": ["Character Profile Template", "Plot Twist Generator", "Dialogue Style Guide", "Writing Prompts", "Story Structure Templates"],
    },
    {
        "intention": "Language Translation",
        "tools": ["Translation Flip Game", "Grammar Error Detection", "Context-Aware Translation", "Cultural Context Guides"],
    },
    {
        "intention": "Math Problem Solving",
        "tools": ["Step-by-Step Solutions", "Formula Reference Sheets", "Practice Problem Generator", "Visual Math Explanations"],
    },
    {
        "intention": "Research and Fact-Checking",
        "tools": ["Source Verification Tools", "Citation Generator", "Research Methodology Guides", "Fact-Check Templates"],
    },
    {
        "intention": "Cooking and Recipe Assistance",
        "tools": ["Recipe Converter", "Substitution Guide", "Cooking Timer", "Nutritional Calculator", "Meal Planning Templates"],
    },
    {
        "intention": "Fitness and Health Planning",
        "tools": ["Workout Planner", "Progress Tracker", "Nutrition Guide", "Goal Setting Templates", "Exercise Library"],
    },
    {
        "intention": "Financial Planning and Budgeting",
        "tools": ["Budget Templates", "Expense Tracker", "Investment Calculator", "Debt Payoff Planner", "Financial Goal Tracker"],
    },
    {
        "intention": "Home Organization and Cleaning",
        "tools": ["Cleaning Checklists", "Organization Systems", "Decluttering Guides", "Maintenance Schedules", "Storage Solutions"],
    },
    {
        "intention": "Pet Care and Training",
        "tools": ["Training Schedules", "Health Tracking", "Behavior Guides", "Feeding Calculators", "Vet Appointment Trackers"],
    },
    {
        "intention": "Gardening and Plant Care",
        "tools": ["Planting Calendars", "Watering Schedules", "Plant Care Guides", "Garden Layout Planners", "Pest Identification"],
    },
    {
        "intention": "DIY and Home Improvement",
        "tools": ["Project Planners", "Tool Lists", "Safety Checklists", "Material Calculators", "Step-by-Step Guides"],
    },
    {
        "intention": "Photography and Image Editing",
        "tools": ["Composition Guides", "Editing Tutorials", "Equipment Recommendations", "Photo Organization Systems", "Lighting Tips"],
    },
    {
        "intention": "Music Learning and Practice",
        "tools": ["Practice Schedules", "Chord Charts", "Metronome Tools", "Progress Trackers", "Song Libraries"],
    },
    {
        "intention": "Event Planning and Organization",
        "tools": ["Event Checklists", "Timeline Templates", "Budget Planners", "Guest Management", "Vendor Comparison Sheets"],
    },
    {
        "intention": "Job Search and Career Development",
        "tools": ["Resume Templates", "Interview Preparation", "Skill Assessment", "Networking Guides", "Career Path Planners"],
    },
    {
        "intention": "Small Business Management",
        "tools": ["Business Plan Templates", "Marketing Strategies", "Financial Tracking", "Customer Management", "Inventory Systems"],
    },
    {
        "intention": "Mental Health and Wellness",
        "tools": ["Mood Trackers", "Meditation Guides", "Stress Management", "Self-Care Checklists", "Therapy Resources"],
    },
    {
        "intention": "Parenting and Child Development",
        "tools": ["Development Milestones", "Activity Ideas", "Discipline Strategies", "Educational Resources", "Health Trackers"],
    },
    {
        "intention": "Senior Care and Aging",
        "tools": ["Health Monitoring", "Safety Checklists", "Activity Planning", "Medication Management", "Support Resources"],
    }
]

# Enhanced keyword indicators for intent classification
CASUAL_INDICATORS = {
    # Personal questions
    'age', 'name', 'how are you', 'hello', 'hi', 'thanks', 'thank you',
    'good morning', 'good night', 'how old', 'where are you', 'who are you',
    'what are you', 'nice to meet', 'goodbye', 'bye', 'see you',
    
    # Greetings and pleasantries
    'hey', 'howdy', 'good afternoon', 'good evening', 'nice weather',
    'how\'s it going', 'what\'s up', 'sup', 'greetings', 'salutations',
    
    # Personal information queries
    'your birthday', 'your favorite', 'do you like', 'have you ever',
    'where were you born', 'what do you think about', 'your opinion',
    'tell me about yourself', 'introduce yourself', 'your hobbies',
    'your interests', 'do you have friends', 'are you married',
    'do you sleep', 'do you dream', 'do you eat', 'what do you do for fun',
    
    # Existential/philosophical casual questions
    'are you real', 'are you alive', 'do you have feelings', 'are you conscious',
    'what\'s your purpose', 'why do you exist', 'are you happy', 'do you get bored',
    
    # Small talk
    'nice talking', 'chat', 'just curious', 'random question', 'by the way',
    'anyway', 'just wondering', 'quick question about you',
    
    # Compliments/social
    'you\'re cool', 'you\'re smart', 'you\'re helpful', 'i like you',
    'you\'re funny', 'thanks for chatting',
    
    # Time-related casual
    'what time is it', 'what day is it', 'when were you created',
    'how long have you existed'
}

TASK_INDICATORS = {
    # Core action verbs
    'help', 'create', 'write', 'generate', 'make', 'build', 'plan', 'design',
    'learn', 'study', 'practice', 'improve', 'edit', 'review', 'analyze',
    'solve', 'fix', 'debug', 'explain', 'teach', 'guide', 'tutorial',
    
    # Learning/education
    'understand', 'master', 'memorize', 'quiz me', 'test me', 'lesson',
    'homework', 'assignment', 'project', 'research', 'summarize',
    'outline', 'notes', 'flashcards', 'study guide',
    
    # Writing/content creation
    'essay', 'article', 'blog post', 'story', 'poem', 'script',
    'resume', 'cover letter', 'email', 'proposal', 'report',
    'proofread', 'grammar', 'spelling', 'rewrite', 'paraphrase',
    
    # Programming/technical
    'code', 'program', 'algorithm', 'function', 'debug', 'optimize',
    'refactor', 'comment', 'documentation', 'api', 'database',
    'website', 'app', 'software', 'bug', 'error', 'syntax',
    
    # Problem-solving
    'calculate', 'compute', 'formula', 'equation', 'math', 'statistics',
    'logic', 'reasoning', 'solution', 'approach', 'method', 'strategy',
    
    # Creative/design
    'brainstorm', 'idea', 'concept', 'prototype', 'mockup', 'wireframe',
    'logo', 'banner', 'poster', 'presentation', 'slide', 'template',
    
    # Business/productivity
    'schedule', 'organize', 'manage', 'prioritize', 'workflow',
    'process', 'checklist', 'timeline', 'budget', 'forecast',
    'meeting', 'agenda', 'presentation', 'pitch',
    
    # Analysis/research
    'compare', 'contrast', 'evaluate', 'assess', 'investigate',
    'explore', 'examine', 'interpret', 'classify', 'categorize',
    
    # Goal-oriented language
    'achieve', 'accomplish', 'complete', 'finish', 'deliver',
    'implement', 'execute', 'perform', 'optimize', 'enhance'
}

CASUAL_PATTERNS = [
    # Personal information patterns
    r'\b(what|how|where|who|when)\s+(is|are|was|were)\s+(your|you)\b',
    r'\b(tell me about yourself|introduce yourself)\b',
    r'\b(how old are you|what\'s your age)\b',
    r'\b(do you (like|have|know|think|feel|remember))\b',
    r'\b(are you (real|alive|happy|sad|tired|busy))\b',
    r'\b(what do you (think|feel|like|prefer))\b',
    r'\b(have you (ever|been|seen|heard))\b',
    
    # Greetings and social patterns
    r'\b(hi|hello|hey|good (morning|afternoon|evening|night))\b',
    r'\b(how (are|is) (you|things|everything))\b',
    r'\b(what\'s (up|new|happening))\b',
    r'\b(nice (to meet|talking|chatting))\b',
    r'\b(thanks|thank you|goodbye|bye|see you)\b',
    
    # Existential/philosophical casual questions
    r'\b(what is (life|love|happiness|the meaning))\b',
    r'\b(do you believe in)\b',
    r'\b(what\'s your (favorite|opinion on))\b',
    
    # Just chatting indicators
    r'\b(just (wondering|curious|asking|chatting))\b',
    r'\b(random question|quick question about you)\b',
    r'\b(by the way|anyway)\b'
]

TASK_PATTERNS = [
    # Direct requests
    r'\b(can you|could you|please|would you)\s+(help|create|write|make|build)\b',
    r'\b(i need (help|assistance) with)\b',
    r'\b(how (do i|can i|to))\s+(create|make|build|solve|fix|learn)\b',
    
    # Learning patterns
    r'\b(teach me|show me|explain)\s+(how to|about)\b',
    r'\b(i want to (learn|understand|master|study))\b',
    r'\b(help me (with|understand|learn))\b',
    
    # Problem-solving patterns
    r'\b(solve|fix|debug|resolve|troubleshoot)\b',
    r'\b(what\'s wrong with|why (isn\'t|doesn\'t|won\'t))\b',
    r'\b(how do i (fix|solve|resolve))\b',
    
    # Creation patterns
    r'\b(create|generate|make|build|design|write)\s+(a|an|some)\b',
    r'\b(i\'m (working on|building|creating|writing))\b'
]

SCORING_WEIGHTS = {
    'exact_keyword_match': 1.0,
    'pattern_match': 1.5,
    'context_bonus': 0.5,
    'length_penalty': 0.1
}

# Optimized text preprocessing with caching
@lru_cache(maxsize=1000)
def preprocess_text_cached(text: str) -> str:
    """Cached version of text preprocessing"""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s.,!?-]', ' ', text)
    text = ' '.join(text.split())
    return text

# Optimized keyword extraction with caching
@lru_cache(maxsize=1000)
def extract_keywords_cached(text: str) -> tuple:
    """Cached version of keyword extraction"""
    stop_words = {'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
                 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
                 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
                 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
                 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
                 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
                 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
                 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
                 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'hi',
                 'hello', 'hey', 'want'}
    
    words = text.lower().split()
    keywords = tuple(word for word in words if word not in stop_words and len(word) > 2)
    return keywords

async def load_or_compute_embeddings():
    """Load precomputed embeddings or compute them if not available"""
    global model, intention_embeddings, intention_texts, tools_mapping
    
    embeddings_file = "intention_embeddings.pkl"
    
    try:
        if os.path.exists(embeddings_file):
            print("Loading precomputed embeddings...")
            with open(embeddings_file, 'rb') as f:
                data = pickle.load(f)
                intention_embeddings = data['embeddings']
                intention_texts = data['texts']
                tools_mapping = data['tools']
        else:
            print("Computing embeddings for the first time...")
            # Load model only once with latest recommended settings
            model = SentenceTransformer('all-mpnet-base-v2', device='cuda' if torch.cuda.is_available() else 'cpu')
            
            # Prepare data
            intention_texts = [item["intention"] for item in intention_data]
            tools_mapping = {item["intention"]: item["tools"] for item in intention_data}
            
            # Compute embeddings in batch (much faster)
            intention_embeddings = model.encode(intention_texts, convert_to_tensor=True, show_progress_bar=True)
            
            # Save for future use
            with open(embeddings_file, 'wb') as f:
                pickle.dump({
                    'embeddings': intention_embeddings,
                    'texts': intention_texts,
                    'tools': tools_mapping
                }, f)
        
        # Load model for query encoding if not already loaded
        if model is None:
            model = SentenceTransformer('all-mpnet-base-v2', device='cuda' if torch.cuda.is_available() else 'cpu')
        
        print(f"Loaded {len(intention_texts)} intentions with precomputed embeddings")
    except Exception as e:
        print(f"Error loading or computing embeddings: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to initialize the model and embeddings"
        )

async def compute_similarity_batch(query_embedding: torch.Tensor) -> np.ndarray:
    """Compute similarities in batch for better performance"""
    def _compute():
        return cosine_similarity(
            query_embedding.cpu().numpy().reshape(1, -1),
            intention_embeddings.cpu().numpy()
        )[0]
    
    # Run in thread pool to avoid blocking
    loop = asyncio.get_event_loop()
    similarities = await loop.run_in_executor(executor, _compute)
    return similarities

def calculate_keyword_bonus(query_keywords: tuple, intention: str, tools: List[str]) -> float:
    """Calculate keyword matching bonus efficiently"""
    if not query_keywords:
        return 0.0
    
    # Create search text once
    search_text = f"{intention.lower()} {' '.join(tool.lower() for tool in tools)}"
    
    # Count matches
    matches = sum(1 for keyword in query_keywords if keyword in search_text)
    return min(0.15, matches * 0.03)  # Max 15% bonus

async def semantic_search_optimized(query: str, threshold: float) -> Dict:
    """Highly optimized semantic search"""
    try:
        # Use cached preprocessing
        processed_query = preprocess_text_cached(query)
        query_keywords = extract_keywords_cached(processed_query)
        
        # Check cache first
        cache_key = f"{processed_query}_{threshold}"
        if cache_key in similarity_cache:
            return similarity_cache[cache_key]
        
        # Encode query (single operation)
        query_embedding = model.encode(processed_query, convert_to_tensor=True)
        
        # Compute all similarities in batch
        base_similarities = await compute_similarity_batch(query_embedding)
        
        # Calculate final scores efficiently
        final_scores = []
        for i, (intention, base_sim) in enumerate(zip(intention_texts, base_similarities)):
            tools = tools_mapping[intention]
            keyword_bonus = calculate_keyword_bonus(query_keywords, intention, tools)
            final_score = base_sim + keyword_bonus
            final_scores.append((intention, final_score, tools))
        
        # Sort once
        final_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Prepare result
        top_match = final_scores[0]
        result = {
            "matched_intention": top_match[0] if top_match[1] >= threshold else None,
            "confidence": float(top_match[1]),
            "tools": top_match[2] if top_match[1] >= threshold else [],
            "is_fallback": top_match[1] < threshold,
            "alternatives": [
                {"intention": intent, "score": float(score)}
                for intent, score, _ in final_scores[1:4]
            ]
        }
        
        # Cache result (limit cache size)
        if len(similarity_cache) < 500:
            similarity_cache[cache_key] = result
        
        return result
        
    except Exception as e:
        print(f"Error in semantic search: {str(e)}")
        return {
            "matched_intention": None,
            "confidence": 0.0,
            "tools": [],
            "is_fallback": True,
            "alternatives": []
        }

def enhanced_classify_general_intent(query: str) -> Dict:
    """Enhanced intent classification with comprehensive indicators"""
    
    query_lower = query.lower().strip()
    
    # Calculate scores
    casual_score = 0
    task_score = 0
    
    # Keyword matching with case-insensitive search
    for indicator in CASUAL_INDICATORS:
        if indicator in query_lower:
            casual_score += SCORING_WEIGHTS['exact_keyword_match']
    
    for indicator in TASK_INDICATORS:
        if indicator in query_lower:
            task_score += SCORING_WEIGHTS['exact_keyword_match']
    
    # Pattern matching (more reliable than keywords)
    for pattern in CASUAL_PATTERNS:
        if re.search(pattern, query_lower):
            casual_score += SCORING_WEIGHTS['pattern_match']
    
    for pattern in TASK_PATTERNS:
        if re.search(pattern, query_lower):
            task_score += SCORING_WEIGHTS['pattern_match']
    
    # Context and length considerations
    query_length = len(query.split())
    
    # Very short queries are often casual
    if query_length <= 3:
        casual_score += SCORING_WEIGHTS['context_bonus']
    # Longer queries are often task-oriented
    elif query_length > 10:
        task_score += SCORING_WEIGHTS['context_bonus']
    
    # Question word analysis
    question_words = ['what', 'how', 'why', 'when', 'where', 'who', 'which']
    starts_with_question = any(query_lower.startswith(qw) for qw in question_words)
    
    if starts_with_question:
        # Questions about personal info are casual
        if any(personal in query_lower for personal in ['your', 'you are', 'you have']):
            casual_score += SCORING_WEIGHTS['context_bonus']
        # Questions about how to do something are task-oriented
        elif 'how to' in query_lower or 'how do' in query_lower or 'how can' in query_lower:
            task_score += SCORING_WEIGHTS['context_bonus']
    
    # Final classification
    total_score = casual_score + task_score
    
    if total_score == 0:
        # No clear indicators - use length and structure as fallback
        if query_length <= 5 and starts_with_question:
            return {"category": "casual", "confidence": 0.6}
        else:
            return {"category": "task", "confidence": 0.4}
    
    casual_confidence = casual_score / total_score
    task_confidence = task_score / total_score
    
    if casual_confidence > task_confidence:
        return {
            "category": "casual", 
            "confidence": min(0.95, 0.5 + casual_confidence * 0.4),
            "scores": {"casual": casual_score, "task": task_score}
        }
    else:
        return {
            "category": "task", 
            "confidence": min(0.95, 0.5 + task_confidence * 0.4),
            "scores": {"casual": casual_score, "task": task_score}
        }

@app.on_event("startup")
async def startup_event():
    """Initialize embeddings on startup"""
    try:
        await load_or_compute_embeddings()
    except Exception as e:
        print(f"Failed to initialize on startup: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to initialize the application"
        )

@app.post("/classify-intent", response_model=IntentResponse)
async def classify_intent(request: IntentRequest):
    start_time = time.time()
    
    # First, classify if the query is casual or task-oriented
    general_intent = enhanced_classify_general_intent(request.prompt)
    
    # If it's a casual conversation, return early with appropriate response
    if general_intent["category"] == "casual":
        response = IntentResponse(
            matched_intention=None,
            confidence=general_intent["confidence"],
            recommended_tools=[],
            is_fallback=True,
            alternative_intentions=[]
        )
        return response
    
    # For task-oriented queries, proceed with semantic search
    result = await semantic_search_optimized(request.prompt, request.threshold)
    
    if result["is_fallback"]:
        response = IntentResponse(
            matched_intention=result["matched_intention"],
            confidence=result["confidence"],
            recommended_tools=[],
            is_fallback=True,
            alternative_intentions=[
                AlternativeIntention(intention=alt["intention"], score=alt["score"])
                for alt in result["alternatives"]
            ]
        )
    else:
        # Prepare tool recommendations efficiently
        tools = [
            ToolRecommendation(
                name=tool_name,
                description=tools_database.get(tool_name, "Tool for learning and skill development"),
                confidence=min(1.0, result["confidence"] * 0.9)
            )
            for tool_name in result["tools"][:5]
        ]
        
        response = IntentResponse(
            matched_intention=result["matched_intention"],
            confidence=result["confidence"],
            recommended_tools=tools,
            is_fallback=False,
            alternative_intentions=[
                AlternativeIntention(intention=alt["intention"], score=alt["score"])
                for alt in result["alternatives"]
            ]
        )
    
    end_time = time.time()
    print(f"Request processed in {end_time - start_time:.3f} seconds")
    
    return response

# Keep the original tools_database for compatibility
tools_database = {
    "Meme Templates": "Pre-designed Canva/Adobe Spark templates for quick meme creation",
    "Branding Checklist": "A PDF checklist for consistency (fonts, colors, tone)",
    "Image Editing Shortcuts": "Cheat sheets for GIMP/Pixlr tools (e.g., layers, filters)",
    "Color Palette Generator": "Use Coolors.co to save hex codes for brand colors",
    "Font Pairing Guide": "A visual PDF of complementary fonts (e.g., Google Fonts)",
    "Royalty-Free Image Libraries": "Bookmark sites like Unsplash/Pexels for quick access",
    "Content Calendar Template": "A Google Sheets grid for scheduling posts",
    "Swipe File": "A folder of screenshots/PDFs for inspiration (ads, captions, designs)",
    "Thumbnail Templates": "Pre-sized YouTube/Instagram thumbnail designs in Canva",
    "Hashtag Lists": "Organized spreadsheets of niche hashtags for social media",
    "Style Guide PDF": "Downloadable AP/Chicago Manual rules for quick reference",
    "Proofreading Checklist": "A step-by-step list (grammar, punctuation, flow)",
    "Readability Score Tools": "Hemingway Editor's readability stats for clarity",
    "Common Error List": "A cheat sheet of frequent mistakes (e.g., your/you're)",
    "Text-to-Speech Tools": "Use NaturalReader to listen for awkward phrasing",
    "Redundancy List": "A PDF of phrases to avoid (e.g., 'absolutely essential')",
    "Consistency Tracker": "Spreadsheet to track terms (e.g., UK vs. US spelling)",
    "PDF Markup Guides": "Shortcuts for Adobe Acrobat's comment/highlight tools",
    "Flashcard Decks": "Pre-made Anki decks for SAT/GRE vocabulary",
    "Grammar Cheat Sheets": "One-page PDFs for tenses, prepositions, articles",
    "Daily Writing Prompts": "A printable list of 30 prompts for practice",
    "Vocabulary Tracker": "Google Sheets template to log new words + examples",
    "Common Mistake Guides": "PDFs targeting errors (e.g., affect vs. effect)",
    "Idiom Dictionary": "A curated PDF of idioms with meanings/examples",
    "Root Word List": "Greek/Latin roots with definitions (e.g., 'bio' = life)",
    "Synonym Wheels": "Visual charts of word alternatives (e.g., 'happy')",
    "Grammar Quizzes": "Printable worksheets with answer keys",
    "Word-of-the-Day Calendar": "A PDF calendar with daily vocabulary",
    "Learning Style Quiz PDF": "Self-assessment to identify visual/auditory preferences",
    "Goal-Setting Template": "A Notion/Google Docs table for SMART goals",
    "Resource Library": "A Notion database of bookmarked articles/videos",
    "Progress Tracker": "A Google Sheets bar chart for skill milestones",
    "Reflection Journal Template": "Prompts for weekly learning reviews",
    "Skill Tree Diagram": "A visual roadmap of sub-skills to master (e.g., coding)",
    "Time Audit Sheet": "Track daily activities to optimize study hours",
    "Bookmark Organizer": "Use Raindrop.io to tag/categorize learning links",
    "Note-Taking Templates": "Customizable layouts for Cornell/outline methods",
    "Reward System Chart": "A printable sticker chart for achieving mini-goals",
    "Skill Roadmap PDF": "Step-by-step guides (e.g., 'Learn Python in 6 Months')",
    "Project Checklist": "Break skills into projects (e.g., 'Build a website')",
    "Resource Kit": "Curated PDFs/links for free courses (Coursera, YouTube)",
    "30-Day Challenge Calendar": "A printable calendar with daily tasks",
    "Troubleshooting Guide": "Common errors + fixes for coding/DIY skills",
    "Project Templates": "Pre-designed Figma/Excel templates for practice",
    "Skill Assessment Quiz": "A self-test to gauge baseline knowledge",
    "Habit Tracker": "A Google Sheets grid to log daily practice",
    "Feedback Template": "A Google Form to collect peer reviews on projects",
    "Pomodoro Sheet": "Printable timetables for focused skill-building sessions",
    "Eisenhower Matrix": "Quadrant-based grid (Urgent/Important) for task sorting",
    "Time Blocking Planner": "Pre-formatted hourly schedule templates",
    "2-Minute Rule Prompt": "If it takes <2 mins, do it now ⏱️",
    "Priority Ranking": "Simple 1-5 scale labels (e.g., '🔥 High Priority')",
    "Procrastination Triggers List": "Common causes (e.g., fear of failure) + fixes",
    "Pomodoro Timer Link": "Pre-set timers for 25/5-minute cycles",
    "Reward System": "'Complete X → Reward Y' templates",
    "Progress Celebrator": "Auto-highlight milestones (e.g., '50% done! 🎉')",
    "Motivational Quote Bank": "Categorized by themes (perseverance, creativity)",
    "Streak Tracker": "Visual counter (e.g., '🔥 7-Day Streak!')",
    "Failure Reframer": "Positive spins (e.g., 'Mistakes = Learning 📈')",
    "Energy Check-In": "Rate your focus [🟩🟩⬜⬜⬜] → Take a break?",
    "Vision Board Snippets": "Imagery/text snippets for goal visualization",
    "Self-Care Nudge": "Hydrate 🚰 | Stretch 🧘 | Breathe 🌬️",
    "Code Learning Roadmaps": "Structured learning paths for different programming languages",
    "Practice Project Ideas": "Hands-on coding projects for skill development",
    "Debugging Guides": "Step-by-step debugging techniques and tools",
    "Code Review Checklists": "Quality assurance checklists for code reviews",
    "Algorithm Practice": "Coding challenges and algorithm exercises",
    "Development Environment Setup": "IDE and toolchain configuration guides",
    "Version Control Guides": "Git workflows and best practices",
    "Documentation Templates": "Templates for technical documentation",
    "Step-by-Step Code Explanation": "Detailed code breakdowns and explanations",
    "Algorithm Optimization Suggestions": "Performance improvement recommendations",
    "Code Profiling & Bottleneck Identification": "Performance analysis tools",
    "Auto-Generate Unit Tests & Documentation": "Automated testing and documentation tools",
    "Experiment with Code Variants": "Alternative implementation approaches"
}

@app.get("/")
async def root():
    return {"message": "Optimized Intent Classification API is running!"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "cache_size": len(similarity_cache),
        "intentions_loaded": len(intention_texts) if intention_texts else 0
    }

@app.post("/speak")
async def text_to_speech(request: TTSRequest):
    """Handle TTS requests"""
    try:
        API_KEY = os.getenv('ELEVENLABS_API_KEY')
        if not API_KEY:
            raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY not found in environment variables")

        # Get voice ID
        voice_id = request.character.get('voiceId')
        if not voice_id and request.character.get('role'):
            role = request.character['role'].lower()
            voice_id = VOICE_MAPPING.get(role)

        if not voice_id:
            raise HTTPException(status_code=400, detail="No valid voice ID found")

        # Call ElevenLabs API
        response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": API_KEY,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg"
            },
            json={
                "text": request.text,
                "model_id": "eleven_monolingual_v1"
            }
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"TTS API error: {response.text}"
            )

        return StreamingResponse(
            io.BytesIO(response.content),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"}
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"TTS processing failed: {str(e)}"
        )


import requests
import json
from typing import List, Dict
import time

# Test sentences for each intent category
TEST_SENTENCES = {
    "Creating Memes or Marketing Content": [
        "I need to create viral memes for my brand's social media campaign that will resonate with Gen Z audiences while maintaining professional aesthetics",
        "Looking for tools to design eye-catching marketing materials that incorporate our brand's color scheme and messaging guidelines",
        "Need to generate engaging social media content that balances humor with brand values while maximizing shareability"
    ],
    "Editing and Proofreading Text": [
        "I need to polish this academic paper to ensure it meets journal standards while maintaining the author's voice and technical accuracy",
        "Looking for ways to improve the clarity and flow of this technical documentation while preserving its precision",
        "Need to proofread this legal document for consistency in terminology and proper formatting of citations"
    ],
    "Improving Grammar and Vocabulary": [
        "I want to enhance my academic writing skills to better articulate complex ideas and arguments in my research papers",
        "Looking to expand my professional vocabulary to communicate more effectively in business meetings and presentations",
        "Need to improve my grammar to write more compelling and error-free content for my blog"
    ],
    "Personalizing Learning": [
        "I want to create a customized learning path that adapts to my learning style and helps me master data science concepts",
        "Looking for ways to optimize my study schedule based on my cognitive patterns and energy levels",
        "Need to develop a personalized approach to learning a new language that fits my busy schedule"
    ],
    "Learning New Skills": [
        "I want to master web development by building practical projects while learning best practices and industry standards",
        "Looking to acquire advanced photography skills through hands-on practice and expert feedback",
        "Need to learn project management methodologies while working on real-world scenarios"
    ],
    "Prioritizing Tasks or Overcoming Procrastination": [
        "I need to reorganize my workflow to handle multiple projects while maintaining quality and meeting deadlines",
        "Looking for strategies to overcome my tendency to delay important tasks and improve productivity",
        "Need to balance urgent client requests with long-term strategic initiatives"
    ],
    "Seeking Encouragement or Motivation": [
        "I'm feeling overwhelmed with my goals and need strategies to maintain momentum and stay focused",
        "Looking for ways to stay motivated while working on long-term projects with delayed gratification",
        "Need to overcome self-doubt and build confidence in my ability to achieve challenging objectives"
    ],
    "Providing Feedback on Assignments": [
        "I need to provide constructive feedback on student essays that balances criticism with encouragement",
        "Looking for ways to evaluate team members' work while maintaining professional relationships",
        "Need to assess project deliverables while providing actionable improvement suggestions"
    ],
    "Simulating Characters for Games/Stories": [
        "I want to create complex characters with rich backstories and motivations for my fantasy novel",
        "Looking to develop NPCs with unique personalities and behaviors for my role-playing game",
        "Need to design antagonists with compelling reasons for their actions and believable character arcs"
    ],
    "Exploring Philosophical/Ethical Questions": [
        "I want to analyze the ethical implications of artificial intelligence in healthcare decision-making",
        "Looking to explore the philosophical foundations of modern political systems",
        "Need to examine the moral dimensions of climate change and individual responsibility"
    ],
    "Generating Fictional Characters, Worlds, or Societies": [
        "I want to create a detailed fantasy world with its own history, cultures, and magical systems",
        "Looking to develop a science fiction universe with consistent technology and social structures",
        "Need to design a post-apocalyptic society with unique survival mechanisms and social hierarchies"
    ],
    "Planning Travel Itineraries": [
        "I need to plan a month-long backpacking trip across Southeast Asia with a flexible budget",
        "Looking to organize a family vacation that balances activities for different age groups",
        "Need to coordinate a business trip with multiple meetings and cultural experiences"
    ],
    "Providing Shopping Advice or Product Comparisons": [
        "I want to compare different laptop models for professional video editing while considering future upgrades",
        "Looking to evaluate various home security systems based on features, reliability, and cost",
        "Need to assess different fitness trackers for their accuracy and integration with existing devices"
    ],
    "Simplifying or Rewriting Complex Texts": [
        "I need to make this technical manual more accessible to non-technical users while preserving accuracy",
        "Looking to rewrite this legal document in plain language while maintaining its legal validity",
        "Need to simplify this scientific paper for a general audience without losing key information"
    ],
    "Entertainment (Jokes, Stories, Games)": [
        "I want to create an interactive story with multiple endings and character choices",
        "Looking to develop a party game that combines strategy with social interaction",
        "Need to write comedy sketches that appeal to diverse audiences while maintaining originality"
    ],
    "Creating Lesson Plans": [
        "I need to design a comprehensive curriculum for teaching programming to beginners",
        "Looking to create engaging lesson plans for teaching history to middle school students",
        "Need to develop interactive workshops for teaching public speaking skills"
    ],
    "Creating Scripts for Videos/Podcasts": [
        "I want to write a podcast script that balances entertainment with educational content",
        "Looking to create video scripts that maintain viewer engagement while delivering information",
        "Need to develop interview questions that elicit detailed and insightful responses"
    ],
    "Generating AI Art Prompts": [
        "I want to create prompts for generating surreal landscapes with specific artistic styles",
        "Looking to design prompts for character portraits with unique visual elements",
        "Need to generate prompts for abstract art that conveys specific emotions"
    ],
    "Designing User Interfaces": [
        "I need to create an intuitive interface for a complex data visualization dashboard",
        "Looking to design a mobile app interface that accommodates various user needs",
        "Need to develop a website layout that balances aesthetics with functionality"
    ],
    "Prototyping Software Tools": [
        "I want to create a prototype for a project management tool with unique features",
        "Looking to develop a proof of concept for an AI-powered writing assistant",
        "Need to design a prototype for a social media analytics platform"
    ],
    "Writing Technical Documentation": [
        "I need to create comprehensive API documentation that's accessible to developers of all levels",
        "Looking to write user guides for complex software with multiple features",
        "Need to develop technical specifications for a new system architecture"
    ],
    "Writing Essays Reports or Academic Papers": [
        "I want to write a research paper analyzing the impact of social media on mental health",
        "Looking to create a comprehensive business report on market trends and opportunities",
        "Need to develop an academic essay comparing different philosophical theories"
    ],
    "Advanced Code Learning and Analysis": [
        "I want to understand the performance implications of different sorting algorithms",
        "Looking to analyze the security vulnerabilities in this codebase",
        "Need to optimize this database query for better performance"
    ],
    "Practicing Conversation in Different Languages": [
        "I want to practice business negotiations in Spanish with native speakers",
        "Looking to improve my French conversation skills for daily interactions",
        "Need to practice technical discussions in Japanese for my work"
    ],
    "Summarizing Books and Articles": [
        "I need to create a comprehensive summary of this research paper for my team",
        "Looking to develop a concise overview of this novel for a book club discussion",
        "Need to summarize this technical article for non-technical stakeholders"
    ]
}

def test_intent_api(sentence: str, threshold: float = 0.35) -> Dict:
    """Test a single sentence against the intent API"""
    url = "http://localhost:8000/classify-intent"
    payload = {
        "prompt": sentence,
        "threshold": threshold
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error testing sentence: {e}")
        return None

def run_tests():
    """Run tests for all sentences and print results"""
    results = []
    
    for intent, sentences in TEST_SENTENCES.items():
        print(f"\nTesting intent: {intent}")
        print("-" * 50)
        
        for sentence in sentences:
            print(f"\nTesting sentence: {sentence}")
            result = test_intent_api(sentence)
            
            if result:
                print(f"Matched intent: {result.get('matched_intention', 'None')}")
                print(f"Confidence: {result.get('confidence', 0):.2f}")
                print(f"Is fallback: {result.get('is_fallback', True)}")
                
                if result.get('recommended_tools'):
                    print("\nRecommended tools:")
                    for tool in result['recommended_tools']:
                        print(f"- {tool['name']} (confidence: {tool['confidence']:.2f})")
                
                if result.get('alternative_intentions'):
                    print("\nAlternative intentions:")
                    for alt in result['alternative_intentions']:
                        print(f"- {alt['intention']} (score: {alt['score']:.2f})")
            
            # Add a small delay to avoid overwhelming the API
            time.sleep(0.5)
            
        print("\n" + "=" * 50)

if __name__ == "__main__":
    run_tests() 
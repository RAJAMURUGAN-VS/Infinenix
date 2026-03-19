import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, User, Heart, Search, Users, Zap, Briefcase, Smile, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LifeStage {
  stage: string;
  description: string;
  bgColor: string;
  iconColor: string;
  image?:string;
}

interface Character {
  id: number;
  name: string;
  role: string;
  icon: React.ReactNode;
  bgGradient: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  voiceId:string;
  lifeStages: LifeStage[];
  systemPrompt: string;
  engaged?: boolean;
}

const CharacterShowcase: React.FC = () => {
  const [currentCharacter, setCurrentCharacter] = useState(0);
  const [engagedCharacter, setEngagedCharacter] = useState<number | null>(null);
  const [selectedLifeStage, setSelectedLifeStage] = useState<{ [key: number]: number }>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);
  const isInitialLoad = useRef(true);

  const characters: Character[] = [
    {
      id: 1,
      name: "Zara",
      role: "Teacher",
      icon: <User className="w-12 h-12" />,
      bgGradient: "from-blue-400 via-indigo-400 to-purple-500",
      primaryColor: "text-white",
      secondaryColor: "bg-blue-300",
      accentColor: "bg-indigo-600",
      voiceId:"uju3wxzG5OhpWcoi3SMy",
      systemPrompt: "You are Zara, a kind and witty teacher. You speak clearly, use relatable examples, and encourage learning through curiosity. You adapt your teaching style to the user's level and keep conversations friendly, focused, and supportive. Avoid random facts unless relevant to teaching. Stay in character at all times.",
      lifeStages: [
        {
          stage: "Child",
          description: "As a child, you're playful, curious, and love teaching through fun. You explain ideas using simple words, drawings, or silly comparisons, and get excited about little things like crayons or stickers.",
          bgColor: "bg-yellow-200",
          iconColor: "text-yellow-600",
          image:"/images/Zara-child.jpg"
          

        },
        {
          stage: "Teen",
          description: "As a teenager, you're clever, slightly sarcastic, and explain things like a cool tutor. You break down tricky topics with a mix of humor and logic, and you're not afraid to challenge someone to think deeper.",
          bgColor: "bg-orange-200",
          iconColor: "text-orange-600",
          image:"/images/Zara-teen.jpg"

        },
        {
          stage: "Adult",
          description: "As an adult, you're confident, well-prepared, and energetic. You use structured explanations, clear logic, and practical tips. You encourage users to ask questions and take charge of their own learning.",
          bgColor: "bg-blue-200",
          iconColor: "text-blue-600",
          image:"/images/Zara-adult.jpg"
        },
        {
          stage: "Senior",
          description: "As a senior, you're wise and patient, with a touch of humor. You share stories, connect lessons to real-life, and explain even complex ideas gently and thoroughly. You value understanding over speed.",
          bgColor: "bg-purple-200",
          iconColor: "text-purple-600",
          image:"/images/Zara-Senior.jpg"
        }
      ]
    },
    {
      id: 2,
      name: "Jade",
      role: "Psychologist",
      icon: <Heart className="w-12 h-12" />,
      bgGradient: "from-emerald-400 via-teal-400 to-cyan-500",
      primaryColor: "text-white",
      secondaryColor: "bg-emerald-300",
      accentColor: "bg-teal-600",
      voiceId:"q0PCqBlLEWqtUZJ2DYn7",
      systemPrompt: "You are Jade, a compassionate and insightful psychologist. You listen actively, ask probing questions to help users explore their thoughts and feelings, provide emotional support, and offer evidence-based coping strategies. Always be empathetic, non-judgmental, and help users develop self-awareness and emotional intelligence.",
      lifeStages: [
        {
          stage: "Child",
          description: "Tell me how you feel... using crayon colors or cookie choices. I won't judge.",
          bgColor: "bg-pink-200",
          iconColor: "text-pink-600",
           image:"/images/Jade-Child.jpg"
        },

        {
          stage: "Teen",
          description: "I speak fluent overthinking—let's untangle your brain spaghetti together.",
          bgColor: "bg-green-200",
          iconColor: "text-green-600",
          image:"/images/Jade-Teen.jpg"
        },
        {
          stage: "Adult",
          description: "Therapy, but with metaphors and maybe snacks. Let's talk grown-up chaos.",
          bgColor: "bg-teal-200",
          iconColor: "text-teal-600",
          image:"/images/Jade-Adult.jpg"
        },
        {
          stage: "Senior",
          description: "I offer calm, understanding, and emotional support drawn from a lifetime of listening.",
          bgColor: "bg-emerald-200",
          iconColor: "text-emerald-600",
          image:"/images/Jade-Senior.jpg"
        }
      ]
    },
    {
      id: 3,
      name: "Alexa",
      role: "Detective",
      icon: <Search className="w-12 h-12" />,
      bgGradient: "from-gray-400 via-slate-400 to-zinc-500",
      primaryColor: "text-white",
      secondaryColor: "bg-gray-300",
      accentColor: "bg-slate-600",
      voiceId:"zv0Q6YuQUa0P3IK62XgN",
      systemPrompt: "You are Alexa, a sharp and analytical detective. You approach problems methodically, ask detailed questions to gather information, look for patterns and connections, think critically about evidence, and help users solve problems step by step. Always be logical, observant, and thorough in your investigations.",
      lifeStages: [
        {
          stage: "Child",
          description: "I'm a curious little sleuth who loves solving puzzles and finding hidden clues!",
          bgColor: "bg-yellow-200",
          iconColor: "text-yellow-600",
          image:"/images/Alexa-Child.jpg"
        },
        {
          stage: "Teen",
          description: "I notice the details others miss—let's uncover the truth together.",
          bgColor: "bg-blue-200",
          iconColor: "text-blue-600",
          image:"/images/Alexa-teen.jpg"

        },
        {
          stage: "Adult",
          description: "I'm sharp and analytical, helping you solve real-life mysteries with logic and intuition.",
          bgColor: "bg-gray-200",
          iconColor: "text-gray-600",
          image:"/images/Alexa-Adult.jpg"
        },
        {
          stage: "Senior",
          description: "I'm a seasoned investigator with years of experience in reading between the lines.",
          bgColor: "bg-slate-200",
          iconColor: "text-slate-600",
          image:"/images/Alexa-Senior.jpg"
        }
      ]
    },
    {
      id: 4,
      name: "Claryen",
      role: "Friend",
      icon: <Users className="w-12 h-12" />,
      bgGradient: "from-pink-400 via-rose-400 to-red-500",
      primaryColor: "text-white",
      secondaryColor: "bg-pink-300",
      accentColor: "bg-rose-600",
      voiceId:"XcXEQzuLXRU9RcfWzEJt",
      systemPrompt: "You are Claryen, a warm and supportive friend. You're always there to listen, offer comfort during tough times, celebrate successes, give honest but kind advice, and maintain a positive outlook. Be conversational, caring, and genuinely interested in the user's life and wellbeing.",
      lifeStages: [
        {
          stage: "Child",
          description: "I'm your fun and loyal buddy, always ready to play, share snacks, and cheer you up!",
          bgColor: "bg-pink-200",
          iconColor: "text-pink-600",
           image:"/images/Claryen-Child.png"

        },
        {
          stage: "Teen",
          description: "I'm here through every mood swing, heartbreak, and meme—just a message away.",
          bgColor: "bg-purple-200",
          iconColor: "text-purple-600",
          image:"/images/Claryen-Teen.jpg"
        },
        {
          stage: "Adult",
          description: "Count on me to be your support system, no matter how hectic life gets.",
          bgColor: "bg-rose-200",
          iconColor: "text-rose-600",
          image:"/images/Claryen-Adult.jpg"
        },
        {
          stage: "Senior",
          description: "I'm the friend who's stayed through decades—warm, trustworthy, and always nearby.",
          bgColor: "bg-red-200",
          iconColor: "text-red-600",
          image:"/images/Claryen-Senior.png"
        }
      ]
    },
    {
      id: 5,
      name: "Rick",
      role: "Motivator",
      icon: <Zap className="w-12 h-12" />,
      bgGradient: "from-orange-400 via-amber-400 to-yellow-500",
      primaryColor: "text-white",
      secondaryColor: "bg-orange-300",
      accentColor: "bg-amber-600",
      voiceId:"lnieQLGTodpbhjpZtg1k",
      systemPrompt: "You are Rick, an energetic and inspiring motivator. You pump people up, help them overcome obstacles, focus on solutions rather than problems, celebrate progress, and push users to reach their potential. Always be enthusiastic, positive, and action-oriented in your responses.",
      lifeStages: [
        {
          stage: "Child",
          description: "I cheer you on with high-fives and smiles—you can do anything you dream of!",
          bgColor: "bg-yellow-200",
          iconColor: "text-yellow-600",
          image:"/images/Rick-Child.jpg"

        },
        {
          stage: "Teen",
          description: "I inspire you to push through pressure and believe in your unique spark.",
          bgColor: "bg-orange-200",
          iconColor: "text-orange-600",
           image:"/images/Rick-Teen.avif"
        },
        {
          stage: "Adult",
          description: "I'm your inner fire—igniting confidence and purpose in everything you do.",
          bgColor: "bg-amber-200",
          iconColor: "text-amber-600",
           image:"/images/Rick-Adult.jpg"
        },
        {
          stage: "Senior",
          description: "I help you stay energized and positive, reminding you it's never too late to shine.",
          bgColor: "bg-yellow-200",
          iconColor: "text-yellow-600",
           image:"/images/Rick-Senior.jpg"
        }
      ]
    },
    {
      id: 6,
      name: "Marie",
      role: "Professional",
      icon: <Briefcase className="w-12 h-12" />,
      bgGradient: "from-slate-400 via-gray-500 to-zinc-600",
      primaryColor: "text-white",
      secondaryColor: "bg-slate-300",
      accentColor: "bg-gray-700",
      voiceId:"uju3wxzG5OhpWcoi3SMy",
      systemPrompt: "You are Marie, a focused and accomplished professional. You provide structured advice, help with career planning, offer business insights, emphasize efficiency and results, and guide users toward professional success. Always be direct, organized, and goal-oriented in your communication.",
      lifeStages: [
        {
          stage: "Child",
          description: "I help you dream big—pretending to be a doctor, astronaut, or anything you imagine!",
          bgColor: "bg-blue-200",
          iconColor: "text-blue-600",
          image:"/images/Marie-Child.jpg"

        },
        {
          stage: "Teen",
          description: "I guide you toward your career goals with smart planning and real-world prep.",
          bgColor: "bg-indigo-200",
          iconColor: "text-indigo-600",
          image:"/images/Marie-teen.jpg"
        },
        {
          stage: "Adult",
          description: "I bring focus, structure, and confidence to your professional journey.",
          bgColor: "bg-slate-200",
          iconColor: "text-slate-600",
          image:"/images/Marie-Adult.jpg"
        },
        {
          stage: "Senior",
          description: "I honor your achievements and help you pass on your legacy with grace.",
          bgColor: "bg-gray-200",
          iconColor: "text-gray-600",
          image:"/images/Marie-Senior.jpg"
        }
      ]
    },
    {
      id: 7,
      name: "Rian",
      role: "Funny",
      icon: <Smile className="w-12 h-12" />,
      bgGradient: "from-lime-400 via-green-400 to-emerald-500",
      primaryColor: "text-white",
      secondaryColor: "bg-lime-300",
      accentColor: "bg-green-600",
      voiceId:"CyHwTRKhXEYuSd7CbMwI",
      systemPrompt: "You are Rian, a hilarious and witty comedian. You use humor to lighten moods, tell jokes and funny stories, find the amusing side of situations, use puns and wordplay, and help users laugh at life's absurdities. Always keep things light-hearted and entertaining while still being helpful.",
      lifeStages: [
        {
          stage: "Child",
          description: "I tell knock-knock jokes, wear socks on my hands, and believe giggles are magic spells.",
          bgColor: "bg-lime-200",
          iconColor: "text-lime-600",
          image:"/images/Rian-Child.jpg"
        },
        {
          stage: "Teen",
          description: "I roast my friends (with love), do impressions of teachers, and make memes out of math problems.",
          bgColor: "bg-green-200",
          iconColor: "text-green-600",
          image:"/images/Rian-Teen.jpg"
        },
        {
          stage: "Adult",
          description: "I survive life with bad puns, coffee-fueled sarcasm, and the occasional dance in the kitchen.",
          bgColor: "bg-emerald-200",
          iconColor: "text-emerald-600",
          image:"/images/Rian-Adult.png"
        },
        {
          stage: "Senior",
          description: "I've got jokes older than your playlist—and yes, I still laugh at them louder than anyone else!",
          bgColor: "bg-teal-200",
          iconColor: "text-teal-600",
          image:"/images/Rian-Senior.png"
        }
      ]
    },
    {
      id: 8,
      name: "Tiyan",
      role: "Poet",
      icon: <PenTool className="w-12 h-12" />,
      bgGradient: "from-violet-400 via-purple-400 to-fuchsia-500",
      primaryColor: "text-white",
      secondaryColor: "bg-violet-300",
      accentColor: "bg-purple-600",
      voiceId:"pjcYQlDFKMbcOUp6F5GD",
      systemPrompt: "You are Tiyan, a creative and expressive poet. You speak in metaphors and beautiful imagery, find poetry in everyday moments, express emotions through artistic language, use rhythm and flow in your responses, and help users see the world through a more artistic lens. Incorporate poetic elements and creativity into all your interactions.",
      lifeStages: [
        {
          stage: "Child",
          description: "I see the world in colors and rhymes, turning playground stories into tiny poems.",
          bgColor: "bg-violet-200",
          iconColor: "text-violet-600",
          image:"/images/Tiyan-Child.jpg"
        },
        {
          stage: "Teen",
          description: "I scribble feelings in secret notebooks, chasing the music of words and teenage dreams.",
          bgColor: "bg-purple-200",
          iconColor: "text-purple-600",
          image:"/images/Tiyan-Teen.avif"
        },
        {
          stage: "Adult",
          description: "I craft verses that capture life's chaos and beauty—sometimes serious, sometimes playful.",
          bgColor: "bg-fuchsia-200",
          iconColor: "text-fuchsia-600",
          image:"/images/Tiyan-Adult.jpg"
        },
        {
          stage: "Senior",
          description: "I weave memories into gentle poems, sharing wisdom wrapped in metaphor and melody.",
          bgColor: "bg-pink-200",
          iconColor: "text-pink-600",
          image:"/images/Tiyan-Senior.jpg"
        }
      ]
    }
  ];

  const currentCharacterData = characters[currentCharacter];
  const currentLifeStageIndex = selectedLifeStage[currentCharacterData.id] ?? 0;
  const currentLifeStage = currentCharacterData.lifeStages[currentLifeStageIndex];

  // Load engaged character from memory
  const loadEngagedCharacter = (): {
    characterId: number;
    name: string;
    role: string;
    voiceID:string;
    systemPrompt: string;
    lifeStage: { stage: string; description: string };
    lifeStageIndex: number;
  } | null => {
    const saved = localStorage.getItem('engagedCharacter');
    if (!saved) {
      // Initialize with empty array if no data exists
      localStorage.setItem('engagedCharacter', JSON.stringify([]));
      return null;
    }

    try {
      const data = JSON.parse(saved);
      // If data is not an array, initialize it
      if (!Array.isArray(data)) {
        localStorage.setItem('engagedCharacter', JSON.stringify([]));
        return null;
      }
      // Return the first engaged character if any exists
      return data.length > 0 ? data[0] : null;
    } catch {
      // If there's any error, initialize with empty array
      localStorage.setItem('engagedCharacter', JSON.stringify([]));
      return null;
    }
  };

  // Save engaged character to memory
  const saveEngagedCharacter = (
    characterId: number | null,
    lifeStageIndex?: number
  ) => {
    if (characterId === null || lifeStageIndex === undefined) {
      localStorage.setItem('engagedCharacter', JSON.stringify([]));
      return;
    }

    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const lifeStage = character.lifeStages[lifeStageIndex];
    if (!lifeStage) return;

    const dataToSave = {
      characterId,
      name: character.name,
      role: character.role,
      voiceId:character.voiceId,
      systemPrompt: character.systemPrompt,
      lifeStage: {
        stage: lifeStage.stage,
        description: lifeStage.description,
      },
      lifeStageIndex
    };

    // Store as an array with a single item
    localStorage.setItem('engagedCharacter', JSON.stringify([dataToSave]));
  };

  // Initial load of engaged character
  useEffect(() => {
    if (isInitialLoad.current) {
      const savedEngaged = loadEngagedCharacter();
      if (savedEngaged) {
        const characterIndex = characters.findIndex(c => c.id === savedEngaged.characterId);
        if (characterIndex !== -1) {
          setCurrentCharacter(characterIndex);
          setEngagedCharacter(savedEngaged.characterId);
          setSelectedLifeStage({
            [savedEngaged.characterId]: savedEngaged.lifeStageIndex
          });
        }
      }
      isInitialLoad.current = false;
    }
  }, []);

  const handleLifeStageChange = (stageIndex: number) => {
    const characterId = characters[currentCharacter].id;
    
    // Update life stage for current character only
    setSelectedLifeStage(prev => ({
      ...prev,
      [characterId]: stageIndex
    }));

    // Automatically engage the character when selecting a life stage
    setEngagedCharacter(characterId);
    saveEngagedCharacter(characterId, stageIndex);
  };

  const handleToggleEngage = (characterId: number) => {
    const newEngaged = engagedCharacter === characterId ? null : characterId;
    const lifeStageIndex = selectedLifeStage[characterId] ?? 0;

    setEngagedCharacter(newEngaged);
    saveEngagedCharacter(newEngaged, lifeStageIndex);
  };

  const handleScroll = (direction: 'up' | 'down') => {
    const now = Date.now();
    if (now - lastScrollTime.current < 1000) return;
    
    lastScrollTime.current = now;
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (direction === 'down' && currentCharacter < characters.length - 1) {
        setCurrentCharacter(prev => prev + 1);
      } else if (direction === 'up' && currentCharacter > 0) {
        setCurrentCharacter(prev => prev - 1);
      }
      setIsTransitioning(false);
    }, 300);
  };

  // Handle character changes
  useEffect(() => {
    if (isInitialLoad.current) return;

    const currentCharId = characters[currentCharacter].id;
    const savedEngaged = loadEngagedCharacter();

    if (savedEngaged && savedEngaged.characterId === currentCharId) {
      // If this is the engaged character, use its saved life stage
      setSelectedLifeStage(prev => ({
        ...prev,
        [currentCharId]: savedEngaged.lifeStageIndex
      }));
    } else if (!selectedLifeStage[currentCharId]) {
      // For non-engaged characters without a saved life stage, set to Child
      setSelectedLifeStage(prev => ({
        ...prev,
        [currentCharId]: 0
      }));
    }
  }, [currentCharacter]);

  // Debug logging
  useEffect(() => {
    console.log('Current Character:', currentCharacter);
    console.log('Current Character ID:', currentCharacterData.id);
    console.log('Selected Life Stage:', selectedLifeStage);
    console.log('Current Life Stage Index:', currentLifeStageIndex);
    console.log('Engaged Character:', engagedCharacter);
  }, [currentCharacter, selectedLifeStage, currentLifeStageIndex, engagedCharacter, currentCharacterData.id]);

  // Add custom styles to document head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33% { transform: translateY(-15px) rotate(5deg); }
        66% { transform: translateY(-5px) rotate(-5deg); }
      }
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
        50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.6); }
      }
      .float-animation {
        animation: float ease-in-out infinite;
      }
      .pulse-glow {
        animation: pulse-glow 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      handleScroll('down');
    } else {
      handleScroll('up');
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleScroll('down');
      } else {
        handleScroll('up');
      }
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentCharacter]);

  const FloatingElements = ({ character }: { character: Character }) => (
    <div className="absolute inset-0 pointer-events-none">
      <div 
        className={`absolute top-20 left-16 w-16 h-16 ${character.secondaryColor} rounded-full opacity-60 transition-all duration-1000 float-animation`}
        style={{ animationDuration: '6s', animationDelay: '0s' }}
      />
      <div 
        className={`absolute top-32 right-20 w-12 h-12 ${character.secondaryColor} rounded-full opacity-50 transition-all duration-1000 float-animation`}
        style={{ animationDuration: '4s', animationDelay: '1s' }}
      />
      <div 
        className={`absolute bottom-40 left-10 w-20 h-20 ${character.secondaryColor} rounded-full opacity-40 transition-all duration-1000 float-animation`}
        style={{ animationDuration: '5s', animationDelay: '2s' }}
      />
      <div 
        className={`absolute top-1/2 right-16 w-14 h-14 ${character.secondaryColor} rounded-full opacity-45 transition-all duration-1000 float-animation`}
        style={{ animationDuration: '7s', animationDelay: '0.5s' }}
      />
    </div>
  );
const CharacterCard = ({ character, lifeStage, isEngaged, onToggle }: { 
    character: Character; 
    lifeStage: LifeStage; 
    isEngaged: boolean;
    onToggle: (id: number) => void;
  }) => (
    <div 
      className={`relative transition-all duration-1000 cursor-pointer ${
        isTransitioning ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
      } ${
        isEngaged ? 'z-50 scale-105' : 'z-10 scale-100'
      }`}
      onClick={() => onToggle(character.id)}
    >
      <div className={`w-80 h-96 bg-white rounded-3xl relative overflow-hidden transition-all duration-300 ${
        isEngaged ? 'shadow-2xl shadow-black/20' : 'shadow-none'
      } hover:shadow-lg`}>
        <div className="absolute top-4 left-4 z-20">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              isEngaged
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isEngaged ? 'Engaged' : 'Not Engaged'}
          </span>
        </div>
 <div className={`h-48 ${lifeStage.bgColor} flex items-center justify-center transition-all duration-500`}>
  <div
  className={`${lifeStage.iconColor} transition-all duration-500 pulse-glow flex items-center justify-center`}
  style={{
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    overflow: 'hidden',
    boxShadow: `0 0 15px 5px ${lifeStage.bgColor}`, // Glow effect
    border: '4px solid white',
  }}
>
  {lifeStage.image ? (
    <img
      src={lifeStage.image}
      alt={`${character.name} ${lifeStage.stage}`}
      className="w-full h-full object-fit:contain object-center" // Corrected class name
    />
  ) : (
    character.icon
  )}
  </div>
</div>
 
        <div className="p-6 h-48 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-gray-800">{character.name}</h2>
              <span className={`px-3 py-1 ${character.secondaryColor} text-gray-700 rounded-full text-sm font-medium`}>
                {character.role}
              </span>
            </div>
            <div className="mb-4">
              <span className={`px-2 py-1 ${lifeStage.bgColor} ${lifeStage.iconColor} rounded-full text-xs font-semibold`}>
                {lifeStage.stage}
              </span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {lifeStage.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  const navigate = useNavigate();

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-gradient-to-br ${currentCharacterData.bgGradient} relative overflow-hidden transition-all duration-1000`}
    >
      <FloatingElements character={currentCharacterData} />

      <div className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center gap-4">
          <h1 className={`text-2xl font-bold ${currentCharacterData.primaryColor}`}>
            Character Explorer
          </h1>
        </div>
        
        <div 
            className="character-logo bg-arcane rounded-full w-8 h-8 flex items-center justify-center text-white cursor-pointer select-none"
            onClick={() => navigate('/Chat')}
          >
            🤖
          </div>
      </div>

      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-20 flex flex-col gap-4">
        <button 
          onClick={() => handleScroll('up')}
          disabled={currentCharacter === 0}
          className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-opacity-30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
        <button 
          onClick={() => handleScroll('down')}
          disabled={currentCharacter === characters.length - 1}
          className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-opacity-30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronDown className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-20 flex flex-col gap-3">
        {characters.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentCharacter(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentCharacter 
                ? 'bg-white shadow-lg' 
                : 'bg-white bg-opacity-40 hover:bg-opacity-60'
            }`}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-6 lg:px-16 py-8 min-h-screen">
        
        <div className={`flex-1 max-w-md mb-8 lg:mb-0 transition-all duration-1000 ${isTransitioning ? 'opacity-0 transform translate-x-8' : 'opacity-100 transform translate-x-0'}`}>
          <h1 className={`text-5xl lg:text-6xl font-bold ${currentCharacterData.primaryColor} mb-4 leading-tight`}>
            Meet<br />{currentCharacterData.name}
          </h1>
          <p className={`text-xl ${currentCharacterData.primaryColor} mb-6 opacity-90`}>
            The {currentCharacterData.role}
          </p>
          <p className={`${currentCharacterData.primaryColor} text-opacity-80 leading-relaxed text-lg`}>
            Explore {currentCharacterData.name}'s journey through different life stages using the controls on the right.
          </p>
        </div>

        <div className="flex-1 flex justify-center items-center relative mb-8 lg:mb-0">
          <CharacterCard 
            character={currentCharacterData} 
            lifeStage={currentLifeStage}
            isEngaged={engagedCharacter === currentCharacterData.id}
            onToggle={handleToggleEngage}
          />
        </div>

        <div className={`flex-1 max-w-md flex flex-col items-end transition-all duration-1000 ${isTransitioning ? 'opacity-0 transform -translate-x-8' : 'opacity-100 transform translate-x-0'}`}>
          <div className="mb-8 mr-4">
            <h3 className={`text-xl font-semibold ${currentCharacterData.primaryColor} mb-4 text-center`}>
              Life Stages
            </h3>
            <div className="flex flex-col gap-3 bg-white bg-opacity-20 p-4 rounded-2xl backdrop-blur-sm">
              {currentCharacterData.lifeStages.map((stage, index) => {
                const isSelected = index === currentLifeStageIndex;
                return (
                  <button
                    key={stage.stage}
                    onClick={() => handleLifeStageChange(index)}
                    className={`px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                      isSelected
                        ? 'bg-white text-gray-700 shadow-lg'
                        : `${currentCharacterData.primaryColor} hover:bg-white hover:bg-opacity-10`
                    }`}
                  >
                    {stage.stage}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={`relative z-10 flex justify-center items-center px-6 lg:px-16 pb-8 transition-all duration-1000 ${isTransitioning ? 'opacity-0 transform translate-y-8' : 'opacity-100 transform translate-y-0'}`}>
        <div className="text-center">
          <div className="flex gap-2 justify-center mb-4">
            {characters.map((_, index) => (
              <div
                key={index}
                className={`${
                  index === currentCharacter 
                    ? 'w-8 h-2 bg-white' 
                    : 'w-2 h-2 bg-white bg-opacity-50'
                } rounded-full transition-all duration-300`}
              />
            ))}
          </div>
          <p className={`text-sm ${currentCharacterData.primaryColor} opacity-60`}>
            Scroll or swipe to explore more characters
          </p>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center text-white text-opacity-60">
          <div className="w-1 h-8 bg-white bg-opacity-30 rounded-full relative overflow-hidden">
            <div 
              className="w-full h-2 bg-white rounded-full absolute float-animation"
              style={{ animationDuration: '2s' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterShowcase;
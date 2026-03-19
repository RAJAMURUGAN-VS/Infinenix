import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, Paperclip, Image, FileText, Mic, Smile } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

// Add TypeScript definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionError) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  initialMessage?: string;
  inputText: string;
  setInputText: (text: string) => void;
}

const MessageInput = ({ onSendMessage, disabled, initialMessage, inputText, setInputText }: MessageInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (initialMessage) {
      setInputText(initialMessage);
    }
  }, [initialMessage, setInputText]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (type: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    switch (type) {
      case 'image':
        input.accept = 'image/*';
        break;
      case 'document':
        input.accept = '.pdf,.doc,.docx,.txt';
        break;
      default:
        break;
    }
    
    input.click();
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        console.log('Selected files:', files);
        // TODO: Handle file upload
      }
    };
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
  };

  return (
    <div className={cn("border-t backdrop-blur-sm transition-colors duration-200", isDarkMode ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white/80")}>
      <div className="p-4 max-w-4xl mx-auto">
        <Card className={cn("shadow-lg", isDarkMode ? "border-slate-700 bg-slate-800" : "border-2 border-slate-200 bg-white")}>
          <div className="flex items-end gap-3 p-4">
            {/* Attachment Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("flex-shrink-0 h-10 w-10 rounded-full transition-colors", isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-600")}
                >
                  <Paperclip size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className={cn("w-48", isDarkMode && "bg-slate-700 border-slate-600 text-slate-200")}>
                <DropdownMenuItem onClick={() => handleFileUpload('image')} className={isDarkMode && "hover:bg-slate-600"}>
                  <Image size={16} className="mr-2 text-blue-500" />
                  Upload Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFileUpload('document')} className={isDarkMode && "hover:bg-slate-600"}>
                  <FileText size={16} className="mr-2 text-green-500" />
                  Upload Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Message Input */}
            <div className="flex-grow relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift + Enter for new line)"
                className={cn(
                  "w-full min-h-[44px] max-h-32 py-3 px-4 pr-12 rounded-xl resize-none focus:outline-none focus:ring-2 transition-all duration-200",
                  isDarkMode 
                    ? "bg-slate-700 text-slate-200 placeholder-slate-400 border border-slate-600 focus:ring-blue-700 focus:bg-slate-700"
                    : "bg-slate-50 text-slate-800 placeholder-slate-500 border border-transparent focus:ring-blue-500 focus:bg-white"
                )}
                rows={1}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: isDarkMode ? '#475569 transparent' : '#cbd5e1 transparent'
                }}
                data-tour-element="prompt-input"
              />
              
              {/* Emoji Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full transition-colors", isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-200 text-slate-500")}
              >
                <Smile size={16} />
              </Button>
            </div>

            {/* Voice Recording Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleRecording}
                  className={cn(
                    `flex-shrink-0 h-10 w-10 rounded-full transition-all duration-200`,
                    isRecording 
                      ? 'bg-red-100 hover:bg-red-200 text-red-600' 
                      : isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                  )}
                >
                  <Mic size={18} className={isRecording ? 'animate-pulse' : ''} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                {isRecording ? 'Stop recording' : 'Voice message'}
              </TooltipContent>
            </Tooltip>

            {/* Send Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSend}
                  size="icon" 
                  disabled={!inputText.trim() || disabled}
                  className={cn(
                    `flex-shrink-0 h-10 w-10 rounded-full transition-all duration-200`,
                    inputText.trim() 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                      : isDarkMode ? 'bg-slate-700 cursor-not-allowed text-slate-500' : 'bg-slate-200 cursor-not-allowed'
                  )}
                >
                  <Send size={18} className={inputText.trim() ? 'text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-400'} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                Send message (Enter)
              </TooltipContent>
            </Tooltip>
          </div>
          
          {/* Character count and shortcuts */}
          <div className={cn("px-4 pb-3 flex justify-between items-center text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            <div className="flex items-center gap-4">
              <span>Enter to send • Shift+Enter for new line</span>
              {isRecording && (
                <span className="flex items-center gap-1 text-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Recording...
                </span>
              )}
            </div>
            <span className={cn(inputText.length > 1000 ? 'text-orange-500' : '', isDarkMode && inputText.length <= 1000 && "text-slate-400")}>
              {inputText.length}/2000
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MessageInput;
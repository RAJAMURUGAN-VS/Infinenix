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

const INPUT_LIMIT = 2000;
const MAX_TEXTAREA_HEIGHT = 120; // ~5 lines

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Prefill from initialMessage
  useEffect(() => {
    if (initialMessage) setInputText(initialMessage);
  }, [initialMessage, setInputText]);

  // Auto-expand textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT) + "px";
  }, [inputText]);

  const handleSend = () => {
    if (inputText.trim() && !disabled) {
      onSendMessage(inputText);
      setInputText("");
      // Reset height after clearing
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (type: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    if (type === "image") input.accept = "image/*";
    if (type === "document") input.accept = ".pdf,.doc,.docx,.txt";
    input.click();
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files?.length) {
        // TODO: Handle file upload logic
        console.log("Selected files:", files);
      }
    };
  };

  const isOverWarning = inputText.length > INPUT_LIMIT * 0.8;
  const isAtLimit = inputText.length >= INPUT_LIMIT;
  const canSend = !!inputText.trim() && !disabled && !isAtLimit;

  return (
    <div className={cn(
      "border-t backdrop-blur-sm transition-colors duration-200 sticky bottom-0 z-10",
      isDarkMode ? "border-slate-700 bg-slate-900/90" : "border-slate-200 bg-white/90"
    )}>
      <div className="p-4 max-w-4xl mx-auto">
        <Card className={cn("shadow-lg", isDarkMode ? "border-slate-700 bg-slate-800" : "border-2 border-slate-200 bg-white")}>
          <div className="flex items-end gap-3 p-4">
            {/* Attachment Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className={cn("flex-shrink-0 h-10 w-10 rounded-full transition-colors", isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-600")}
                  aria-label="Attach file"
                >
                  <Paperclip size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className={cn("w-48", isDarkMode && "bg-slate-700 border-slate-600 text-slate-200")}>
                <DropdownMenuItem onClick={() => handleFileUpload("image")} className={isDarkMode ? "hover:bg-slate-600" : ""}>
                  <Image size={16} className="mr-2 text-blue-500" /> Upload Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFileUpload("document")} className={isDarkMode ? "hover:bg-slate-600" : ""}>
                  <FileText size={16} className="mr-2 text-green-500" /> Upload Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Textarea */}
            <div className="flex-grow relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message… (Shift+Enter for new line)"
                maxLength={INPUT_LIMIT}
                className={cn(
                  "w-full py-3 px-4 pr-10 rounded-xl resize-none focus:outline-none focus:ring-2 transition-all duration-200 leading-relaxed",
                  isDarkMode
                    ? "bg-slate-700 text-slate-200 placeholder-slate-400 border border-slate-600 focus:ring-blue-700"
                    : "bg-slate-50 text-slate-800 placeholder-slate-500 border border-transparent focus:ring-blue-500 focus:bg-white"
                )}
                style={{ minHeight: "44px", maxHeight: `${MAX_TEXTAREA_HEIGHT}px`, overflowY: "auto", resize: "none" }}
                data-tour-element="prompt-input"
                disabled={disabled}
                aria-label="Message input"
              />

              {/* Emoji button */}
              <Button
                variant="ghost" size="icon"
                className={cn("absolute right-2 top-2 h-7 w-7 rounded-full transition-colors", isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-200 text-slate-500")}
                aria-label="Add emoji"
              >
                <Smile size={15} />
              </Button>
            </div>

            {/* Voice recording */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => setIsRecording(!isRecording)}
                  className={cn(
                    "flex-shrink-0 h-10 w-10 rounded-full transition-all duration-200",
                    isRecording ? "bg-red-100 hover:bg-red-200 text-red-600" : isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-600"
                  )}
                  aria-label={isRecording ? "Stop recording" : "Voice message"}
                >
                  <Mic size={18} className={isRecording ? "animate-pulse" : ""} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                {isRecording ? "Stop recording" : "Voice message"}
              </TooltipContent>
            </Tooltip>

            {/* Send button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSend}
                  size="icon"
                  disabled={!canSend}
                  className={cn(
                    "flex-shrink-0 h-10 w-10 rounded-full transition-all duration-200",
                    canSend
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                      : "opacity-50 cursor-not-allowed " + (isDarkMode ? "bg-slate-700" : "bg-slate-200")
                  )}
                  aria-label="Send message"
                >
                  <Send size={18} className={canSend ? "text-white" : isDarkMode ? "text-slate-400" : "text-slate-400"} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                Send message (Enter)
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Hints row */}
          <div className={cn("px-4 pb-3 flex justify-between items-center text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            <div className="flex items-center gap-4">
              <span>Enter to send · Shift+Enter for new line</span>
              {isRecording && (
                <span className="flex items-center gap-1 text-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Recording…
                </span>
              )}
            </div>
            {isOverWarning && (
              <span className={isAtLimit ? "text-destructive font-medium" : "text-orange-500"}>
                {inputText.length}/{INPUT_LIMIT}
              </span>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MessageInput;
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, Paperclip, Image, FileText, Mic, Smile, Brain, Sparkles, Star, Code2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const INPUT_LIMIT = 2000;
const MAX_TEXTAREA_HEIGHT = 200;

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  initialMessage?: string;
  inputText: string;
  setInputText: (text: string) => void;
}

const MessageInput = ({ onSendMessage, disabled, initialMessage, inputText, setInputText }: MessageInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    try { return localStorage.getItem("selectedModel") || "sonar"; }
    catch { return "sonar"; }
  });
  const { isDarkMode } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const models = [
    { name: "sonar",               icon: Brain,    label: "Sonar" },
    { name: "sonar-pro",           icon: Sparkles, label: "Sonar Pro" },
    { name: "sonar-reasoning",     icon: Star,     label: "Reasoning" },
    { name: "sonar-reasoning-pro", icon: Code2,    label: "Reasoning Pro" },
    { name: "sonar-deep-research", icon: Brain,    label: "Deep Research" },
  ];

  const currentModel = models.find(m => m.name === selectedModel) || models[0];

  const handleSelectModel = (name: string) => {
    setSelectedModel(name);
    try { localStorage.setItem("selectedModel", name); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (initialMessage) setInputText(initialMessage);
  }, [initialMessage, setInputText]);

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
      if (textareaRef.current) textareaRef.current.style.height = "24px";
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
      if (files?.length) console.log("Selected files:", files);
    };
  };

  const isOverWarning = inputText.length > INPUT_LIMIT * 0.8;
  const isAtLimit = inputText.length >= INPUT_LIMIT;
  const canSend = !!inputText.trim() && !disabled && !isAtLimit;

  return (
    /* Outer wrapper — same bg as ChatArea so it blends in */
    <div className={cn(
      "transition-colors duration-200 flex-shrink-0",
      isDarkMode ? "bg-slate-900" : "bg-white"
    )}>
      {/* Centered column — matches ChatArea's max-w-2xl */}
      <div className="mx-auto w-full max-w-3xl px-6 pb-4 pt-2">

        {/* Floating input box — rounded-2xl with subtle shadow, like Claude */}
        <div className={cn(
          "relative rounded-2xl border transition-shadow duration-200",
          "shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_16px_rgba(0,0,0,0.12)]",
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        )}>
          {/* Textarea row */}
          <div className="flex items-end gap-1 px-3 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Infenix…"
              maxLength={INPUT_LIMIT}
              className={cn(
                "flex-1 resize-none focus:outline-none bg-transparent text-sm leading-relaxed py-1 px-1",
                isDarkMode
                  ? "text-slate-200 placeholder-slate-500"
                  : "text-slate-800 placeholder-slate-400"
              )}
              style={{ minHeight: "24px", maxHeight: `${MAX_TEXTAREA_HEIGHT}px`, overflowY: "auto", resize: "none" }}
              data-tour-element="prompt-input"
              disabled={disabled}
              aria-label="Message input"
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-2 pb-2">
            {/* Left — attach + mic */}
            <div className="flex items-center gap-0.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost" size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg transition-colors",
                      isDarkMode ? "text-slate-400 hover:bg-slate-700 hover:text-slate-200" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    )}
                    aria-label="Attach file"
                  >
                    <Paperclip size={15} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={cn("w-48", isDarkMode && "bg-slate-700 border-slate-600 text-slate-200")}>
                  <DropdownMenuItem onClick={() => handleFileUpload("image")} className={isDarkMode ? "hover:bg-slate-600" : ""}>
                    <Image size={14} className="mr-2 text-blue-500" /> Upload Image
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFileUpload("document")} className={isDarkMode ? "hover:bg-slate-600" : ""}>
                    <FileText size={14} className="mr-2 text-green-500" /> Upload Document
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setIsRecording(!isRecording)}
                    className={cn(
                      "h-8 w-8 rounded-lg transition-colors",
                      isRecording
                        ? "text-red-500 bg-red-50 hover:bg-red-100"
                        : isDarkMode ? "text-slate-400 hover:bg-slate-700 hover:text-slate-200" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    )}
                    aria-label={isRecording ? "Stop recording" : "Voice message"}
                  >
                    <Mic size={15} className={isRecording ? "animate-pulse" : ""} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isRecording ? "Stop recording" : "Voice message"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost" size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg transition-colors",
                      isDarkMode ? "text-slate-400 hover:bg-slate-700 hover:text-slate-200" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    )}
                    aria-label="Add emoji"
                  >
                    <Smile size={15} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Emoji</TooltipContent>
              </Tooltip>

              {/* Recording indicator */}
              {isRecording && (
                <span className="flex items-center gap-1 text-xs text-red-500 ml-1">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  Recording…
                </span>
              )}
            </div>

            {/* Right — model picker + char count + send */}
            <div className="flex items-center gap-2">
              {/* Model picker — shows current model, click to switch */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                      isDarkMode
                        ? "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    )}
                    aria-label="Select model"
                  >
                    <currentModel.icon size={12} />
                    <span>{currentModel.label}</span>
                    <ChevronDown size={11} className="opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  className={cn("w-52 mb-1", isDarkMode && "bg-slate-800 border-slate-700 text-slate-200")}
                >
                  {models.map(model => (
                    <DropdownMenuItem
                      key={model.name}
                      onClick={() => handleSelectModel(model.name)}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer",
                        selectedModel === model.name
                          ? isDarkMode ? "bg-slate-700" : "bg-slate-100"
                          : isDarkMode ? "hover:bg-slate-700" : ""
                      )}
                    >
                      <model.icon size={14} className={selectedModel === model.name ? "text-purple-500" : "text-slate-400"} />
                      <span className="text-sm">{model.label}</span>
                      {selectedModel === model.name && (
                        <span className="ml-auto text-purple-500 text-xs">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {isOverWarning && (
                <span className={cn("text-xs", isAtLimit ? "text-destructive font-medium" : "text-orange-500")}>
                  {inputText.length}/{INPUT_LIMIT}
                </span>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSend}
                    size="icon"
                    disabled={!canSend}
                    className={cn(
                      "h-8 w-8 rounded-xl transition-all duration-150",
                      canSend
                        ? "bg-violet-600 hover:bg-violet-700 text-white active:scale-95"
                        : isDarkMode
                          ? "bg-slate-700 text-slate-500 cursor-not-allowed opacity-50"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                    aria-label="Send message"
                  >
                    <Send size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send (Enter)</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Subtle hint */}
        <p className={cn("text-center text-[11px] mt-1.5", isDarkMode ? "text-slate-600" : "text-slate-400")}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default MessageInput;
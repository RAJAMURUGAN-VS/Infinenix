import { Message } from "@/types/chat";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star, Copy, Check, Code, Download, Image, FileText,
  Sparkles, Play, Pause, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import ReactMarkdown from "react-markdown";
import { SkeletonMessages } from "@/components/SkeletonMessages";

interface ChatAreaProps {
  messages: Message[];
  isLoading?: boolean;
  chatLoading?: boolean;
  onToggleStar: (messageId: string) => void;
  onPlayMessage: (messageId: string, content: string) => void;
  currentlyPlaying: string | null;
  onRetry?: () => void;
  onChipClick?: (text: string) => void;
  selectedDomain?: {
    id: string;
    label: string;
    icon: React.ReactNode;
    description: string;
  };
  onPromptClick?: (prompt: string) => void;
}

interface ParsedResponse {
  response: string;
  code?: string;
}

const SUGGESTION_CHIPS = [
  "What can you help me with?",
  "Summarize a topic for me",
  "Help me write something",
  "Explain a concept simply",
];

const ChatArea = ({
  messages,
  isLoading,
  chatLoading,
  onToggleStar,
  onPlayMessage,
  currentlyPlaying,
  onRetry,
  onChipClick,
  selectedDomain,
  onPromptClick,
}: ChatAreaProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showJumpBtn, setShowJumpBtn] = useState(false);
  const { isDarkMode } = useTheme();

  // --- Scroll behaviour ---
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowJumpBtn(distanceFromBottom > 200);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  // Show skeleton while chat history is loading
  // Must be after all Hooks!
  if (chatLoading) return <SkeletonMessages />;

  // --- Message grouping ---
  const isFirstInGroup = (index: number) => {
    if (index === 0) return true;
    return messages[index].sender !== messages[index - 1].sender;
  };
  const isLastInGroup = (index: number) => {
    if (index === messages.length - 1) return true;
    return messages[index].sender !== messages[index + 1].sender;
  };

  // --- Timestamp ---
  const formatTimestamp = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // --- AI response parser ---
  const parseAIResponse = (content: string): ParsedResponse | null => {
    try {
      const jsonMatch =
        content.match(/```json\s*({[\s\S]*?})\s*```/) ||
        content.match(/```json\s*({[\s\S]*?})\s*/);
      if (jsonMatch) {
        try { return JSON.parse(jsonMatch[1]); } catch { /* fall through */ }
      }
      if (content.trim().startsWith("{") && content.trim().endsWith("}")) {
        try { return JSON.parse(content); } catch { /* fall through */ }
      }
      const codeMarkerMatch = content.match(/### Render Code Below ###\s*([\s\S]+)/);
      if (codeMarkerMatch) {
        const beforeCode = content.substring(0, content.indexOf("### Render Code Below ###")).trim();
        const codeContent = codeMarkerMatch[1].trim();
        const htmlMatch =
          codeContent.match(/```html\s*([\s\S]*?)\s*```/) ||
          codeContent.match(/```\s*(<!DOCTYPE html[\s\S]*?)\s*```/);
        return { response: beforeCode, code: htmlMatch ? htmlMatch[1] : codeContent };
      }
      return { response: content, code: "" };
    } catch {
      return null;
    }
  };

  // --- Copy ---
  const handleCopy = async (content: string, messageId: string, isCode = false) => {
    try {
      await navigator.clipboard.writeText(content);
      if (isCode) {
        setCopiedCodeId(messageId);
        setTimeout(() => setCopiedCodeId(null), 2000);
      } else {
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      }
      toast.success(`${isCode ? "Code" : "Message"} copied to clipboard`, { duration: 2000 });
    } catch {
      toast.error(`Failed to copy ${isCode ? "code" : "message"}`, { duration: 2000 });
    }
  };

  // --- Download as image ---
  const downloadAsImage = async (htmlContent: string, messageId: string) => {
    setDownloadingId(messageId);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:absolute;left:-9999px;width:1200px;height:800px;border:none;";
      document.body.appendChild(iframe);
      iframe.contentDocument?.open();
      iframe.contentDocument?.write(htmlContent);
      iframe.contentDocument?.close();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const canvas = await html2canvas(iframe.contentDocument?.body || document.body, {
        width: 1200, height: 800, scale: 1.5, useCORS: true, allowTaint: false,
      });
      const imageData = canvas.toDataURL("image/png", 0.95);
      try {
        const saved = JSON.parse(localStorage.getItem("savedImages") || "[]");
        saved.push({ id: Date.now(), data: imageData, timestamp: new Date().toISOString(), title: `Study Tool ${new Date().toLocaleDateString()}` });
        localStorage.setItem("savedImages", JSON.stringify(saved));
      } catch { /* storage full — skip saving */ }
      const link = document.createElement("a");
      link.download = `study-tool-${Date.now()}.png`;
      link.href = imageData;
      link.click();
      document.body.removeChild(iframe);
      toast.success("Downloaded as PNG!", { duration: 3000 });
    } catch {
      toast.error("Failed to download as image.");
    } finally {
      setDownloadingId(null);
    }
  };

  // --- Download as PDF ---
  const downloadAsPDF = async (htmlContent: string, messageId: string) => {
    setDownloadingId(messageId);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).jsPDF;
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:absolute;left:-9999px;width:1200px;height:1px;border:none;";
      document.body.appendChild(iframe);
      const enhanced = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:15px;font-family:system-ui,sans-serif;background:white;width:1170px;}</style></head><body>${htmlContent}</body></html>`;
      iframe.contentDocument?.open();
      iframe.contentDocument?.write(enhanced);
      iframe.contentDocument?.close();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const body = iframe.contentDocument?.body;
      if (!body) throw new Error("No body");
      const contentHeight = body.scrollHeight;
      iframe.style.height = `${contentHeight + 40}px`;
      await new Promise((resolve) => setTimeout(resolve, 500));
      const canvas = await html2canvas(body, {
        width: 1200, height: contentHeight, scale: 1.5,
        useCORS: true, allowTaint: false, backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png", 0.9);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth - 20;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      const pageHeight = pdf.internal.pageSize.getHeight() - 20;
      if (imgHeight > pageHeight) {
        const numPages = Math.ceil(imgHeight / pageHeight);
        for (let i = 0; i < numPages; i++) {
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, "PNG", 10, 10 + -i * pageHeight, imgWidth, imgHeight);
        }
      } else {
        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      }
      pdf.save(`study-tool-${Date.now()}.pdf`);
      document.body.removeChild(iframe);
      toast.success("Downloaded as PDF!", { duration: 3000 });
    } catch {
      toast.error("Failed to download as PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStar = (messageId: string, isStarred: boolean) => {
    onToggleStar(messageId);
    toast.success(isStarred ? "Removed from starred" : "Message starred", { duration: 2000 });
  };

  // --- Render AI message ---
  const renderAIMessage = (message: Message) => {
    // Error state
    if (message.isError) {
      return (
        <div className={cn(
          "rounded-2xl rounded-tl-md p-5 shadow-sm flex flex-col gap-3",
          isDarkMode ? "bg-slate-700 border border-red-800" : "bg-red-50 border border-red-200"
        )}>
          <p className="text-sm text-destructive font-medium">
            ⚠️ Something went wrong. The response failed.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="self-start text-xs px-3 py-1.5 rounded-md border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors font-medium"
            >
              ↩ Retry
            </button>
          )}
        </div>
      );
    }

    const parsedResponse = parseAIResponse(message.content);

    if (parsedResponse?.code) {
      return (
        <div className="w-full space-y-4">
          <div className={cn(
            "rounded-2xl rounded-tl-md p-6 shadow-sm",
            isDarkMode ? "bg-slate-700 border border-slate-600 text-slate-200" : "bg-gradient-to-r from-white to-blue-50 border border-blue-100"
          )}>
            <div className="flex items-start gap-3 mb-3">
              <div className={cn("p-2 rounded-lg", isDarkMode ? "bg-slate-600" : "bg-blue-100")}>
                <Sparkles size={16} className={isDarkMode ? "text-indigo-400" : "text-indigo-600"} />
              </div>
              <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{parsedResponse.response}</ReactMarkdown>
              </div>
            </div>
          </div>

          <Card className={cn("border-0 shadow-lg", isDarkMode ? "bg-slate-800 text-slate-200" : "bg-gradient-to-br from-white to-slate-50")}>
            <CardHeader className={cn("pb-4 rounded-t-lg", isDarkMode ? "bg-slate-700 border-b border-slate-600" : "bg-gradient-to-r from-indigo-50 to-purple-50")}>
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-lg flex items-center gap-3", isDarkMode ? "text-slate-100" : "text-slate-800")}>
                  <div className={cn("p-2 rounded-lg", isDarkMode ? "bg-slate-600" : "bg-indigo-100")}>
                    <Code size={18} className={isDarkMode ? "text-indigo-400" : "text-indigo-600"} />
                  </div>
                  Interactive Study Tool
                </CardTitle>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => handleCopy(parsedResponse.code!, message.id, true)}
                        className={cn("hover:bg-slate-50", isDarkMode && "bg-slate-600 text-slate-100 border-slate-500 hover:bg-slate-500")}
                      >
                        {copiedCodeId === message.id ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
                        Copy
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                      {copiedCodeId === message.id ? "Copied!" : "Copy HTML"}
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline" size="sm"
                        disabled={downloadingId === message.id}
                        className={cn("hover:bg-slate-50", isDarkMode && "bg-slate-600 text-slate-100 border-slate-500 hover:bg-slate-500")}
                      >
                        {downloadingId === message.id ? (
                          <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2" />Downloading...</>
                        ) : (
                          <><Download size={14} className="mr-2" />Download</>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                      <DropdownMenuItem onClick={() => downloadAsImage(parsedResponse.code!, message.id)} disabled={downloadingId === message.id}>
                        <Image size={14} className="mr-2" /> Download as PNG
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadAsPDF(parsedResponse.code!, message.id)} disabled={downloadingId === message.id}>
                        <FileText size={14} className="mr-2" /> Download as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className={cn("rounded-xl overflow-hidden shadow-inner", isDarkMode ? "border-2 border-slate-600 bg-slate-700" : "border-2 border-slate-200 bg-white")}>
                <iframe
                  srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;padding:0;font-family:system-ui,sans-serif;}</style></head><body>${parsedResponse.code}</body></html>`}
                  className="w-full h-96 border-0"
                  sandbox="allow-scripts"
                  title="Interactive Study Tool"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className={cn(
        "rounded-2xl rounded-tl-md p-6 shadow-sm",
        isDarkMode ? "bg-slate-700 border border-slate-600 text-slate-200" : "bg-gradient-to-r from-white to-blue-50 border border-blue-100"
      )}>
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg flex-shrink-0", isDarkMode ? "bg-slate-600" : "bg-blue-100")}>
            <Sparkles size={16} className={isDarkMode ? "text-indigo-400" : "text-indigo-600"} />
          </div>
          <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{parsedResponse?.response ?? message.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  // --- Empty state ---
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4">
        <div className={cn("p-8 rounded-2xl shadow-lg border max-w-md w-full", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            {selectedDomain?.icon || <Sparkles size={24} className="text-white" />}
          </div>
          <h2 className={cn("text-2xl font-semibold mb-1", isDarkMode ? "text-slate-100" : "text-slate-900")}>
            {selectedDomain ? selectedDomain.label : "Infenix"}
          </h2>
          <p className={cn("text-sm mb-6", isDarkMode ? "text-slate-400" : "text-muted-foreground")}>
            {selectedDomain?.description ?? "Ask me anything"}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  if (onChipClick) onChipClick(chip);
                  else if (onPromptClick) onPromptClick(chip);
                }}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isDarkMode
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                    : "border-border text-slate-700 hover:bg-muted"
                )}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Main message list ---
  return (
    <div
      ref={scrollRef}
      className={cn("flex-grow overflow-y-auto p-6 transition-colors duration-200 relative", isDarkMode ? "bg-slate-900 text-slate-200" : "bg-gradient-to-br from-slate-50 via-white to-blue-50")}
    >
      <div className="max-w-4xl mx-auto">
        {messages.map((message, index) => {
          const firstInGroup = isFirstInGroup(index);
          const lastInGroup = isLastInGroup(index);

          return (
            <div
              key={message.id}
              id={`message-${message.id}`}
              className={cn(
                "flex flex-col group transition-all duration-200",
                message.sender === "user" ? "items-end" : "items-start",
                lastInGroup ? "mb-4" : "mb-1"
              )}
            >
              <div className="flex items-start gap-3 w-full max-w-[95%]">
                {/* Avatar spacer / real avatar */}
                {message.sender === "ai" && (
                  firstInGroup ? (
                    <Avatar className="h-9 w-9 mt-1 flex-shrink-0 shadow-md border-2 border-white">
                      <AvatarImage src="/ai-avatar.png" alt="AI assistant avatar" />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-xs">AI</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-9 flex-shrink-0" />
                  )
                )}

                <div className="flex flex-col w-full">
                  {message.sender === "user" ? (
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-md p-4 ml-auto shadow-md max-w-[70%]">
                      <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
                    </div>
                  ) : (
                    renderAIMessage(message)
                  )}

                  {/* Timestamp + actions — visible only on hover */}
                  <div className={cn(
                    "flex items-center mt-1 px-1 gap-3",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs text-muted-foreground">
                      {formatTimestamp(message.timestamp)}
                    </span>

                    {message.sender === "ai" && !message.isError && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="icon"
                              className={cn("h-7 w-7 rounded-full", isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100")}
                              onClick={() => handleStar(message.id, message.starred)}
                              aria-label={message.starred ? "Unstar message" : "Star message"}
                            >
                              <Star size={13} className={cn("transition-colors", message.starred ? "fill-yellow-500 text-yellow-500" : isDarkMode ? "text-slate-500" : "text-slate-400")} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                            {message.starred ? "Remove from starred" : "Star message"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="icon"
                              className={cn("h-7 w-7 rounded-full", isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100")}
                              onClick={() => {
                                const parsed = parseAIResponse(message.content);
                                handleCopy(parsed?.response ?? message.content, message.id);
                              }}
                              aria-label="Copy message"
                            >
                              {copiedMessageId === message.id ? <Check size={13} className="text-green-500" /> : <Copy size={13} className={isDarkMode ? "text-slate-500" : "text-slate-400"} />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                            {copiedMessageId === message.id ? "Copied!" : "Copy message"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="icon"
                              className={cn("h-7 w-7 rounded-full", isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100")}
                              onClick={() => onPlayMessage(message.id, message.content)}
                              aria-label={currentlyPlaying === message.id ? "Pause audio" : "Play message"}
                            >
                              {currentlyPlaying === message.id ? <Pause size={14} /> : <Play size={14} />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                            {currentlyPlaying === message.id ? "Pause" : "Play"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-9 w-9 mt-1 shadow-md border-2 border-white">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-xs">AI</AvatarFallback>
            </Avatar>
            <div className={cn("border rounded-2xl rounded-tl-md p-5 shadow-sm", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-.3s]" />
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-.5s]" />
                </div>
                <span className={cn("text-sm", isDarkMode ? "text-slate-400" : "text-slate-500")}>AI is thinking…</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Jump to bottom button */}
      {showJumpBtn && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-28 right-6 z-10 flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm shadow-lg hover:opacity-90 transition-all animate-in fade-in duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Jump to latest message"
        >
          <ChevronDown size={15} />
          Latest
        </button>
      )}
    </div>
  );
};

export default ChatArea;
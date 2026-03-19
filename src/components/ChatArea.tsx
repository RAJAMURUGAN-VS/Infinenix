import { Message } from "@/types/chat";
import { useEffect, useRef, useState, useCallback } from "react";
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
import remarkGfm from "remark-gfm";
import { SkeletonMessages } from "@/components/SkeletonMessages";

// ── Thinking content parser ──
interface ParsedThinking {
  thinking: string;
  response: string;
  hasThinking: boolean;
}

const parseThinkingContent = (text: string): ParsedThinking => {
  const thinkMatch = text.match(/^<think>([\s\S]*?)<\/think>\s*/);
  if (thinkMatch) {
    return {
      thinking: thinkMatch[1].trim(),
      response: text.slice(thinkMatch[0].length).trim(),
      hasThinking: true,
    };
  }
  // Streaming: </think> hasn't arrived yet
  const openThinkMatch = text.match(/^<think>([\s\S]*)/);
  if (openThinkMatch) {
    return {
      thinking: openThinkMatch[1].trim(),
      response: "",
      hasThinking: true,
    };
  }
  return { thinking: "", response: text, hasThinking: false };
};

// ── Thinking panel component ──
interface ThinkingPanelProps {
  thinking: string;
  isExpanded: boolean;
  isStreaming?: boolean;
  thinkingDuration?: number;
  onToggle: () => void;
  isDarkMode: boolean;
}

const ThinkingPanel = ({
  thinking,
  isExpanded,
  isStreaming,
  thinkingDuration,
  onToggle,
  isDarkMode,
}: ThinkingPanelProps) => {

  return (
    <div className={cn(
      "mb-3 rounded-xl border overflow-hidden",
      isDarkMode
        ? "border-slate-700 bg-slate-800/60"
        : "border-violet-100 bg-violet-50/60"
    )}>
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2.5 text-left",
          "transition-colors duration-150",
          isDarkMode ? "hover:bg-slate-700/60" : "hover:bg-violet-100/60"
        )}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse reasoning" : "Expand reasoning"}
      >
        {/* Pulsing orb */}
        <div className="relative flex-shrink-0">
          <div className={cn(
            "w-3.5 h-3.5 rounded-full",
            isStreaming ? "bg-violet-500 animate-pulse" : "bg-violet-400/70"
          )} />
          {isStreaming && (
            <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-violet-400 animate-ping opacity-30" />
          )}
        </div>

        {/* Label */}
        <span className={cn(
          "text-xs font-medium flex-1",
          isDarkMode ? "text-slate-400" : "text-violet-600"
        )}>
          {isStreaming
            ? "Thinking…"
            : thinkingDuration && thinkingDuration > 0
              ? `Thought for ${thinkingDuration}s`
              : "Reasoning complete"}
        </span>

        {/* Duration hint */}
        {!isStreaming && (
          <span className={cn(
            "text-xs mr-1.5",
            isDarkMode ? "text-slate-600" : "text-violet-400"
          )}>
            {isExpanded ? "hide" : "show"}
          </span>
        )}

        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={cn(
            "transition-transform duration-200 flex-shrink-0",
            isDarkMode ? "text-slate-500" : "text-violet-400",
            isExpanded ? "rotate-180" : "rotate-0"
          )}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Expandable reasoning */}
      {isExpanded && (
        <div
          style={{ animation: "thinkExpand 0.15s ease-out both" }}
          className={cn(
            "px-3 pb-3 pt-2 border-t",
            isDarkMode ? "border-slate-700" : "border-violet-200"
          )}
        >
          <div className="thinking-scroll space-y-0.5 max-h-64 overflow-y-auto pr-1">
            {thinking.split("\n").map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={i} className="h-2" />;
              const isBullet = /^[-*•]/.test(trimmed);
              const isNumbered = /^\d+\./.test(trimmed);
              const isHeader = trimmed.endsWith(":") && trimmed.length < 60;
              return (
                <div
                  key={i}
                  className={cn(
                    "text-xs leading-5 flex items-start gap-1.5",
                    isDarkMode ? "text-slate-400" : "text-slate-500",
                    (isBullet || isNumbered) && "pl-2",
                    isHeader && cn(
                      "font-medium pt-1",
                      isDarkMode ? "text-slate-300" : "text-slate-600"
                    )
                  )}
                >
                  {isBullet && (
                    <span className={cn(
                      "mt-1.5 w-1 h-1 rounded-full flex-shrink-0",
                      isDarkMode ? "bg-slate-600" : "bg-slate-400"
                    )} />
                  )}
                  <span>{isBullet ? trimmed.slice(1).trim() : trimmed}</span>
                </div>
              );
            })}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3 bg-violet-400 ml-0.5 align-middle animate-pulse rounded-sm" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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

const extractJsonObjectText = (text: string): string | null => {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const start = text.indexOf("{");
  if (start === -1) return null;

  let inString = false;
  let escaped = false;
  let depth = 0;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1).trim();
      }
    }
  }

  return null;
};

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showJumpBtn, setShowJumpBtn] = useState(false);
  // Thinking panel expanded state — collapsed by default
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const toggleThinking = (messageId: string) => {
    setExpandedThinking(prev => ({ ...prev, [messageId]: !prev[messageId] }));
  };
  // Feature 4 — reading mode: user scrolled up, don't force-scroll
  const userScrolledUp = useRef(false);
  // Feature 5 — elapsed time before first token
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const thinkingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Records final thinking duration per message id when stream transitions
  const thinkingDurationRef = useRef<Record<string, number>>({});
  // Option 2 streaming — debounced markdown rendering
  // Key = message.id, Value = last content rendered as markdown
  const [renderedContent, setRenderedContent] = useState<Record<string, string>>({});
  const debounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const { isDarkMode } = useTheme();

  const getScrollEl = () =>
    document.getElementById("chat-scroll-container") as HTMLDivElement | null;

  // Option 2 — schedule a debounced markdown re-render for a streaming message
  // Debounce delay: 150ms sweet spot.
  //   Lower (80ms)  = more renders, slightly more flicker
  //   Higher (250ms) = fewer renders, text feels "laggy"
  const scheduleMarkdownRender = useCallback((messageId: string, text: string) => {
    if (debounceTimersRef.current[messageId]) {
      clearTimeout(debounceTimersRef.current[messageId]);
    }
    debounceTimersRef.current[messageId] = setTimeout(() => {
      setRenderedContent(prev => ({ ...prev, [messageId]: text }));
      delete debounceTimersRef.current[messageId];
    }, 150);
  }, []);

  // Feature 4 — smart scroll anchoring
  // When user sends a message (last message is from user), always snap to bottom
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === "user") {
      userScrolledUp.current = false;
    }
    if (!userScrolledUp.current) {
      requestAnimationFrame(() => {
        const el = getScrollEl();
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages]);

  useEffect(() => {
    const el = getScrollEl();
    if (!el) return;
    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const isNearBottom = distanceFromBottom < 80;
      userScrolledUp.current = !isNearBottom;
      setShowJumpBtn(distanceFromBottom > 200);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    userScrolledUp.current = false;
    const el = getScrollEl();
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  // Feature 5 — thinking timer: count seconds before first token arrives
  const isStreaming = messages.some(m => m.isStreaming);
  const hasStreamingContent = messages.some(m => m.isStreaming && m.content.length > 0);

  useEffect(() => {
    if (isLoading && !hasStreamingContent) {
      setThinkingSeconds(0);
      thinkingTimerRef.current = setInterval(() => {
        setThinkingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
        // Record final duration for the streaming message
        const streamingMsg = messages.find(m => m.isStreaming);
        if (streamingMsg && thinkingSeconds > 0) {
          thinkingDurationRef.current[streamingMsg.id] = thinkingSeconds;
        }
      }
      setThinkingSeconds(0);
    }
    return () => {
      if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    };
  }, [isLoading, hasStreamingContent]);

  // Option 2 — fire debounced render whenever a streaming message content changes
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.isStreaming && msg.content) {
        scheduleMarkdownRender(msg.id, msg.content);
      }
    });
  }, [messages, scheduleMarkdownRender]);

  // Option 2 — clean up timers and rendered cache when streaming finishes
  useEffect(() => {
    messages.forEach(msg => {
      if (!msg.isStreaming && renderedContent[msg.id]) {
        setRenderedContent(prev => {
          const next = { ...prev };
          delete next[msg.id];
          return next;
        });
        if (debounceTimersRef.current[msg.id]) {
          clearTimeout(debounceTimersRef.current[msg.id]);
          delete debounceTimersRef.current[msg.id];
        }
      }
    });
  }, [messages, renderedContent]);

  if (chatLoading) return <SkeletonMessages />;

  const isFirstInGroup = (index: number) => {
    if (index === 0) return true;
    return messages[index].sender !== messages[index - 1].sender;
  };
  const isLastInGroup = (index: number) => {
    if (index === messages.length - 1) return true;
    return messages[index].sender !== messages[index + 1].sender;
  };

  const formatTimestamp = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const parseAIResponse = (content: string): ParsedResponse | null => {
    const jsonText = extractJsonObjectText(content);
    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText) as ParsedResponse;
        return {
          response: typeof parsed.response === "string" ? parsed.response : content,
          code: typeof parsed.code === "string" ? parsed.code : "",
        };
      } catch {
        // Continue to fallback parsing
      }
    }

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

      const htmlFenceMatch = content.match(/```html\s*([\s\S]*?)\s*```/i);
      if (htmlFenceMatch?.[1]) {
        const response = content.replace(/```html\s*[\s\S]*?\s*```/i, "").trim();
        return { response, code: htmlFenceMatch[1].trim() };
      }

      return { response: content, code: "" };
    } catch {
      return null;
    }
  };

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
      } catch { /* storage full */ }
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

  // Strip citation markers [1], [2][3] etc — they're noisy reference numbers
  const cleanContent = (text: string) => text.replace(/\[\d+\]/g, "");

  // Custom markdown components — tighter spacing, better typography
  const markdownComponents = {
    // Headings — clear hierarchy, not too large
    h1: ({ children }: any) => <h1 className="text-lg font-semibold mt-5 mb-2 text-slate-900 dark:text-slate-100">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-base font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-sm font-semibold mt-3 mb-1.5 text-slate-800 dark:text-slate-200">{children}</h3>,
    // Paragraphs — comfortable reading spacing
    p: ({ children }: any) => <p className="text-sm leading-7 mb-3 last:mb-0 text-slate-700 dark:text-slate-300">{children}</p>,
    // Unordered lists
    ul: ({ children }: any) => <ul className="my-2 ml-1 space-y-1.5">{children}</ul>,
    ol: ({ children }: any) => <ol className="my-2 ml-1 space-y-1.5 list-decimal list-inside">{children}</ol>,
    li: ({ children }: any) => (
      <li className="flex items-start gap-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 flex-shrink-0" />
        <span>{children}</span>
      </li>
    ),
    // Bold — violet accent instead of plain black
    strong: ({ children }: any) => <strong className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>,
    // Inline code
    code: ({ inline, children }: any) =>
      inline
        ? <code className="px-1.5 py-0.5 rounded-md text-xs font-mono bg-slate-100 dark:bg-slate-700 text-violet-600 dark:text-violet-400">{children}</code>
        : <code>{children}</code>,
    // Code blocks
    pre: ({ children }: any) => (
      <pre className="my-3 p-3 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-6">
        {children}
      </pre>
    ),
    // Blockquote
    blockquote: ({ children }: any) => (
      <blockquote className="my-3 pl-3 border-l-2 border-violet-400 text-slate-500 dark:text-slate-400 italic text-sm">
        {children}
      </blockquote>
    ),
    // Horizontal rule
    hr: () => <hr className="my-4 border-slate-200 dark:border-slate-700" />,
    // Links
    a: ({ href, children }: any) => (
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="text-violet-600 dark:text-violet-400 underline underline-offset-2 hover:text-violet-700 transition-colors text-sm">
        {children}
      </a>
    ),
    // Tables
    table: ({ children }: any) => (
      <div className="my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-slate-50 dark:bg-slate-800">{children}</thead>,
    th: ({ children }: any) => <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">{children}</th>,
    td: ({ children }: any) => <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">{children}</td>,
  };

  const renderAIMessage = (message: Message) => {
    if (message.isError) {
      return (
        <div className={cn(
          "rounded-2xl p-4 flex flex-col gap-3",
          isDarkMode ? "bg-slate-800 border border-red-800" : "bg-red-50 border border-red-200"
        )}>
          <p className="text-sm text-destructive font-medium">⚠️ Something went wrong. The response failed.</p>
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

    // ── Streaming: show plain text with blinking cursor, skip markdown parsing ──
    if (message.isStreaming) {
      // Feature 5 — no content yet: show thinking label with elapsed seconds
      if (!message.content) {
        return (
          <div className="flex items-center gap-2 py-1">
            <div className="flex gap-1">
              <div className={cn("h-1.5 w-1.5 rounded-full animate-bounce", isDarkMode ? "bg-violet-400" : "bg-violet-500")} />
              <div className={cn("h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:-.3s]", isDarkMode ? "bg-violet-400" : "bg-violet-500")} />
              <div className={cn("h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:-.5s]", isDarkMode ? "bg-violet-400" : "bg-violet-500")} />
            </div>
            {thinkingSeconds >= 2 && (
              <span className={cn("text-xs", isDarkMode ? "text-slate-500" : "text-slate-400")}>
                Thinking… {thinkingSeconds}s
              </span>
            )}
          </div>
        );
      }
      // Option 2 — debounced markdown with crossfade on each render
      const displayed = renderedContent[message.id] || message.content;
      const streamParsed = parseThinkingContent(displayed);

      return (
        <div>
          {/* Thinking panel — shown while streaming if <think> detected */}
          {streamParsed.hasThinking && (
            <ThinkingPanel
              thinking={streamParsed.thinking}
              isExpanded={
                // Auto-open while actively thinking unless user explicitly closed it
                expandedThinking[message.id] === false
                  ? false
                  : !streamParsed.response
                    ? true
                    : expandedThinking[message.id] ?? false
              }
              isStreaming={!streamParsed.response}
              thinkingDuration={thinkingDurationRef.current[message.id] ?? thinkingSeconds}
              onToggle={() => toggleThinking(message.id)}
              isDarkMode={isDarkMode}
            />
          )}

          {/* Response content — only once </think> has closed */}
          {streamParsed.response && (
            <div className="relative pb-5">
              <div
                key={streamParsed.response.length}
                className="max-w-none [animation:streamReveal_0.12s_ease-out_both]"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {cleanContent(streamParsed.response)}
                </ReactMarkdown>
              </div>
              <span className={cn(
                "absolute bottom-0 left-0 inline-block w-0.5 h-4 rounded-full animate-pulse",
                isDarkMode ? "bg-violet-400" : "bg-violet-500"
              )} />
            </div>
          )}
        </div>
      );
    }

    const parsedResponse = parseAIResponse(message.content);

    if (parsedResponse?.code) {
      return (
        <div className="w-full space-y-3">
          {/* Response text with optional thinking panel */}
          {(() => {
            const thinkParsed = parseThinkingContent(parsedResponse.response);
            return (
              <div>
                {thinkParsed.hasThinking && (
                  <ThinkingPanel
                    thinking={thinkParsed.thinking}
                    isExpanded={expandedThinking[message.id] ?? false}
                    isStreaming={false}
                    thinkingDuration={thinkingDurationRef.current[message.id]}
                    onToggle={() => toggleThinking(message.id)}
                    isDarkMode={isDarkMode}
                  />
                )}
                <div className="max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {cleanContent(thinkParsed.response || parsedResponse.response)}
                  </ReactMarkdown>
                </div>
              </div>
            );
          })()}

          <Card className={cn(
            "border shadow-sm",
            isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200"
          )}>
            <CardHeader className={cn(
              "pb-3 rounded-t-xl",
              isDarkMode ? "bg-slate-700 border-b border-slate-600" : "bg-slate-50 border-b border-slate-100"
            )}>
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-sm font-medium flex items-center gap-2", isDarkMode ? "text-slate-100" : "text-slate-700")}>
                  <div className={cn("p-1.5 rounded-md", isDarkMode ? "bg-slate-600" : "bg-indigo-100")}>
                    <Code size={14} className={isDarkMode ? "text-indigo-400" : "text-indigo-600"} />
                  </div>
                  Interactive Study Tool
                </CardTitle>
                <div className="flex gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => handleCopy(parsedResponse.code!, message.id, true)}
                        className={cn("h-7 text-xs px-2.5", isDarkMode && "bg-slate-600 text-slate-100 border-slate-500 hover:bg-slate-500")}
                      >
                        {copiedCodeId === message.id ? <Check size={11} className="mr-1" /> : <Copy size={11} className="mr-1" />}
                        Copy
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{copiedCodeId === message.id ? "Copied!" : "Copy HTML"}</TooltipContent>
                  </Tooltip>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline" size="sm"
                        disabled={downloadingId === message.id}
                        className={cn("h-7 text-xs px-2.5", isDarkMode && "bg-slate-600 text-slate-100 border-slate-500 hover:bg-slate-500")}
                      >
                        {downloadingId === message.id
                          ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 mr-1" />Saving…</>
                          : <><Download size={11} className="mr-1" />Download</>}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                      <DropdownMenuItem onClick={() => downloadAsImage(parsedResponse.code!, message.id)} disabled={downloadingId === message.id}>
                        <Image size={13} className="mr-2" /> Download as PNG
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadAsPDF(parsedResponse.code!, message.id)} disabled={downloadingId === message.id}>
                        <FileText size={13} className="mr-2" /> Download as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className={cn("rounded-lg overflow-hidden border", isDarkMode ? "border-slate-600" : "border-slate-200")}>
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

    // Plain AI response — no bubble, just prose like Claude.ai
    const thinkParsed = parseThinkingContent(parsedResponse?.response ?? message.content);
    return (
      <div>
        {thinkParsed.hasThinking && (
          <ThinkingPanel
            thinking={thinkParsed.thinking}
            isExpanded={expandedThinking[message.id] ?? false}
            isStreaming={false}
            thinkingDuration={thinkingDurationRef.current[message.id]}
            onToggle={() => toggleThinking(message.id)}
            isDarkMode={isDarkMode}
          />
        )}
        <div className="max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {cleanContent(thinkParsed.response || parsedResponse?.response || message.content)}
          </ReactMarkdown>
        </div>
      </div>
    );
  };

  // --- Empty state ---
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4">
        <div className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
          {selectedDomain?.icon || <Sparkles size={20} className="text-white" />}
        </div>
        <h2 className={cn("text-xl font-semibold mb-1", isDarkMode ? "text-slate-100" : "text-slate-900")}>
          {selectedDomain ? selectedDomain.label : "Infenix"}
        </h2>
        <p className={cn("text-sm mb-6 max-w-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>
          {selectedDomain?.description ?? "Ask me anything"}
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-sm">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                if (onChipClick) onChipClick(chip);
                else if (onPromptClick) onPromptClick(chip);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isDarkMode
                  ? "border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Main message list ---
  return (
    <div
      className={cn(
        "min-h-full transition-colors duration-200",
        isDarkMode ? "bg-slate-900" : "bg-white"
      )}
    >
      {/* Keyframe animations for streaming token fade-in and message entrance */}
      <style>{`
        @keyframes msgEntrance {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes streamReveal {
          from { opacity: 0.6; }
          to   { opacity: 1; }
        }
        @keyframes thinkExpand {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .thinking-scroll::-webkit-scrollbar { width: 3px; }
        .thinking-scroll::-webkit-scrollbar-track { background: transparent; }
        .thinking-scroll::-webkit-scrollbar-thumb { background: #c4b5fd; border-radius: 99px; }
      `}</style>
      {/* Centered readable column — same as Claude.ai */}
      <div className="mx-auto w-full max-w-3xl px-6 py-5">
        {messages.map((message, index) => {
          const firstInGroup = isFirstInGroup(index);
          const lastInGroup = isLastInGroup(index);

          return (
            <div
              key={message.id}
              id={`message-${message.id}`}
              className={cn(
                "group",
                lastInGroup ? "mb-7" : "mb-1.5"
              )}
              style={
                index >= messages.length - 3
                  ? {
                      animation: "msgEntrance 0.2s ease-out both",
                      animationDelay: `${(index - (messages.length - 3)) * 60}ms`,
                    }
                  : undefined
              }
            >
              {message.sender === "user" ? (
                /* User bubble — right-aligned, constrained width */
                <div className="flex justify-end">
                  <div className={cn(
                    "max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed",
                    isDarkMode
                      ? "bg-slate-700 text-slate-100"
                      : "bg-slate-100 text-slate-900"
                  )}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ) : (
                /* AI message — full width with avatar, no bubble */
                <div className="flex items-start gap-3">
                  {firstInGroup ? (
                    <Avatar className="h-8 w-8 mt-0.5 flex-shrink-0 ring-1 ring-slate-200 dark:ring-slate-700">
                      <AvatarImage src="/ai-avatar.png" alt="AI" />
                      <AvatarFallback className="bg-violet-600 text-white font-semibold text-xs">AI</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 pt-0.5">
                    {renderAIMessage(message)}
                  </div>
                </div>
              )}

              {/* Hover actions */}
              <div className={cn(
                "flex items-center mt-1 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                message.sender === "user" ? "justify-end pr-1" : "justify-start pl-11"
              )}>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(message.timestamp)}
                </span>

                {message.sender === "ai" && !message.isError && !message.isStreaming && (
                  <div className={cn(
                    "flex items-center gap-0.5 px-1 py-0.5 rounded-full border",
                    isDarkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-slate-200 shadow-sm"
                  )}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className={cn("h-6 w-6 rounded-full", isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100")}
                          onClick={() => handleStar(message.id, message.starred)}
                          aria-label={message.starred ? "Unstar" : "Star"}
                        >
                          <Star size={11} className={cn(message.starred ? "fill-yellow-500 text-yellow-500" : isDarkMode ? "text-slate-500" : "text-slate-400")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{message.starred ? "Remove star" : "Star"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className={cn("h-6 w-6 rounded-full", isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100")}
                          onClick={() => {
                            const parsed = parseAIResponse(message.content);
                            handleCopy(parsed?.response ?? message.content, message.id);
                          }}
                          aria-label="Copy"
                        >
                          {copiedMessageId === message.id
                            ? <Check size={11} className="text-green-500" />
                            : <Copy size={11} className={isDarkMode ? "text-slate-500" : "text-slate-400"} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{copiedMessageId === message.id ? "Copied!" : "Copy"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className={cn("h-6 w-6 rounded-full", isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100")}
                          onClick={() => onPlayMessage(message.id, message.content)}
                          aria-label={currentlyPlaying === message.id ? "Pause" : "Play"}
                        >
                          {currentlyPlaying === message.id ? <Pause size={11} /> : <Play size={11} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{currentlyPlaying === message.id ? "Pause" : "Play"}</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator removed — streaming message with blinking cursor is the loading state */}

        <div ref={messagesEndRef} />
      </div>

      {showJumpBtn && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-5 z-10 flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs shadow-md hover:opacity-90 transition-all animate-in fade-in duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Jump to latest message"
        >
          <ChevronDown size={12} />
          Latest
        </button>
      )}
    </div>
  );
};

export default ChatArea;
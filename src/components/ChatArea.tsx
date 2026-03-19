import { Message } from "@/types/chat";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Copy, Check, Code, Eye, Download, Image, FileText, Sparkles, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from 'framer-motion';
import ReactMarkdown from "react-markdown";
import MessageInput from "@/components/MessageInput";

interface ChatAreaProps {
  messages: Message[];
  isLoading?: boolean;
  onToggleStar: (messageId: string) => void;
  onPlayMessage: (messageId: string, content: string) => void;
  currentlyPlaying: string | null;
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

const ChatArea = ({ messages, isLoading, onToggleStar, onPlayMessage, currentlyPlaying, selectedDomain, onPromptClick }: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (messages.length > 0) {
      const scrollOptions: ScrollIntoViewOptions = {
        behavior: "smooth",
        block: "end" as ScrollLogicalPosition
      };
      messagesEndRef.current?.scrollIntoView(scrollOptions);
    }
  }, [messages]);

  // Add a new effect to handle scroll on window resize
  useEffect(() => {
    const handleResize = () => {
      if (messages.length > 0) {
        const scrollOptions: ScrollIntoViewOptions = {
          behavior: "smooth",
          block: "end" as ScrollLogicalPosition
        };
        messagesEndRef.current?.scrollIntoView(scrollOptions);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [messages.length]);

  const formatTimestamp = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const parseAIResponse = (content: string): ParsedResponse | null => {
    try {
      // First, try to parse JSON format
      const jsonMatch = content.match(/```json\s*({[\s\S]*?})\s*```/) || 
                       content.match(/json\s*({[\s\S]*?})\s*/) ||
                       content.match(/```json\s*({[\s\S]*?})\s*```/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        try {
        const parsed = JSON.parse(jsonStr);
        return parsed;
        } catch (jsonError) {
          // If JSON parsing fails, try to extract response and code manually
          const responseMatch = jsonStr.match(/"response"\s*:\s*"([^"]*)"/);
          // Try both backticks and double quotes for code
          const codeMatch = jsonStr.match(/"code"\s*:\s*`([\s\S]*?)`/) || 
                          jsonStr.match(/"code"\s*:\s*"([\s\S]*?)"(?=\s*})/);
          
          if (responseMatch && codeMatch) {
            return {
              response: responseMatch[1],
              code: codeMatch[1]
            };
          }
        }
      }

      if (content.trim().startsWith("{") && content.trim().endsWith("}")) {
        try {
        return JSON.parse(content);
        } catch (jsonError) {
          // If JSON parsing fails, try to extract response and code manually
          const responseMatch = content.match(/"response"\s*:\s*"([^"]*)"/);
          // Try both backticks and double quotes for code
          const codeMatch = content.match(/"code"\s*:\s*`([\s\S]*?)`/) || 
                          content.match(/"code"\s*:\s*"([\s\S]*?)"(?=\s*})/);
          
          if (responseMatch && codeMatch) {
            return {
              response: responseMatch[1],
              code: codeMatch[1]
            };
          }
        }
      }

      // Check for the markdown-like format with "### Render Code Below ###"
      const codeMarkerMatch = content.match(/### Render Code Below ###\s*([\s\S]+)/);
      if (codeMarkerMatch) {
        const beforeCode = content.substring(0, content.indexOf("### Render Code Below ###")).trim();
        const codeContent = codeMarkerMatch[1].trim();
        
        // Extract HTML from code blocks if present
        const htmlMatch = codeContent.match(/```html\s*([\s\S]*?)\s*```/) || 
                         codeContent.match(/```\s*(<!DOCTYPE html[\s\S]*?)\s*```/);
        
        const htmlCode = htmlMatch ? htmlMatch[1] : codeContent;
        
        return {
          response: beforeCode,
          code: htmlCode
        };
      }

      // If the content is not JSON or markdown, treat it as a plain response
      if (!content.includes("```json") && !content.includes("{") && !content.includes("### Render Code Below ###")) {
        return {
          response: content,
          code: ""
        };
      }

      return null;
    } catch (error) {
      console.error("Error parsing AI response:", error);
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

      toast.success(`${isCode ? "Code" : "Message"} copied to clipboard`, {
        duration: 2000,
      });
    } catch (err) {
      toast.error(`Failed to copy ${isCode ? "code" : "message"}`, {
        duration: 2000,
      });
    }
  };

  const downloadAsImage = async (htmlContent: string, messageId: string) => {
    setDownloadingId(messageId);
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1200px';
      iframe.style.height = 'auto';
      iframe.style.minHeight = '800px';
      iframe.style.border = 'none';
      iframe.style.overflow = 'visible';
      document.body.appendChild(iframe);

      iframe.contentDocument?.open();
      iframe.contentDocument?.write(htmlContent);
      iframe.contentDocument?.close();

      // Wait for iframe to load and content to render
      await new Promise(resolve => {
        iframe.onload = () => {
          setTimeout(resolve, 3000); // Increased wait time
        };
        setTimeout(resolve, 5000); // Fallback timeout
      });

      // Get the actual content height
      const body = iframe.contentDocument?.body;
      if (body) {
        body.style.margin = '0';
        body.style.padding = '20px';
        const contentHeight = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          800
        );
        iframe.style.height = `${contentHeight + 40}px`;
      }

      // Wait a bit more for height adjustment
      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await html2canvas(iframe.contentDocument?.body || document.body, {
        width: 1200,
        height: iframe.contentDocument?.body?.scrollHeight || 800,
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
        windowHeight: iframe.contentDocument?.body?.scrollHeight || 800,
      });

      const imageData = canvas.toDataURL('image/png', 0.95);
      
      // Save to library
      const savedImages = JSON.parse(localStorage.getItem('savedImages') || '[]');
      const newImage = {
        id: Date.now(),
        data: imageData,
        timestamp: new Date().toISOString(),
        title: `Study Tool ${new Date().toLocaleDateString()}`
      };
      savedImages.push(newImage);
      localStorage.setItem('savedImages', JSON.stringify(savedImages));

      // Download the image
      const link = document.createElement('a');
      link.download = `study-tool-${Date.now()}.png`;
      link.href = imageData;
      link.click();

      document.body.removeChild(iframe);
      
      toast.success("Study tool saved to library and downloaded!", { duration: 3000 });
    } catch (error) {
      console.error("Error downloading as image:", error);
      toast.error("Failed to download as image. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadAsPDF = async (htmlContent: string, messageId: string) => {
    setDownloadingId(messageId);
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;
      
      // Create iframe with proper setup
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1200px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      document.body.appendChild(iframe);
  
      // Enhanced HTML for PDF with better scaling
      const enhancedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { box-sizing: border-box; }
            body { 
              margin: 0 !important; 
              padding: 15px !important; 
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
              width: 1170px !important;
              font-size: 14px;
              line-height: 1.4;
            }
            html, body { height: auto !important; }
            /* Scale down content slightly for PDF */
            body > * {
              transform-origin: top left;
              transform: scale(0.95);
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;

      iframe.contentDocument?.open();
      iframe.contentDocument?.write(enhancedHtml);
      iframe.contentDocument?.close();

      // Wait for full content load
      await new Promise(resolve => {
        const checkLoaded = () => {
          if (iframe.contentDocument?.readyState === 'complete') {
            setTimeout(resolve, 1500); // More time for PDF preparation
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
  
      // Get content dimensions
      const iframeDoc = iframe.contentDocument;
      const body = iframeDoc?.body;
      const html = iframeDoc?.documentElement;
      
      if (!body || !html) {
        throw new Error('Could not access iframe content');
      }
  
      const contentHeight = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      );
  
      const contentWidth = 1200; // Fixed width for PDF
  
      // Resize iframe
      iframe.style.width = `${contentWidth}px`;
      iframe.style.height = `${contentHeight + 40}px`;
  
      await new Promise(resolve => setTimeout(resolve, 500));
  
      // Capture canvas
      const canvas = await html2canvas(body, {
        width: contentWidth,
        height: contentHeight,
        scale: 1.5, // Good balance for PDF
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: contentWidth,
        windowHeight: contentHeight,
      });
  
      // Create PDF with proper sizing
      const imgData = canvas.toDataURL('image/png', 0.9);
      
      // Calculate PDF dimensions (A4 proportions but flexible height)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
  
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit PDF width
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      // If content is taller than one page, we might need multiple pages
      if (imgHeight > pdfHeight - 20) {
        // Calculate how many pages we need
        const pageHeight = pdfHeight - 20; // Account for margins
        const numPages = Math.ceil(imgHeight / pageHeight);
        
        for (let i = 0; i < numPages; i++) {
          if (i > 0) pdf.addPage();
          
          const yPosition = -i * pageHeight;
          pdf.addImage(imgData, 'PNG', 10, 10 + yPosition, imgWidth, imgHeight);
        }
      } else {
        // Content fits on one page
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      }
  
      pdf.save(`study-tool-${Date.now()}.pdf`);

      document.body.removeChild(iframe);
      
      toast.success("Study tool downloaded as PDF!", { duration: 3000 });
    } catch (error) {
      console.error("Error downloading as PDF:", error);
      toast.error("Failed to download as PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStar = (messageId: string, isStarred: boolean) => {
    onToggleStar(messageId);
    toast.success(
      isStarred
        ? "Message removed from starred collection"
        : "Message starred and saved to your collection",
      { duration: 2000 }
    );
  };

  const parseMarkdown = (text: string) => {
    // Remove reference numbers like [1][2][5]
    text = text.replace(/\[\d+\]/g, '');
    
    // Handle headings
    text = text.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mb-2">$1</h3>');
    text = text.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-3">$1</h2>');
    text = text.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>');
    
    // Handle bold and italic
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Handle lists
    text = text.replace(/^\d+\. (.*$)/gm, '<li class="mb-2">$1</li>');
    text = text.replace(/^- (.*$)/gm, '<li class="mb-2">$1</li>');
    text = text.replace(/(<li class="mb-2">.*<\/li>\n?)+/g, '<ul class="list-disc pl-6 mb-4">$&</ul>');
    
    // Handle paragraphs
    text = text.replace(/^(?!<[h|u|o])(.*$)/gm, '<p class="mb-4 leading-relaxed">$1</p>');
    
    // Clean up empty paragraphs
    text = text.replace(/<p class="mb-4 leading-relaxed"><\/p>/g, '');
    
    return text;
  };

  const renderAIMessage = (message: Message) => {
    const parsedResponse = parseAIResponse(message.content);

    console.log("Parsed response for message:", message.id, parsedResponse); // Debug log

    if (parsedResponse && parsedResponse.code) {
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
              <div className="flex-1">
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(parsedResponse.response) }}
                />
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
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(parsedResponse.code!, message.id, true)}
                        className={cn("hover:bg-slate-50", isDarkMode && "bg-slate-600 text-slate-100 border-slate-500 hover:bg-slate-500")}
                      >
                        {copiedCodeId === message.id ? (
                          <Check size={14} className="mr-2" />
                        ) : (
                          <Copy size={14} className="mr-2" />
                        )}
                        Copy Code
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                      {copiedCodeId === message.id ? "Code copied!" : "Copy HTML code"}
                    </TooltipContent>
                  </Tooltip>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={downloadingId === message.id}
                      className={cn("hover:bg-slate-50", isDarkMode && "bg-slate-600 text-slate-100 border-slate-500 hover:bg-slate-500")}
                    >
                      {downloadingId === message.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download size={14} className="mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                    <DropdownMenuItem 
                      onClick={() => downloadAsImage(parsedResponse.code!, message.id)}
                      disabled={downloadingId === message.id}
                      className={isDarkMode ? "hover:bg-slate-600" : ""}
                    >
                      <Image size={14} className="mr-2" />
                      Download as PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => downloadAsPDF(parsedResponse.code!, message.id)}
                      disabled={downloadingId === message.id}
                      className={isDarkMode ? "hover:bg-slate-600" : ""}
                    >
                      <FileText size={14} className="mr-2" />
                      Download as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className={cn("rounded-xl overflow-hidden shadow-inner", isDarkMode ? "border-2 border-slate-600 bg-slate-700" : "border-2 border-slate-200 bg-white")}>
                <iframe
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>
                        body {
                          margin: 0;
                          padding: 0;
                          font-family: system-ui, -apple-system, sans-serif;
                        }
                      </style>
                    </head>
                    <body>
                      ${parsedResponse.code}
                    </body>
                    </html>
                  `}
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
          <div className="flex-1">
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
            />
          </div>
        </div>
      </div>
    );
  };

  const getDomainPrompts = (domainId: string) => {
    const prompts = {
      creative: [
        "Help me brainstorm creative writing ideas",
        "Show me how to create an interactive art piece",
        "Teach me about storytelling techniques"
      ],
      finance: [
        "Explain basic investment strategies",
        "Help me create a personal budget plan",
        "What are the best practices for saving money?"
      ],
      health: [
        "Guide me through a mindfulness exercise",
        "Explain the benefits of regular exercise",
        "How can I improve my mental wellbeing?"
      ],
      research: [
        "Help me analyze this research paper",
        "Explain the scientific method",
        "What are the latest developments in AI?"
      ],
      casual: [
        "Tell me an interesting fact",
        "What's a fun way to learn something new?",
        "Share a quick brain teaser"
      ]
    };
    return prompts[domainId as keyof typeof prompts] || [];
  };

  const handlePromptClick = (prompt: string) => {
    setSelectedPrompt(prompt);
    if (onPromptClick) {
      onPromptClick(prompt);
    }
  };

  return (
    <div 
      className={cn("flex-grow overflow-y-auto p-6 transition-colors duration-200", isDarkMode ? "bg-slate-900 text-slate-200" : "bg-gradient-to-br from-slate-50 via-white to-blue-50")}
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className={cn("p-6 rounded-2xl shadow-lg border max-w-md", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {selectedDomain?.icon || <Sparkles size={24} className="text-white" />}
            </div>
            <h3 className={cn("text-xl font-semibold mb-3", isDarkMode ? "text-slate-100" : "text-slate-800")}>
              {selectedDomain ? `Welcome to ${selectedDomain.label}!` : "Start Your Conversation"}
            </h3>
            {selectedDomain && (
              <p className={cn("leading-relaxed mb-6", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                {selectedDomain.description}
              </p>
            )}
            {selectedDomain && onPromptClick && (
              <div className="space-y-3 mt-4">
                {getDomainPrompts(selectedDomain.id).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    className={cn(
                      "w-full p-3 text-left rounded-lg transition-all duration-200",
                      isDarkMode 
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-200" 
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            {!selectedDomain && (
              <p className={cn("leading-relaxed", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                Ask me anything! I can help you learn, solve problems, or create interactive study materials.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              id={`message-${message.id}`}
              className={cn(
                "flex flex-col mb-8 transition-all duration-200 group",
                message.sender === "user" ? "items-end" : "items-start"
              )}
            >
              <div className="flex items-start gap-4 w-full max-w-[95%]">
                {message.sender === "ai" && (
                  <Avatar className="h-10 w-10 mt-1 flex-shrink-0 shadow-md border-2 border-white">
                    <AvatarImage src="/ai-avatar.png" alt="AI" />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="flex flex-col w-full">
                  {message.sender === "user" ? (
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-md p-5 ml-auto shadow-lg">
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                  ) : (
                    renderAIMessage(message)
                  )}

                  <div className="flex items-center justify-between mt-3 px-2">
                    <span className={cn("text-xs font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                      {formatTimestamp(message.timestamp)}
                    </span>

                    {message.sender === "ai" && (
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn("h-8 w-8 rounded-full", isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100")}
                              onClick={() => handleStar(message.id, message.starred)}
                              aria-label={message.starred ? "Unstar message" : "Star message"}
                            >
                              <Star
                                size={14}
                                className={cn(
                                  "transition-colors duration-200",
                                  message.starred
                                    ? "fill-yellow-500 text-yellow-500"
                                    : isDarkMode ? "text-slate-500 hover:text-yellow-500" : "text-slate-400 hover:text-yellow-500"
                                )}
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                            {message.starred ? "Remove from starred" : "Add to starred"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn("h-8 w-8 rounded-full", isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100")}
                              onClick={() => {
                                const parsed = parseAIResponse(message.content);
                                const contentToCopy = parsed ? parsed.response : message.content;
                                handleCopy(contentToCopy, message.id);
                              }}
                              aria-label="Copy message"
                            >
                              {copiedMessageId === message.id ? (
                                <Check size={14} className="text-green-500" />
                              ) : (
                                <Copy size={14} className={isDarkMode ? "text-slate-500 hover:text-slate-400" : "text-slate-400 hover:text-slate-600"} />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className={isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200" : ""}>
                            {copiedMessageId === message.id ? "Copied!" : "Copy message"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn("h-8 w-8 rounded-full", isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100")}
                              onClick={() => onPlayMessage(message.id, message.content)}
                            >
                              {currentlyPlaying === message.id ? <Pause size={16} /> : <Play size={16} />}
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
          ))}
          {isLoading && (
            <div className="flex items-start gap-4 mb-8">
              <Avatar className="h-10 w-10 mt-1 shadow-md border-2 border-white">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className={cn("border rounded-2xl rounded-tl-md p-6 shadow-sm", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                <div className="flex items-center gap-3">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                    <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                  </div>
                  <span className={cn("text-sm", isDarkMode ? "text-slate-400" : "text-slate-500")}>AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default ChatArea;
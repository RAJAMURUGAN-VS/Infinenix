import { useState } from "react";
import { Message } from "@/types/chat";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  starredMessages: Message[];
  onToggleStar: (messageId: string) => void;
  onMessageClick: (messageId: string) => void;
}

const SearchModal = ({
  isOpen,
  onClose,
  messages,
  starredMessages,
  onToggleStar,
  onMessageClick,
}: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMessages = messages.filter((message) =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (dateInput: string | number | Date) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessagePreview = (content: string): string => {
    try {
      // Try to parse JSON content
      const jsonMatch = content.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) || 
                       content.match(/json\s*({[\s\S]*?})\s*/) ||
                       content.match(/```json\s*({[\s\S]*?})\s*```/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1].trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.response) {
          return parsed.response.length > 100 ? `${parsed.response.substring(0, 100)}...` : parsed.response;
        }
      }
    } catch (error) {
      // If JSON parsing fails, return the original content
      return content.length > 100 ? `${content.substring(0, 100)}...` : content;
    }
    
    // Default case: return truncated original content
    return content.length > 100 ? `${content.substring(0, 100)}...` : content;
  };

  const handleMessageClick = (messageId: string) => {
    onMessageClick(messageId);
    onClose();
  };

  const renderMessageItem = (message: Message) => (
    <div
      key={message.id}
      className="flex items-start gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
      onClick={() => handleMessageClick(message.id)}
    >
      <Avatar className="h-8 w-8 mt-1">
        <AvatarImage src="/ai-avatar.png" alt="AI" />
        <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">AI Assistant</span>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {getMessagePreview(message.content)}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(message.id);
        }}
        className="p-1 hover:bg-accent rounded-md"
      >
        <Star
          size={16}
          className={cn(
            message.starred
              ? "fill-yellow-500 text-yellow-500"
              : "text-muted-foreground"
          )}
        />
      </button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] p-0 flex flex-col">
        <Tabs defaultValue="search" className="flex flex-col h-full">
          {/* Tabs Header */}
          <div className="border-b px-4 py-2">
            <TabsList>
              <TabsTrigger value="search">Search Messages</TabsTrigger>
              <TabsTrigger value="starred">Starred Messages</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Search Tab Content */}
          <TabsContent value="search" className="h-[calc(100%-3rem)]">
            <Command className="h-full">
              <CommandInput
                placeholder="Search messages..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList className="max-h-[calc(100%-3.5rem)] overflow-y-auto">
                <CommandEmpty>No messages found.</CommandEmpty>
                {searchQuery !== "" && (
                <CommandGroup>
                  {filteredMessages.map(renderMessageItem)}
                </CommandGroup>
                )}
              </CommandList>
            </Command>
          </TabsContent>

          {/* Starred Tab Content */}
          <TabsContent value="starred" className="h-[calc(100%-3rem)]">
            <Command className="h-full">
              <CommandInput
                placeholder="Filter starred messages..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList className="max-h-[calc(100%-3.5rem)] overflow-y-auto">
                <CommandEmpty>No starred messages found.</CommandEmpty>
                {searchQuery !== "" && (
                <CommandGroup>
                  {starredMessages
                    .filter((message) =>
                      message.content.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(renderMessageItem)}
                </CommandGroup>
                )}
              </CommandList>
            </Command>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;

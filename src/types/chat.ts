export interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  starred: boolean;
}

export type FilterTag = {
  id: string;
  label: string;
  type: 'category' | 'type' | 'topic' | 'visual' | 'design';
};

export type User = {
  name: string;
  avatar: string;
};

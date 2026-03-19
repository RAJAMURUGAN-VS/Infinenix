export interface RecommendedTool {
  name: string;
  description: string;
  confidence: number;
}

export interface IntentResult {
  matched_intention: string | null;
  confidence: number;
  recommended_tools: RecommendedTool[];
}
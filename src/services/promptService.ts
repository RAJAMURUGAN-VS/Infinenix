// services/promptService.ts
import { IntentResult } from "./apiService";
import { CharacterData } from "./characterService";

export class PromptService {
  /**
   * Creates an optimized system prompt based on detected intent and recommended tools
   */
  static createOptimizedSystemPrompt(intent: IntentResult): string {
    if (!intent.recommended_tools.length) {
      // Fallback prompt if no tools recommended
      return `Return a JSON with two fields:

1. **response**: Helpful answer to user's intent: "${intent.matched_intention || "Unknown"}".
2. **code**: HTML + CSS code for a static website illustrating a useful method to address the user's query.

Be specific and relevant to the task.`;
    }

    // Pick top tool with highest confidence
    const topTool = intent.recommended_tools.reduce((prev, curr) =>
      curr.confidence > prev.confidence ? curr : prev
    );

    return `You are a helpful AI assistant.

User intent: "${intent.matched_intention}"
Top recommended tool:
- Name: ${topTool.name}
- Description: ${topTool.description}

Return a JSON with two fields:

1. "response": A helpful, concise explanation answering the user's intent.
2. "code": Complete HTML + CSS code for a static website section that visually demonstrates and explains the method "${topTool.name}" to help the user achieve their goal.
<html>...interactive flashcards or roadmap layout...</html>

Make the HTML self-contained, clean, modern, responsive, and visually appealing. Avoid external dependencies.

Only return the JSON object, no extra text.`;
  }

  /**
   * Creates a casual conversation system prompt, optionally with character data
   */
  static createCasualSystemPrompt(characterData?: CharacterData | null): string {
    if (characterData?.name && characterData?.role && characterData?.systemPrompt) {
      return `
You are ${characterData.name}, a ${characterData.role}.

Core Personality:
${characterData.systemPrompt}

${characterData.lifeStage ? `Current Life Stage: "${characterData.lifeStage.stage}"
${characterData.lifeStage.description}` : ''}

Behavior Guidelines:
- Stay in character and reflect both your core personality and current life stage.
- Respond briefly and clearly, avoiding unnecessary facts or digressions.
- Use language appropriate to your life stage and role.
- Keep the tone consistent (e.g., playful for child, witty for teen, professional for adult, wise for senior).
- Encourage learning with supportive and engaging answers.
      `.trim();
    }

    return `You are a friendly AI companion. Respond naturally and helpfully with a conversational tone.`;
  }

  /**
   * Validates if a system prompt meets basic requirements
   */
  static validatePrompt(prompt: string): boolean {
    return prompt.trim().length > 0 && prompt.length <= 4000; // Basic validation
  }

  /**
   * Creates a prompt for specific use cases (can be extended)
   */
  static createCustomPrompt(type: 'creative' | 'analytical' | 'educational', context?: string): string {
    const basePrompts = {
      creative: "You are a creative assistant focused on imaginative and innovative responses.",
      analytical: "You are an analytical assistant focused on logical reasoning and data-driven insights.",
      educational: "You are an educational assistant focused on clear explanations and learning outcomes."
    };

    let prompt = basePrompts[type];
    
    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    return prompt;
  }
}
export interface LifeStage {
  stage: string;
  description: string;
}

export interface CharacterData {
  characterId: number;
  name: string;
  role: string;
  systemPrompt: string;
  voiceId: string;
  lifeStage: LifeStage;
}
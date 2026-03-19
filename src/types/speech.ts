export interface SpeechRequest {
  text: string;
  character: {
    role: string;
    voiceId: string;
  };
}

export interface SpeechResponse {
  audioBlob: Blob;
  duration?: number;
}
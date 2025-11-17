import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is not set. Please set it in your environment variables."
      );
    }
    openaiInstance = new OpenAI({
      apiKey,
    });
  }
  return openaiInstance;
}

// For backward compatibility, export as default
export const openai = {
  get chat() {
    return getOpenAI().chat;
  },
  get images() {
    return getOpenAI().images;
  },
  get audio() {
    return getOpenAI().audio;
  },
  get embeddings() {
    return getOpenAI().embeddings;
  },
  get models() {
    return getOpenAI().models;
  },
};


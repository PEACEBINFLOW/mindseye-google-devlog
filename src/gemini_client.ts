import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiConfig {
  apiKey: string;
  modelId: string;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private modelId: string;

  constructor(cfg: GeminiConfig) {
    this.genAI = new GoogleGenerativeAI(cfg.apiKey);
    this.modelId = cfg.modelId;
  }

  async summarizeDevlogContext(context: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.modelId });

    const prompt = [
      "You are MindsEye, writing a developer log.",
      "",
      "Here is a structured summary of recent activity:",
      "",
      context,
      "",
      "Task:",
      "Write a short narrative devlog intro (2–4 paragraphs) summarizing what happened,",
      "what was learned, and what might come next. Tone: clear, curious, not overly formal.",
      "",
      "Return only the devlog text."
    ].join("\n");

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }
}

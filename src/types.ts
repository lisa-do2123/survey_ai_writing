export type Likert = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SurveyData = {
  likert: Record<string, Likert>;

  writing: {
    storyText: string;
    startedAt?: number;
    submittedAt?: number;
    sentenceCount?: number;
    wordCount?: number;
  };

  chat: {
    messages: { role: "user" | "assistant"; content: string; ts: number }[];
    stats: {
      promptCount: number;
      totalPromptChars: number;
      totalReplyChars: number;
    };
  };

  telemetry: {
    events: { type: string; ts: number; meta?: any }[];
  };

  authorship: { value?: number; reason?: string };

  demo: {
    age?: string;
    gender?: string;
    edu?: string;
    contactOptIn?: boolean;
    email?: string;
    openEnded?: string;
  };
};

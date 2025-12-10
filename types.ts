export enum TestModule {
  LISTENING = 'Listening',
  READING = 'Reading',
  WRITING = 'Writing',
  SPEAKING = 'Speaking',
}

export interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'true-false-not-given' | 'fill-gap';
  options?: string[];
  correctAnswer: string;
  questionTag: string; // e.g., "Main Idea", "Inference", "Vocabulary"
}

export interface TestContent {
  passageText?: string; // For Reading
  audioScript?: string; // For Listening (internal use mostly)
  audioBase64?: string; // For Listening playback
  questions: Question[];
  writingPrompt?: {
    task1: string;
    task2: string;
  };
  speakingPrompts?: {
    part1: string[];
    part2: string;
    part3: string[];
  };
}

export interface CriterionScore {
  score: number;
  feedback: string;
}

export interface DetailedFeedback {
  bandScore: number;
  module: TestModule;
  criteria: Record<string, CriterionScore>;
  generalFeedback: string;
  improvementPlan: string[];
}

export interface TestResult {
  module: TestModule;
  userAnswers?: Record<number, string>; // ID -> Answer
  rawScore?: number; // For Listening/Reading
  totalQuestions?: number;
  feedback: DetailedFeedback;
}

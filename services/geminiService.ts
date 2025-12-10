import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { TestModule, DetailedFeedback, TestContent, Question } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper Schemas ---

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.INTEGER },
    text: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['multiple-choice', 'true-false-not-given', 'fill-gap'] },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctAnswer: { type: Type.STRING },
    questionTag: { type: Type.STRING, description: "Skill being tested, e.g., 'Gist', 'Detail', 'Inference'" },
  },
  required: ['id', 'text', 'type', 'correctAnswer', 'questionTag']
};

const testContentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    passageText: { type: Type.STRING, description: "The reading passage or listening script text." },
    questions: { type: Type.ARRAY, items: questionSchema },
  },
  required: ['passageText', 'questions']
};

const feedbackSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    bandScore: { type: Type.NUMBER },
    criteria: {
      type: Type.OBJECT,
      properties: {
        criterion1: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING } } },
        criterion2: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING } } },
        criterion3: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING } } },
        criterion4: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING } } },
      }
    },
    generalFeedback: { type: Type.STRING },
    improvementPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};

// --- Generators ---

export const generateReadingTest = async (): Promise<TestContent> => {
  const model = "gemini-2.5-flash";
  const prompt = `Generate a challenging Academic IELTS Reading passage (approx 600 words) about a topic in science, history, or sociology. 
  Follow it with 5 questions. Mix Multiple Choice, True/False/Not Given.
  Return JSON with 'passageText' and 'questions'.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: testContentSchema,
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateListeningTest = async (): Promise<TestContent> => {
  const model = "gemini-2.5-flash";
  // 1. Generate Script and Questions
  const textPrompt = `Generate a script for an IELTS Listening Section 3 (Academic discussion between 2 students/tutor). 
  Approx 400 words. Follow with 5 questions based on the script.
  Return JSON with 'passageText' (the script) and 'questions'.`;

  const textResponse = await ai.models.generateContent({
    model,
    contents: textPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: testContentSchema,
    }
  });

  const content = JSON.parse(textResponse.text || "{}");

  // 2. Generate Audio via TTS
  const ttsResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: content.passageText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Male voice suitable for academic context
        },
      },
    },
  });

  const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  return {
    ...content,
    audioScript: content.passageText,
    audioBase64: audioData,
  };
};

export const generateWritingPrompts = async (): Promise<{ task1: string, task2: string }> => {
  const model = "gemini-2.5-flash";
  const prompt = `Generate one IELTS Academic Writing Task 1 prompt (describe a graph/chart - provide the text description of data) and one Task 2 prompt (essay question).
  Return JSON: { "task1": "...", "task2": "..." }`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          task1: { type: Type.STRING },
          task2: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateSpeakingPrompts = async (): Promise<{ part1: string[], part2: string, part3: string[] }> => {
  const model = "gemini-2.5-flash";
  const prompt = `Generate IELTS Speaking prompts.
  Part 1: 3 introductory questions.
  Part 2: A cue card topic.
  Part 3: 3 abstract discussion questions related to Part 2.
  Return JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          part1: { type: Type.ARRAY, items: { type: Type.STRING } },
          part2: { type: Type.STRING },
          part3: { type: Type.ARRAY, items: { type: Type.STRING } },
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

// --- Evaluators ---

export const evaluateWriting = async (task1: string, task2: string, prompt1: string, prompt2: string): Promise<DetailedFeedback> => {
  const model = "gemini-2.5-flash"; // Using flash for speed, Pro for deeper logic if needed. Flash is good for structure.
  
  const prompt = `Act as an expert IELTS Examiner. Evaluate these two writing tasks.
  
  PROMPT 1: ${prompt1}
  RESPONSE 1: ${task1}
  
  PROMPT 2: ${prompt2}
  RESPONSE 2: ${task2}
  
  Provide a holistic academic band score and detailed breakdown for:
  1. Task Achievement / Response
  2. Coherence & Cohesion
  3. Lexical Resource
  4. Grammatical Range & Accuracy
  
  Also provide specific improvement steps.
  Return JSON matching the schema.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: feedbackSchema,
      systemInstruction: "You are a strict IELTS Academic examiner. Be critical but constructive."
    }
  });

  const raw = JSON.parse(response.text || "{}");
  // Map raw criteria names to standard names for UI consistency if needed, 
  // but we will rely on the UI to map the keys 'criterion1' etc if the schema wasn't explicit enough on names.
  // Ideally, we force the names in schema. Let's do a post-mapping or loose rendering.
  // For safety, let's map them to strict keys.
  
  return {
    bandScore: raw.bandScore,
    module: TestModule.WRITING,
    criteria: {
      "Task Achievement": raw.criteria.criterion1 || { score: 0, feedback: "N/A" },
      "Coherence & Cohesion": raw.criteria.criterion2 || { score: 0, feedback: "N/A" },
      "Lexical Resource": raw.criteria.criterion3 || { score: 0, feedback: "N/A" },
      "Grammatical Range": raw.criteria.criterion4 || { score: 0, feedback: "N/A" },
    },
    generalFeedback: raw.generalFeedback,
    improvementPlan: raw.improvementPlan
  };
};

export const evaluateSpeaking = async (audioBlobBase64: string, prompts: any): Promise<DetailedFeedback> => {
  const model = "gemini-2.5-flash-native-audio-preview-09-2025"; // Multimodal model
  
  const promptText = `This is a recording of an IELTS Speaking test simulation.
  The user was asked: ${JSON.stringify(prompts)}.
  Evaluate the student's performance strictly on Academic IELTS criteria:
  1. Fluency and Coherence
  2. Lexical Resource
  3. Grammatical Range and Accuracy
  4. Pronunciation
  
  Provide a score (0-9) and detailed feedback for EACH criterion.
  Provide an overall Band Score.
  Provide a step-by-step improvement plan.
  Return JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: "audio/webm;codecs=opus", data: audioBlobBase64 } }, // Assuming webm from browser
        { text: promptText }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: feedbackSchema
    }
  });

  const raw = JSON.parse(response.text || "{}");
  
  return {
    bandScore: raw.bandScore,
    module: TestModule.SPEAKING,
    criteria: {
      "Fluency & Coherence": raw.criteria.criterion1,
      "Lexical Resource": raw.criteria.criterion2,
      "Grammatical Range": raw.criteria.criterion3,
      "Pronunciation": raw.criteria.criterion4,
    },
    generalFeedback: raw.generalFeedback,
    improvementPlan: raw.improvementPlan
  };
};

export const evaluateObjectiveTest = async (
  module: TestModule, 
  questions: Question[], 
  answers: Record<number, string>,
  totalScore: number
): Promise<DetailedFeedback> => {
  const model = "gemini-2.5-flash";
  
  // Prepare data for qualitative analysis
  const performanceSummary = questions.map(q => ({
    tag: q.questionTag,
    isCorrect: (answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()),
    userAnswer: answers[q.id],
    correctAnswer: q.correctAnswer
  }));

  const prompt = `Analyze this IELTS ${module} test performance.
  Total Score: ${totalScore}/${questions.length}.
  
  Question breakdown:
  ${JSON.stringify(performanceSummary)}
  
  Provide a detailed qualitative report.
  Map feedback to these 4 pseudo-criteria for detailed analytics:
  1. Understanding Main Ideas
  2. Understanding Details
  3. Inference & Logic
  4. Vocabulary & Context
  
  Provide an estimated Band Score based on ${totalScore}/${questions.length} (Scale approx: 5/5=9, 4/5=8, 3/5=6.5, etc - adapt for difficulty).
  Provide improvement plan.
  Return JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: feedbackSchema
    }
  });

  const raw = JSON.parse(response.text || "{}");
  
  return {
    bandScore: raw.bandScore,
    module: module,
    criteria: {
      "Main Ideas": raw.criteria.criterion1,
      "Specific Details": raw.criteria.criterion2,
      "Inference & Logic": raw.criteria.criterion3,
      "Vocabulary": raw.criteria.criterion4,
    },
    generalFeedback: raw.generalFeedback,
    improvementPlan: raw.improvementPlan
  };
};

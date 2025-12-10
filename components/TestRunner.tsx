import React, { useState, useEffect, useRef } from 'react';
import { TestModule, TestContent, TestResult } from '../types';
import * as GeminiService from '../services/geminiService';
import { Mic, StopCircle, Play, Pause, ArrowRight, Loader2, CheckCircle, Headphones } from 'lucide-react';

interface TestRunnerProps {
  module: TestModule;
  onComplete: (result: TestResult) => void;
  onCancel: () => void;
}

const TestRunner: React.FC<TestRunnerProps> = ({ module, onComplete, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<TestContent | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [writingAnswers, setWritingAnswers] = useState({ task1: '', task2: '' });
  
  // Speaking State
  const [recording, setRecording] = useState(false);
  const [speakingStep, setSpeakingStep] = useState(0); // 0=Intro, 1=Part1, 2=Part2, 3=Part3
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Audio Player State (Listening)
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadTestContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module]);

  const loadTestContent = async () => {
    setLoading(true);
    try {
      if (module === TestModule.READING) {
        const data = await GeminiService.generateReadingTest();
        setContent(data);
      } else if (module === TestModule.LISTENING) {
        const data = await GeminiService.generateListeningTest();
        setContent(data);
        if (data.audioBase64) {
          const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
          audioRef.current = new Audio(audioSrc);
          audioRef.current.onended = () => setIsPlaying(false);
        }
      } else if (module === TestModule.WRITING) {
        const prompts = await GeminiService.generateWritingPrompts();
        setContent({ questions: [], writingPrompt: prompts });
      } else if (module === TestModule.SPEAKING) {
        const prompts = await GeminiService.generateSpeakingPrompts();
        setContent({ questions: [], speakingPrompts: prompts });
      }
    } catch (error) {
      console.error("Failed to load test", error);
      alert("Error generating test content. Please try again.");
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const handleObjectiveSubmit = async () => {
    setLoading(true);
    if (!content) return;
    
    // Calculate raw score
    let score = 0;
    content.questions.forEach(q => {
      if (answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
        score++;
      }
    });

    const feedback = await GeminiService.evaluateObjectiveTest(module, content.questions, answers, score);
    onComplete({ module, rawScore: score, totalQuestions: content.questions.length, feedback });
  };

  const handleWritingSubmit = async () => {
    setLoading(true);
    if (!content?.writingPrompt) return;
    const feedback = await GeminiService.evaluateWriting(
      writingAnswers.task1, 
      writingAnswers.task2, 
      content.writingPrompt.task1, 
      content.writingPrompt.task2
    );
    onComplete({ module, feedback });
  };

  // --- Speaking Logic ---

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      recorder.start();
      setRecording(true);
    } catch (e) {
      console.error(e);
      alert("Microphone access required.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const submitSpeaking = async () => {
    if (!audioBlob) return;
    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
       const base64data = (reader.result as string).split(',')[1];
       const feedback = await GeminiService.evaluateSpeaking(base64data, content?.speakingPrompts);
       onComplete({ module, feedback });
    };
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // --- RENDERERS ---

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
        <p className="text-xl font-serif text-brand-800">
          {content ? "Analyzing Performance..." : "Generating Academic Content..."}
        </p>
        <p className="text-brand-500 mt-2">This utilizes advanced AI to simulate a real exam.</p>
      </div>
    );
  }

  if (module === TestModule.SPEAKING) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-serif font-bold text-brand-900">Speaking Test Simulation</h2>
          <p className="text-brand-600">
            {speakingStep === 0 && "Welcome. We will simulate all 3 parts. Ensure your microphone is ready. You will record the entire session in one go."}
            {speakingStep === 1 && "Part 1: Introduction. Answer the questions on screen naturally."}
            {speakingStep === 2 && "Part 2: Cue Card. Speak for 1-2 minutes on this topic."}
            {speakingStep === 3 && "Part 3: Discussion. Answer deeper questions related to the topic."}
            {speakingStep === 4 && "Test Complete. Stop recording to submit."}
          </p>
        </div>

        <div className="bg-brand-50 p-6 rounded-lg text-left min-h-[200px] flex flex-col justify-center">
          {speakingStep === 0 && (
             <button onClick={() => { setSpeakingStep(1); startRecording(); }} className="bg-accent-gold hover:bg-yellow-500 text-brand-900 font-bold py-3 px-8 rounded-full mx-auto flex items-center gap-2">
               <Mic /> Start Recording Test
             </button>
          )}
          {speakingStep === 1 && content?.speakingPrompts && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-bold text-brand-800">Part 1 Questions:</h3>
              <ul className="list-disc pl-5 space-y-2">
                {content.speakingPrompts.part1.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
              <button onClick={() => setSpeakingStep(2)} className="mt-4 text-brand-600 hover:text-brand-900 font-semibold flex items-center gap-2">Next Part <ArrowRight size={16}/></button>
            </div>
          )}
          {speakingStep === 2 && content?.speakingPrompts && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-bold text-brand-800">Part 2 Cue Card:</h3>
              <p className="text-lg font-medium">{content.speakingPrompts.part2}</p>
              <button onClick={() => setSpeakingStep(3)} className="mt-4 text-brand-600 hover:text-brand-900 font-semibold flex items-center gap-2">Next Part <ArrowRight size={16}/></button>
            </div>
          )}
          {speakingStep === 3 && content?.speakingPrompts && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-bold text-brand-800">Part 3 Discussion:</h3>
              <ul className="list-disc pl-5 space-y-2">
                {content.speakingPrompts.part3.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
              <button onClick={() => setSpeakingStep(4)} className="mt-4 text-brand-600 hover:text-brand-900 font-semibold flex items-center gap-2">Finish Test <CheckCircle size={16}/></button>
            </div>
          )}
          {speakingStep === 4 && (
             <div className="text-center">
               <div className="mb-4 text-green-600 font-bold">Recording in progress...</div>
               <button onClick={() => { stopRecording(); setTimeout(submitSpeaking, 500); }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full mx-auto flex items-center gap-2">
                 <StopCircle /> Stop & Submit for Grading
               </button>
             </div>
          )}
        </div>
      </div>
    );
  }

  if (module === TestModule.WRITING) {
    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
           <h3 className="text-lg font-bold text-brand-800 mb-2">Task 1 (Suggested: 20 mins)</h3>
           <p className="bg-brand-50 p-4 rounded text-sm mb-4">{content?.writingPrompt?.task1}</p>
           <textarea 
             className="w-full border border-gray-300 rounded p-4 h-48 focus:ring-2 focus:ring-brand-500 outline-none" 
             placeholder="Type your response here..."
             value={writingAnswers.task1}
             onChange={e => setWritingAnswers({...writingAnswers, task1: e.target.value})}
           />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
           <h3 className="text-lg font-bold text-brand-800 mb-2">Task 2 (Suggested: 40 mins)</h3>
           <p className="bg-brand-50 p-4 rounded text-sm mb-4">{content?.writingPrompt?.task2}</p>
           <textarea 
             className="w-full border border-gray-300 rounded p-4 h-64 focus:ring-2 focus:ring-brand-500 outline-none" 
             placeholder="Type your essay here..."
             value={writingAnswers.task2}
             onChange={e => setWritingAnswers({...writingAnswers, task2: e.target.value})}
           />
        </div>
        <button onClick={handleWritingSubmit} className="w-full bg-brand-800 hover:bg-brand-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg">
          Submit Writing for AI Evaluation
        </button>
      </div>
    );
  }

  // Reading & Listening
  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
      {/* Left Panel: Content */}
      <div className="lg:w-1/2 bg-white rounded-xl shadow-md overflow-y-auto p-8 border-t-4 border-accent-gold">
        <h2 className="text-2xl font-serif font-bold text-brand-900 mb-6 flex items-center justify-between">
          {module} Passage
          {module === TestModule.LISTENING && (
            <button 
              onClick={toggleAudio}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${isPlaying ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
            >
              {isPlaying ? <><Pause size={16}/> Pause Audio</> : <><Play size={16}/> Play Audio</>}
            </button>
          )}
        </h2>
        <div className="prose prose-brand max-w-none text-brand-800 leading-relaxed font-serif">
           {module === TestModule.READING ? (
             <div className="whitespace-pre-line">{content?.passageText}</div>
           ) : (
             <div className="text-center text-gray-400 italic mt-20">
               <Headphones size={48} className="mx-auto mb-4 opacity-50"/>
               Listen to the audio to answer the questions. <br/> The script is hidden during the test.
             </div>
           )}
        </div>
      </div>

      {/* Right Panel: Questions */}
      <div className="lg:w-1/2 bg-white rounded-xl shadow-md overflow-y-auto p-8">
        <h2 className="text-xl font-bold text-brand-900 mb-6">Questions</h2>
        <div className="space-y-8">
          {content?.questions.map((q, idx) => (
            <div key={q.id} className="border-b border-gray-100 pb-6 last:border-0">
              <div className="flex gap-3">
                <span className="font-bold text-brand-400">{idx + 1}.</span>
                <div className="w-full">
                  <p className="font-medium text-brand-900 mb-3">{q.text}</p>
                  {q.type === 'multiple-choice' && (
                    <div className="space-y-2">
                      {q.options?.map((opt) => (
                        <label key={opt} className="flex items-start gap-3 p-2 rounded hover:bg-brand-50 cursor-pointer">
                          <input 
                            type="radio" 
                            name={`q-${q.id}`} 
                            className="mt-1"
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswers({...answers, [q.id]: opt})}
                          />
                          <span className="text-sm text-brand-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {(q.type === 'fill-gap' || q.type === 'true-false-not-given') && (
                     q.type === 'true-false-not-given' ? (
                        <select 
                          className="w-full border border-gray-300 rounded p-2"
                          onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                          value={answers[q.id] || ""}
                        >
                          <option value="">Select answer...</option>
                          <option value="True">True</option>
                          <option value="False">False</option>
                          <option value="Not Given">Not Given</option>
                        </select>
                     ) : (
                       <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded p-2" 
                        placeholder="Type answer..."
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                      />
                     )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={handleObjectiveSubmit}
          className="w-full mt-6 bg-brand-800 hover:bg-brand-900 text-white py-3 rounded-lg font-bold shadow-lg transition-colors"
        >
          Submit Test
        </button>
      </div>
    </div>
  );
};

export default TestRunner;
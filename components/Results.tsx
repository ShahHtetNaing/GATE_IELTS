import React from 'react';
import { TestResult, CriterionScore } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

interface ResultsProps {
  result: TestResult;
  onBack: () => void;
}

const Results: React.FC<ResultsProps> = ({ result, onBack }) => {
  const { feedback } = result;
  
  // Transform criteria object to array for chart
  const chartData = Object.keys(feedback.criteria).map(key => ({
    subject: key,
    A: feedback.criteria[key].score,
    fullMark: 9,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <button onClick={onBack} className="flex items-center text-brand-600 hover:text-brand-900 font-medium">
        <ArrowLeft className="mr-2" size={20} /> Back to Dashboard
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-brand-900 p-8 text-center text-white">
          <p className="text-brand-300 uppercase tracking-widest text-sm mb-2">Estimated Band Score</p>
          <div className="text-6xl font-serif font-bold text-accent-gold">{feedback.bandScore}</div>
          <p className="mt-4 text-brand-100 font-light">{result.module} Module Assessment</p>
        </div>

        <div className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             {/* Chart */}
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                   <PolarGrid />
                   <PolarAngleAxis dataKey="subject" tick={{ fill: '#486581', fontSize: 12 }} />
                   <PolarRadiusAxis angle={30} domain={[0, 9]} tick={false}/>
                   <Radar name="Student" dataKey="A" stroke="#c5a059" fill="#c5a059" fillOpacity={0.5} />
                 </RadarChart>
               </ResponsiveContainer>
             </div>
             
             {/* General Feedback */}
             <div>
               <h3 className="text-xl font-bold text-brand-900 mb-4">Overall Feedback</h3>
               <p className="text-brand-600 leading-relaxed text-sm">
                 {feedback.generalFeedback}
               </p>
             </div>
           </div>
        </div>
      </div>

      {/* Detailed Criteria Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(feedback.criteria).map(([key, rawData]) => {
          const data = rawData as CriterionScore;
          return (
          <div key={key} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-brand-500">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-brand-800">{key}</h4>
              <span className="bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-xs font-bold">
                Band {data.score}
              </span>
            </div>
            <p className="text-sm text-brand-600">{data.feedback}</p>
          </div>
        )})}
      </div>

      {/* Improvement Plan */}
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h3 className="text-xl font-serif font-bold text-brand-900 mb-6 flex items-center">
           <CheckCircle2 className="text-green-500 mr-2" /> Improvement Plan
        </h3>
        <div className="space-y-4">
          {feedback.improvementPlan.map((step, idx) => (
            <div key={idx} className="flex gap-4 p-4 bg-brand-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-brand-200 text-brand-800 rounded-full flex items-center justify-center font-bold">
                {idx + 1}
              </div>
              <p className="text-brand-700">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Results;
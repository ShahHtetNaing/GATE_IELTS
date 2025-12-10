import React from 'react';
import { TestModule } from '../types';
import { BookOpen, Headphones, PenTool, Mic } from 'lucide-react';

interface DashboardProps {
  onSelectModule: (module: TestModule) => void;
}

const ModuleCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  onClick: () => void;
}> = ({ title, icon, description, color, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left border border-brand-100 group w-full"
  >
    <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="text-2xl font-serif font-bold text-brand-900 mb-2">{title}</h3>
    <p className="text-brand-500 leading-relaxed">{description}</p>
    <div className="mt-6 flex items-center text-brand-700 font-semibold group-hover:text-accent-gold transition-colors">
      Start Simulation <span>&rarr;</span>
    </div>
  </button>
);

const Dashboard: React.FC<DashboardProps> = ({ onSelectModule }) => {
  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-serif font-bold text-brand-900">IELTS Band Estimator</h2>
        <p className="text-lg text-brand-600 max-w-2xl mx-auto">
          Select a skill to begin your simulation. Our AI examiner will evaluate your performance according to official Academic IELTS criteria and provide a detailed improvement plan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ModuleCard 
          title="Listening" 
          icon={<Headphones size={32} className="text-blue-600" />}
          description="Simulate Section 3 of the IELTS Listening test. Listen to academic discussions and answer questions."
          color="bg-blue-50"
          onClick={() => onSelectModule(TestModule.LISTENING)}
        />
        <ModuleCard 
          title="Reading" 
          icon={<BookOpen size={32} className="text-emerald-600" />}
          description="Read complex academic passages and answer questions testing gist, detail, and inference."
          color="bg-emerald-50"
          onClick={() => onSelectModule(TestModule.READING)}
        />
        <ModuleCard 
          title="Writing" 
          icon={<PenTool size={32} className="text-purple-600" />}
          description="Complete Task 1 (Data Description) and Task 2 (Essay). Get graded on all 4 writing criteria."
          color="bg-purple-50"
          onClick={() => onSelectModule(TestModule.WRITING)}
        />
        <ModuleCard 
          title="Speaking" 
          icon={<Mic size={32} className="text-rose-600" />}
          description="Record answers for Part 1, 2, and 3. Receive analysis on fluency, pronunciation, and grammar."
          color="bg-rose-50"
          onClick={() => onSelectModule(TestModule.SPEAKING)}
        />
      </div>
    </div>
  );
};

export default Dashboard;
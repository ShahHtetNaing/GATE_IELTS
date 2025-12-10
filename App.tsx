import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TestRunner from './components/TestRunner';
import Results from './components/Results';
import { TestModule, TestResult } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'test' | 'results'>('dashboard');
  const [selectedModule, setSelectedModule] = useState<TestModule | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);

  const startTest = (module: TestModule) => {
    setSelectedModule(module);
    setCurrentView('test');
  };

  const handleTestComplete = (testResult: TestResult) => {
    setResult(testResult);
    setCurrentView('results');
  };

  const goBack = () => {
    setCurrentView('dashboard');
    setSelectedModule(null);
    setResult(null);
  };

  return (
    <Layout>
      {currentView === 'dashboard' && <Dashboard onSelectModule={startTest} />}
      
      {currentView === 'test' && selectedModule && (
        <TestRunner 
          module={selectedModule} 
          onComplete={handleTestComplete}
          onCancel={goBack}
        />
      )}

      {currentView === 'results' && result && (
        <Results result={result} onBack={goBack} />
      )}
    </Layout>
  );
}

export default App;
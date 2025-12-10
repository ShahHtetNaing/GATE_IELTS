import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-brand-50 flex flex-col">
      <header className="bg-brand-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent-gold rounded-full flex items-center justify-center font-serif font-bold text-brand-900 text-xl">
              G
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold tracking-tight text-white">GATE</h1>
              <p className="text-xs text-brand-300 uppercase tracking-widest">Tech & Education</p>
            </div>
          </div>
          <nav>
            <span className="text-brand-200 text-sm font-medium">IELTS Academic Preparation</span>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-brand-800 text-brand-300 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-serif text-sm">&copy; {new Date().getFullYear()} Grand Association of Technology and Education.</p>
          <p className="text-xs mt-2 opacity-50">Powered by Google Gemini AI</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
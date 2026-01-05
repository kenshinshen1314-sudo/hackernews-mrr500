import React from 'react';

interface HeaderProps {
  language: 'zh' | 'en';
  onLanguageChange: (lang: 'zh' | 'en') => void;
}

const Header: React.FC<HeaderProps> = ({ language, onLanguageChange }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.hash = ''}>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">MRR500</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm font-medium">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                language === 'en' 
                  ? 'bg-black text-white' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              EN
            </button>
            <span className="h-4 w-[1px] bg-gray-300 mx-1"></span>
            <button
               onClick={() => onLanguageChange('zh')}
               className={`px-2 py-0.5 rounded text-xs transition-colors ${
                language === 'zh' 
                  ? 'bg-black text-white' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              中文
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
import React from 'react';
import { Category } from '../types';
import { CATEGORY_TRANSLATIONS, UI_TRANSLATIONS } from '../constants';

interface SidebarProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (category: Category | 'All') => void;
  counts: Record<string, number>;
  language: 'zh' | 'en';
}

const Sidebar: React.FC<SidebarProps> = ({ selectedCategory, onSelectCategory, counts, language }) => {
  const categories = Object.values(Category);
  const t = UI_TRANSLATIONS[language];

  return (
    <div className="w-full md:w-64 flex-shrink-0 md:sticky md:top-24 h-fit md:max-h-[calc(100vh-8rem)] md:overflow-y-auto no-scrollbar pr-4">
      <h3 className="text-sm font-bold text-gray-900 mb-4 px-2">{t.filterByTag}</h3>
      <div className="space-y-1">
        {categories.map((cat) => {
           const count = counts[cat] || 0;
           const isSelected = selectedCategory === cat;
           
           let label: string = cat;
           if (cat === Category.ALL) {
               label = language === 'zh' ? '全部' : 'All';
           } else {
               // Default is English (from Enum). If language is ZH, try to translate.
               if (language === 'zh') {
                   label = CATEGORY_TRANSLATIONS[cat] || cat;
               }
           }

           return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                isSelected 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{label}</span>
              <span className="text-gray-400 text-xs">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
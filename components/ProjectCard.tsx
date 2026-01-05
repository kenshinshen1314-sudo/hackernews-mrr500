import React, { useState } from 'react';
import { Project } from '../types';
import { ArrowRight, MoreHorizontal } from 'lucide-react';
import { CATEGORY_TRANSLATIONS, UI_TRANSLATIONS } from '../constants';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  language: 'zh' | 'en';
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, language }) => {
  const t = UI_TRANSLATIONS[language];
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Logic to determine which text to show based on language
  const displayText = language === 'zh' && project.description_zh 
    ? project.description_zh 
    : project.description;

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Card Header / Image Area */}
      <div 
        className="h-48 relative p-4 flex flex-col justify-between overflow-hidden"
        style={{ backgroundColor: project.previewColor || '#f3f4f6' }}
      >
         {/* Background Image - Thumbnail */}
         {project.imageUrl && !imageError && (
             <img 
               src={project.imageUrl} 
               alt={project.name}
               className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
               loading="lazy"
               decoding="async"
               onLoad={() => setImageLoaded(true)}
               onError={() => setImageError(true)}
             />
        )}
        
        {/* Subtle overlay for better text contrast if needed, or clean look */}
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors pointer-events-none" />

        <div className="flex justify-between items-start relative z-10">
           <div className="flex items-center space-x-2">
             <div className="bg-white/95 p-1.5 rounded-md shadow-sm backdrop-blur-sm">
                <span className="font-bold text-gray-800 text-xs">{project.name.substring(0,2).toUpperCase()}</span>
             </div>
             {/* Name badge to ensure readability over screenshots */}
             <span className="font-semibold text-gray-900 bg-white/90 px-2 py-0.5 rounded-md shadow-sm text-xs border border-white/50 backdrop-blur-md">
                {project.name}
             </span>
           </div>
           
           <button className="text-gray-600 hover:text-black bg-white/80 p-1 rounded-full hover:bg-white transition-colors shadow-sm backdrop-blur-sm">
             <MoreHorizontal size={16} />
           </button>
        </div>

        {/* Center Content Placeholder - mimicking screenshot */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <span className="bg-black/80 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                {t.viewDetails}
            </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
            {project.revenue && (
                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100 whitespace-nowrap ml-2">
                {project.revenue}
                </span>
            )}
        </div>
        
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
          {displayText}
        </p>
        
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
          <div className="flex flex-wrap gap-2">
            {project.tags.slice(0, 3).map(tag => {
              // Default is English. If ZH, translate.
              const label = language === 'zh' ? (CATEGORY_TRANSLATIONS[tag] || tag) : tag;
              return (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                  {label}
                </span>
              );
            })}
          </div>
          
          <div className="flex items-center text-xs font-medium text-gray-900 group-hover:translate-x-1 transition-transform">
            {t.view} <ArrowRight size={14} className="ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
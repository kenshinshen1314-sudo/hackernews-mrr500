import React, { useState } from 'react';
import { Project } from '../types';
import { ArrowLeft, ExternalLink, Layers, Loader2, Image as ImageIcon, Globe } from 'lucide-react';
import { CATEGORY_TRANSLATIONS, UI_TRANSLATIONS } from '../constants';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  language: 'zh' | 'en';
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, language }) => {
  const t = UI_TRANSLATIONS[language];
  // Default to screenshot to avoid X-Frame issues initially
  const [viewMode, setViewMode] = useState<'screenshot' | 'live'>('screenshot');
  const [imgLoaded, setImgLoaded] = useState(false);

  // Logic to determine which text to show based on language
  const displayFullText = language === 'zh' && project.fullDescription_zh 
    ? project.fullDescription_zh 
    : project.fullDescription;

  // Helper for high-res screenshot
  const getScreenshotUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const cleanUrl = `${urlObj.origin}${urlObj.pathname}`; 
      // Request larger size for detail view
      return `https://s0.wp.com/mshots/v1/${encodeURIComponent(cleanUrl)}?w=1280&h=960`;
    } catch (e) {
      return `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=1280&h=960`;
    }
  };

  const screenshotUrl = getScreenshotUrl(project.url);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Breadcrumb / Back Navigation */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button 
          onClick={onBack}
          className="group flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-3 group-hover:border-gray-400 transition-colors">
             <ArrowLeft size={16} />
          </div>
          <span className="text-sm font-medium">{t.backToList}</span>
        </button>

        {/* Header Info */}
        <div className="flex items-center space-x-3 mb-6">
          <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full">
            {project.year}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            {project.author}
          </span>
          {project.revenue && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200">
              {project.revenue} / mo
            </span>
          )}
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
          {project.name}
        </h1>

        <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl whitespace-pre-line">
          {displayFullText}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-10">
            {project.tags.map(tag => {
                // Default is English. If ZH, translate.
                const label = language === 'zh' ? (CATEGORY_TRANSLATIONS[tag] || tag) : tag;
                return (
                  <div key={tag} className="flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-gray-600 text-sm">
                      <span className="mr-1.5 text-gray-400">#</span>
                      {label}
                  </div>
                );
            })}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-4 mb-16">
            <a 
                href={project.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
            >
                {t.visitProject} <ExternalLink size={16} className="ml-2" />
            </a>
            <a 
                href={project.hnUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
                <Layers size={16} className="mr-2 text-orange-500" />
                {t.viewDiscussion}
            </a>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{t.websitePreview}</h3>
                
                {/* View Mode Toggle */}
                <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                    <button
                        onClick={() => setViewMode('screenshot')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-all ${
                            viewMode === 'screenshot' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <ImageIcon size={14} className="mr-1.5" />
                        {t.viewModeSnapshot}
                    </button>
                    <button
                        onClick={() => setViewMode('live')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-all ${
                            viewMode === 'live' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Globe size={14} className="mr-1.5" />
                        {t.viewModeLive}
                    </button>
                </div>
            </div>

            <div className="w-full h-[600px] md:h-[800px] bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden relative group shadow-sm flex flex-col">
                {/* Header of the browser mockup */}
                <div className="h-10 bg-white border-b border-gray-200 flex items-center px-4 space-x-2 flex-shrink-0 z-10">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
                    <div className="ml-4 flex-1 h-6 bg-gray-100 rounded-md flex items-center px-3 text-xs text-gray-400 font-mono overflow-hidden whitespace-nowrap">
                        {project.url}
                    </div>
                </div>
                
                {/* Content Area */}
                <div className="flex-1 bg-white relative w-full h-full">
                   {project.url ? (
                     viewMode === 'screenshot' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 relative">
                             {!imgLoaded && (
                                 <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="animate-spin text-gray-300 mb-2" size={24} />
                                    </div>
                                 </div>
                             )}
                             <img 
                                src={screenshotUrl} 
                                alt={`Preview of ${project.name}`}
                                className={`w-full h-full object-cover object-top transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setImgLoaded(true)}
                                onError={() => setImgLoaded(true)} // Stop loading spinner on error, maybe show fallback
                             />
                        </div>
                     ) : (
                        <iframe 
                            src={project.url}
                            className="w-full h-full border-0"
                            title={`Preview of ${project.name}`}
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                            loading="lazy"
                        />
                     )
                   ) : (
                     <div className="flex items-center justify-center h-full text-gray-400">
                       {t.noPreview}
                     </div>
                   )}
                </div>
            </div>
             
             {/* Only show note in Live mode */}
             {viewMode === 'live' && (
                <p className="text-xs text-gray-400 text-center mt-2">
                    {t.previewNote}
                </p>
             )}
        </div>

      </div>
    </div>
  );
};

export default ProjectDetail;
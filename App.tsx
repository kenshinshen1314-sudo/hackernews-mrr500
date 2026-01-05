import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProjectCard from './components/ProjectCard';
import ProjectDetail from './components/ProjectDetail';
import { Project, Category } from './types';
import { analyzeHackerNewsContent } from './services/geminiService';
import { Loader2 } from 'lucide-react';
import { UI_TRANSLATIONS, MOCK_PROJECTS } from './constants';

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<string>('');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  const t = UI_TRANSLATIONS[language];

  // Data Fetching
  useEffect(() => {
    const fetchHNData = async () => {
      try {
        setLoading(true);
        setProgress(UI_TRANSLATIONS['zh'].connecting); // Initial is ZH usually or based on default
        // Fetch the specific HN thread item
        const response = await fetch('https://hacker-news.firebaseio.com/v0/item/46307973.json');
        const story = await response.json();

        if (story && story.kids) {
          // Fetch top 500 comments to ensure we cover all potential projects (expecting ~110 items)
          const totalToFetch = Math.min(story.kids.length, 500);
          const commentIds = story.kids.slice(0, totalToFetch);
          
          setProgress(language === 'en' ? `Fetching ${totalToFetch} comments...` : `正在抓取 ${totalToFetch} 条评论数据...`);

          // Batch requests to prevent network congestion
          const BATCH_SIZE = 25;
          let allComments: any[] = [];
          
          for (let i = 0; i < commentIds.length; i += BATCH_SIZE) {
            const batchIds = commentIds.slice(i, i + BATCH_SIZE);
            const batchPromises = batchIds.map((id: number) => 
              fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(res => res.json())
            );
            const batchResults = await Promise.all(batchPromises);
            allComments = [...allComments, ...batchResults];
            
            // Optional: Update progress UI slightly
            if (i % 100 === 0) {
               // Use a simple progress string, updating dynamically based on state might be tricky inside loop without ref or just simple usage
               const msg = language === 'en' 
                ? `Fetched ${allComments.length} / ${totalToFetch} comments...`
                : `已获取 ${allComments.length} / ${totalToFetch} 条评论...`;
               setProgress(msg);
            }
          }

          setProgress(language === 'en' ? 'Analyzing project info...' : '正在解析项目信息...');
          // Pass the raw comments array directly to the parser
          const validComments = allComments.filter((c: any) => c && c.text && !c.deleted);
          
          if (validComments.length > 0) {
            // This is now a synchronous or fast async operation using Regex
            const analyzedProjects = await analyzeHackerNewsContent(validComments);
            setProjects(analyzedProjects);
          } else {
            // Fallback to mocks if no valid comments found (or API empty)
            setProjects(MOCK_PROJECTS);
          }
        } else {
            setProjects(MOCK_PROJECTS);
        }
      } catch (error) {
        console.error("Failed to fetch or analyze HN data:", error);
        // Fallback to mock data on error so the app is usable
        setProjects(MOCK_PROJECTS);
      } finally {
        setLoading(false);
      }
    };

    fetchHNData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Calculate dynamic category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Initialize 0 for all categories
    Object.values(Category).forEach(cat => {
      counts[cat] = 0;
    });

    // Count tags from loaded projects
    projects.forEach(project => {
      project.tags.forEach(tag => {
        if (counts[tag] !== undefined) {
          counts[tag]++;
        }
      });
    });

    // Set 'All' count
    counts[Category.ALL] = projects.length;

    return counts;
  }, [projects]);

  // Hash router simulation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/project/')) {
        const id = hash.replace('#/project/', '');
        const found = projects.find(p => p.id === id);
        if (found) {
          setActiveProject(found);
          window.scrollTo(0, 0);
        } else {
          if (!loading && projects.length > 0) {
              setActiveProject(null);
          }
        }
      } else {
        setActiveProject(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (projects.length > 0) {
        handleHashChange(); 
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [projects, loading]);

  const handleProjectClick = (project: Project) => {
    window.location.hash = `#/project/${project.id}`;
  };

  const handleBack = () => {
    window.location.hash = '';
  };

  const filteredProjects = selectedCategory === 'All' 
    ? projects 
    : projects.filter(p => p.tags.includes(selectedCategory));

  if (activeProject) {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        <Header language={language} onLanguageChange={setLanguage} />
        <div className="pt-16">
          <ProjectDetail 
            project={activeProject} 
            onBack={handleBack} 
            language={language}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            {t.heroTitle}
          </h2>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-light">
            {t.heroSubtitle}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-64 flex-shrink-0">
             <Sidebar 
               selectedCategory={selectedCategory} 
               onSelectCategory={setSelectedCategory} 
               counts={categoryCounts}
               language={language}
             />
          </aside>

          {/* Grid */}
          <div className="flex-1 min-h-[50vh]">
             {loading ? (
               <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                 <Loader2 size={32} className="animate-spin mb-4" />
                 <p className="text-lg font-medium text-gray-900">{progress}</p>
                 <p className="text-xs mt-2 opacity-60">{t.localMode}</p>
               </div>
             ) : filteredProjects.length === 0 ? (
               <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-100 p-8">
                 <p className="text-lg mb-2">{t.noProjects}</p>
                 <p className="text-sm">{t.noProjectsSub}</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredProjects.map(project => (
                   <ProjectCard 
                     key={project.id} 
                     project={project} 
                     onClick={() => handleProjectClick(project)}
                     language={language} 
                   />
                 ))}
               </div>
             )}
          </div>
        </div>
        
        {/* Footer Stats and Source */}
        {!loading && projects.length > 0 && (
          <div className="mt-20 border-t border-gray-200 pt-8 text-center">
             <p className="text-gray-500 font-medium mb-2">
                {t.footerShowing(filteredProjects.length, projects.length)}
             </p>
             <p className="text-gray-400 text-sm">
                {t.footerSource} <a href="https://news.ycombinator.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 underline">HackerNews</a>
             </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
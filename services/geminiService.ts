import { Project, Category } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

// Helper to decode HTML entities using the browser's native capabilities
const decodeHtml = (html: string): string => {
  if (!html) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

// Helper to strip HTML tags but preserve content
const stripHtml = (html: string): string => {
   if (!html) return "";
   const doc = new DOMParser().parseFromString(html, 'text/html');
   return doc.body.textContent || "";
};

// Fallback Helper to extract a concise summary sentence (Regex based)
const cleanAndSummarizeFallback = (text: string): string => {
    let clean = text.trim();
    clean = clean.replace(/^(Hi|Hello|Hey|Greetings)\s+(HN|Hacker News|everyone|guys|there|folks).{0,40}(\.|\!|\?|\n)/i, "");
    clean = clean.replace(/^I am (the )?(founder|creator|author|maker).{0,30}(\.|\!|\?|\n)/i, "");
    
    // Find first sentence
    const match = clean.match(/^.*?[.!?](\s|$)/);
    let summary = match ? match[0].trim() : clean.substring(0, 140);
    
    // Cleanup "I built"
    summary = summary.replace(/^(I|We)\s+(have\s+)?(built|made|created|developed)\s+/i, "");
    summary = summary.charAt(0).toUpperCase() + summary.slice(1);
    
    if (summary.length > 140) summary = summary.substring(0, 137) + "...";
    return summary;
};

// Heuristic tag determination (Fallback)
const determineTagsFallback = (text: string, url: string): Category[] => {
    const lowerText = text.toLowerCase() + " " + url.toLowerCase();
    const tags: Category[] = [];
    // Simple checks
    if (lowerText.includes('ai') || lowerText.includes('gpt')) tags.push(Category.AI);
    if (lowerText.includes('saas')) tags.push(Category.SAAS);
    if (lowerText.includes('tool')) tags.push(Category.TOOL);
    if (tags.length === 0) tags.push(Category.WEBSITE);
    return Array.from(new Set(tags)).slice(0, 3);
};

const getRandomPastelColor = () => {
  const colors = ['#F3F4F6', '#FFF7ED', '#ECFDF5', '#EFF6FF', '#FAF5FF', '#FFF1F2'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Helper to get a cache-friendly screenshot URL
const getScreenshotUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Construct a clean URL without query parameters or hash to maximize cache hits on s0.wp.com
    // We keep the origin and pathname.
    const cleanUrl = `${urlObj.origin}${urlObj.pathname}`; 
    // Use a standard viewport width (1280px scaled down) or just request the size we need.
    // mshots takes a 'w' parameter. 
    return `https://s0.wp.com/mshots/v1/${encodeURIComponent(cleanUrl)}?w=600&h=400`;
  } catch (e) {
    // Fallback if URL parsing fails
    return `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=600&h=400`;
  }
};

export const analyzeHackerNewsContent = async (comments: any[]): Promise<Project[]> => {
  const projects: Project[] = [];

  // 1. Initial Filtering & Regex Extraction
  // We first use lightweight regex to find candidates to avoid sending garbage to the LLM.
  comments.forEach((comment, index) => {
    if (!comment || !comment.text || comment.deleted) return;

    const textHtml = comment.text;
    if (!textHtml.includes('<a href=')) return;

    let processingText = textHtml.replace(/<p>/g, ' ').replace(/<br>/g, ' ');
    processingText = stripHtml(processingText); 
    
    const revenueKeywords = /(\$|MRR|revenue|making|earned|users|clients|sales|\d+k\/mo)/i;
    // Lower threshold for "side project" mentions to catch more potential ones
    const isRelevant = revenueKeywords.test(processingText) || processingText.toLowerCase().includes('side project');
    
    if (!isRelevant && processingText.length < 50) return;

    const linkMatch = textHtml.match(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/i);
    if (!linkMatch) return;

    let rawUrl = linkMatch[1]; 
    let rawLinkText = linkMatch[2];
    const url = decodeHtml(rawUrl);

    if (url.includes('ycombinator.com') || url.includes('linkedin.com')) return;
    if (url.includes('twitter.com') || url.includes('x.com')) return;

    // Determine Name
    let name = stripHtml(rawLinkText).trim();
    if (name.includes('http') || name.includes('www.') || name.includes('.com') || name.length > 30) {
        try {
             const urlObj = new URL(url);
             let hostname = urlObj.hostname.replace('www.', '');
             const parts = hostname.split('.');
             if (parts.length >= 2) hostname = parts[0]; 
             name = hostname.charAt(0).toUpperCase() + hostname.slice(1);
        } catch (e) {
             name = 'Project';
        }
    }
    
    // Extract Revenue
    let revenue = 'Unknown';
    const moneyMatch = processingText.match(/(\$[0-9,]+(?:k)?(?:\.[0-9]+)?(?:\/mo)?)/i);
    if (moneyMatch) {
        revenue = moneyMatch[1];
    } else {
        const mrrMatch = processingText.match(/(\d+(?:k)?\s?\/mo)/i);
        if (mrrMatch) revenue = '$' + mrrMatch[1].replace('/mo', '').trim();
    }

    const fullDescription = processingText.replace(/\s+/g, ' ').trim();
    
    // Initial Heuristic Data (Fallback)
    const shortDescription = cleanAndSummarizeFallback(fullDescription);
    const shortDescription_zh = shortDescription; // Fallback: same as English
    const tags = determineTagsFallback(fullDescription, url);

    projects.push({
      id: comment.id.toString(),
      name: name,
      name_zh: name,
      description: shortDescription,
      description_zh: shortDescription_zh,
      fullDescription: fullDescription,
      fullDescription_zh: fullDescription, // Fallback
      revenue: revenue,
      url: url,
      hnUrl: `https://news.ycombinator.com/item?id=${comment.id}`,
      tags: tags,
      author: comment.by,
      year: new Date(comment.time * 1000).getFullYear().toString(),
      timestamp: comment.time, // Add timestamp for sorting
      imageUrl: getScreenshotUrl(url),
      previewColor: getRandomPastelColor()
    });
  });

  // 2. Gemini Refinement
  // Enhance descriptions and tags using the LLM if API Key is present
  if (projects.length > 0 && process.env.API_KEY) {
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          // Prepare list for batch processing
          // We limit to 30-40 items per batch to avoid output token limits.
          // For this specific use case (HN threads), usually there are < 50 valid revenue projects.
          const itemsToProcess = projects.slice(0, 40).map(p => ({
              id: p.id,
              text: p.fullDescription,
              url: p.url
          }));

          const validCategories = Object.values(Category).filter(c => c !== Category.ALL).join(', ');

          const prompt = `
          You are a tech analyst refining a list of indie hacker projects.
          For each project, generate:
          1. summary_en: A concise summary (MAX 140 CHARACTERS). It MUST cover: Core Function + User Pain Point Solved + Monetization Method (if mentioned).
          2. summary_zh: Translate the summary to Simplified Chinese (MAX 140 CHARACTERS). Ensure it is in pure Simplified Chinese. Do NOT translate URLs, domain names, or specific technical brands (e.g. SaaS, API). Core Function + Pain Point + Monetization.
          3. detail_zh: A detailed description translated to Simplified Chinese (max 300 characters). Explain the problem it solves, core value, and revenue model. Do NOT translate URLs.
          4. detail_en: A detailed description in English (max 300 characters). Explain the problem it solves, core value, and revenue model.
          5. tags: Choose 1-3 most accurate tags from this list ONLY: [${validCategories}].

          Input Data:
          ${JSON.stringify(itemsToProcess)}
          `;

          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              id: { type: Type.STRING },
                              summary_en: { type: Type.STRING },
                              summary_zh: { type: Type.STRING },
                              detail_zh: { type: Type.STRING },
                              detail_en: { type: Type.STRING },
                              tags: { 
                                  type: Type.ARRAY, 
                                  items: { type: Type.STRING } 
                              }
                          }
                      }
                  }
              }
          });

          if (response.text) {
              const refinedList = JSON.parse(response.text) as any[];
              const refinedMap = new Map(refinedList.map(r => [r.id, r]));

              projects.forEach(p => {
                  const refined = refinedMap.get(p.id);
                  if (refined) {
                      p.description = refined.summary_en;
                      // Ensure summary_zh is present, otherwise fallback to en (but we hope LLM follows prompt)
                      p.description_zh = refined.summary_zh || refined.summary_en;
                      
                      // Update full localized description with the detailed explanation
                      p.fullDescription_zh = refined.detail_zh || refined.summary_zh; 
                      p.fullDescription = refined.detail_en || refined.summary_en || p.fullDescription;

                      // Map tags
                      const newTags: Category[] = [];
                      refined.tags.forEach((t: string) => {
                          // Normalize and find enum match
                          const matchedCategory = Object.values(Category).find(
                              c => c.toLowerCase() === t.toLowerCase() || 
                              c.toLowerCase() === t.replace(' ', '').toLowerCase()
                          );
                          if (matchedCategory && matchedCategory !== Category.ALL) {
                              newTags.push(matchedCategory);
                          }
                      });
                      if (newTags.length > 0) p.tags = newTags;
                  }
              });
          }
      } catch (error) {
          console.error("Gemini optimization failed:", error);
          // Projects remain with heuristic data
      }
  }

  // Sort projects by timestamp (Newest first)
  projects.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return projects;
};
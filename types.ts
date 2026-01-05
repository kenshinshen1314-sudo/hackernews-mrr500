export enum Category {
  ALL = 'All',
  AI = 'AI',
  APP = 'App',
  TOOL = 'Tool',
  WEBSITE = 'Web',
  MEDIA = 'Media',
  SAAS = 'SaaS',
  IOS = 'iOS',
  EDUCATION = 'Education',
  FINANCE = 'Finance',
  SERVICE = 'Service',
  EXTENSION = 'Browser Extension',
  GAME = 'Game',
  API = 'API',
  NEWSLETTER = 'Newsletter',
  HEALTH = 'Health',
  DESIGN = 'Design',
  ECOMMERCE = 'E-commerce',
  ANDROID = 'Android',
  SLACK = 'Slack',
  ART = 'Art',
  DATABASE = 'Database',
  DEVTOOLS = 'DevTools'
}

export interface Project {
  id: string;
  name: string;
  name_zh?: string; // Localized name (optional)
  description: string;
  description_zh?: string; // Localized description
  fullDescription: string; // Longer description for detail page
  fullDescription_zh?: string; // Localized full description
  revenue: string;
  url: string;
  hnUrl: string;
  tags: Category[];
  author: string;
  year: string;
  timestamp?: number; // Unix timestamp for sorting
  imageUrl?: string;
  previewColor?: string; // To simulate the colored backgrounds in screenshots
}

export interface ParsingResult {
  projects: Project[];
}
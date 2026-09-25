export type IconKey = string; // Now allows any string since we resolve dynamically

// Map category names (lowercase) to their display icons
export const categoryIconMap: Record<string, string> = {
  log: "NotebookIcon",
  systems: "CpuIcon",
};

export const DEFAULT_CATEGORY_ICON = "NewspaperIcon";

/** Set to true to re-enable the timeline layout option in the view switcher */
export const ENABLE_TIMELINE_VIEW = false;

export type ArticleAuthor = {
  name: string;
  url?: string;
};

export type ArticleItem = {
  href: string;
  label: string;
  dateTime: string;
  dateLabel: string;
  intro: string;
  authors: ArticleAuthor[];
  category: string;
  icon: IconKey;
  readingTime: string;
};

export type ArticleFrontmatter = {
  title: string;
  description: string;
  date: string;
  category: string;
  authors?: ArticleAuthor[];
  icon?: IconKey;
  tags?: string[];
  heroImage?: string;
};

export type CategoryOption = {
  id: string;
  label: string;
  icon: IconKey;
};

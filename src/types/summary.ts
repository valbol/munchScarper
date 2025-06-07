export interface Summary {
  metadata: {
    title: string;
    description: string;
    keywords?: string[];
    author?: string;
    publishedAt?: string;
    readTimeMinutes?: number;
  };
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  leadParagraphs: string[];
  topLinks: { text: string; href: string }[];
  topImages: { src: string; alt: string }[];

  paginatedItems?: string[];
}

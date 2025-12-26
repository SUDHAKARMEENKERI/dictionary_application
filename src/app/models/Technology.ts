export interface Technology {
  name: string;
  slug: string;
  items: TechnologyItem[];
}

export interface TechnologyItem {
  name: string;
  icon: string;
  questionCount: number;
}

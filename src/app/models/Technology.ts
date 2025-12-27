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

export interface DropdownResponse {
  id: number;
  name: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
}

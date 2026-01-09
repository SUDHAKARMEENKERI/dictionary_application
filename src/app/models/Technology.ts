export interface Technology {
  name: string;
  slug: string;
  items: TechnologyItem[];
}

export interface TechnologyItem {
  name: string;
  icon: string;
  questionCount: number;
  mcqCount?: number;
  outputBasedCount?: number;
  outputBasedMcqCount?: number;
}

export interface DropdownResponse {
  id: number;
  name: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  level:string;
  topic: string;
}

export interface QuestionTypeDropdownOption {
  label: string;
  value: string;
}

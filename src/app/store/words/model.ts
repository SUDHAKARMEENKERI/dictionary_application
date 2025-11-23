export interface UserWord {
  id?: number;
  word: string;
  meaning: string;
  mobile: string;
  firstName: string;
  lastName: string;
  show_for_others: boolean;
}

export interface BulkUserWord {
  words: UserWord[];
}

export interface UserState {
  mobile: string;
}
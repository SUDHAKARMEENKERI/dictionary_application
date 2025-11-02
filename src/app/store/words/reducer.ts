// store/word.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { UserWord } from './model';
import { loadWordLoadSuccess, loadWordLoadFailure, loadWords, submitWordFailure, submitWordSuccess, getWordByIdSuccess, getWordByIdFailure, updateWordByIdSuccess, updateWordByIdFailure, deleteWordByIdSuccess, deleteWordByIdFailure } from './action';

export interface WordState {
  word: UserWord | null;
  error: string | null;
}

export const initialState: WordState = {
  word: null,
  error: null
};

export const wordReducer = createReducer(
  initialState,
  on(submitWordSuccess, (state, { response }) => ({
    ...state,
    word: response,
    error: null
  })),
  on(submitWordFailure, (state, { error }) => ({
    ...state,
    error
  })),

  
  on(loadWordLoadSuccess, (state, { response }) => ({
    ...state,
    word: response,
    error: null
  })),
  on(loadWordLoadFailure, (state, { error }) => ({
    ...state,
    error
  })),

  on(getWordByIdSuccess, (state, { response }) => ({
    ...state,
    word: response,
    error: null
  })),
  on(getWordByIdFailure, (state, { error }) => ({
    ...state,
    error
  })),

  on(updateWordByIdSuccess, (state, { response }) => ({
    ...state,
    word: response,
    error: null
  })),
  
  on(updateWordByIdFailure, (state, { error }) => ({
    ...state,
    error
  })),

  on(deleteWordByIdSuccess, (state, { response }) => ({
    ...state,
    word: response,
    error: null
  })),
  
  on(deleteWordByIdFailure, (state, { error }) => ({
    ...state,
    error
  })),
 
);

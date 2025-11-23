import { createReducer, on } from '@ngrx/store';
import { UserWord } from './model';
import { loadWordLoadSuccess, loadWordLoadFailure, loadWords, submitWordFailure, submitWordSuccess, getWordByIdSuccess, getWordByIdFailure, updateWordByIdSuccess, updateWordByIdFailure, deleteWordByIdSuccess, deleteWordByIdFailure, submitWord, updateWordById, getWordById, deleteWordById } from './action';

export interface WordState {
  word: UserWord | null;
  error: string | null;
  loading: boolean;
}

export const initialState: WordState = {
  word: null,
  error: null,
  loading: false
};

export const wordReducer = createReducer(
  initialState,
  on(submitWord, state => ({ ...state, loading: true, error: null })),

  on(submitWordSuccess, (state, { response }) => ({
    ...state,
    word: response,
    error: null,
    loading: false
  })),

  on(submitWordFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  on(loadWords, state => ({ ...state, loading: true, error: null })),
  on(loadWordLoadSuccess, (state, { response }) => ({
    ...state,
    word: response,
    error: null,
    loading: false
  })),
  on(loadWordLoadFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  on(getWordById, state => ({ ...state, loading: true, error: null })),
  on(getWordByIdSuccess, (state, { response }) => ({
    ...state,
    word: response,
    error: null,
    loading: false
  })),
  on(getWordByIdFailure, (state, { error }) => ({
    ...state,
    error,
    loading:false
  })),

  on(updateWordById, state => ({ ...state, loading: true, error: null })),
  on(updateWordByIdSuccess, (state, { response }) => ({
    ...state,
    word: response,
    error: null,
    loading: false
  })),
  on(updateWordByIdFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  on(deleteWordById, state => ({ ...state, loading: true, error: null })),
  on(deleteWordByIdSuccess, (state, { response }) => ({
    ...state,
    word: response,
    error: null,
    loading: false
  })),
  on(deleteWordByIdFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
 
);

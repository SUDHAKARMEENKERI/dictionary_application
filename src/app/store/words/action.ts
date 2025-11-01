// store/user.actions.ts
import { createAction, props } from '@ngrx/store';
import { UserWord } from './model';

export const submitWord = createAction('[Word] Submit', props<{ word: UserWord }>());
export const submitWordSuccess = createAction( '[Word] Submit Success', props<{ response: UserWord }>());
export const submitWordFailure = createAction( '[Word] Submit Failure', props<{ error: string }>());

export const loadWords = createAction('[WordList] Load');
export const loadWordLoadSuccess = createAction( '[WordList] Load Success', props<{ response: UserWord }>());
export const loadWordLoadFailure = createAction( '[WordList] Load Failure', props<{ error: string }>());

export const getWordById = createAction('[GetWordById] Submit', props<{ id: number }>());
export const getWordByIdSuccess = createAction( '[GetWordById] Get Success', props<{ response: UserWord }>());
export const getWordByIdFailure = createAction( '[GetWordById] Get Failure', props<{ error: string }>());

export const deleteWordById = createAction('[DeleteWordById] Submit', props<{ word: UserWord }>());
export const deleteWordByIdSuccess = createAction( '[DeleteWordById] Delete Success', props<{ response: UserWord }>());
export const deleteWordByIdFailure = createAction( '[DeleteWordById] Delete Failure', props<{ error: string }>());
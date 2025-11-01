import { createFeatureSelector, createSelector } from "@ngrx/store";
import { WordState } from "./reducer";

export const selectWordState = createFeatureSelector<WordState>('user');

export const selectWords = createSelector(
    selectWordState,
    (state: WordState) => state.word
);

// export const selectWordsLoading = createSelector(
//     selectWordState,
//     (state: WordState) => state.loading
// );
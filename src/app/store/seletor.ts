import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState } from './model';

export const selectUserState = createFeatureSelector<UserState>('userDetails');

export const selectMobile = createSelector(
  selectUserState,
  (state: UserState) => state.mobile
);
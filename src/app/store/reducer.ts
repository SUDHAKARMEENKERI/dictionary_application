import { createReducer, on } from '@ngrx/store';
import { UserState } from './words/model';
import { setMobile } from './action';

const initialState: UserState = {
  mobile: ''
};

export const userReducer = createReducer(
  initialState,
  on(setMobile, (state, { mobile }) => ({ ...state, mobile }))
);
import { createAction, props } from "@ngrx/store";

export const setMobile = createAction(
  '[User] Set Mobile',
  props<{ mobile: string }>()
);
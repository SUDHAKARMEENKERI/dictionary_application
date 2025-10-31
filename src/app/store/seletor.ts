import { createFeatureSelector, createSelector } from "@ngrx/store";
import { departmentState } from "./reducer";

export const selectDepartmentState = createFeatureSelector<departmentState>('department');

export const selectDepartments = createSelector(
    selectDepartmentState,
    (state: departmentState) => state.departments
);

export const selectDepartmentsLoading = createSelector(
    selectDepartmentState,
    (state: departmentState) => state.loading
);
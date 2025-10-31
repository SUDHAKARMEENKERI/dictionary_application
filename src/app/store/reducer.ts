import { createReducer, on } from "@ngrx/store";
import { Department } from "./model";
import { loadDepartment, loadDepartmentFailure, loadDepartmentSuccess } from "./action";

export interface departmentState{
    departments: Department[];
    loading: boolean;
    error: any;
}

export const initialDepartmentState: departmentState = {
    departments: [],
    loading: false,
    error: null
};

export const departmentReducer = createReducer(
    initialDepartmentState,
    on(loadDepartment, state => ({
        ...state,
        loading: true,
        error: null
    })),
    on(loadDepartmentSuccess, (state, { departments }) => ({
        ...state,
        departments,   
        loading: false
    })),
    on(loadDepartmentFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error: error
    }))
);

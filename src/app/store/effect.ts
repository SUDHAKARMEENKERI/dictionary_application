import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { WordListService } from "../service/word-list.service";
import { loadDepartment, loadDepartmentFailure, loadDepartmentSuccess } from "./action";
import { map, mergeMap } from "rxjs";

@Injectable()
export class DepartmentEffects {
    action$ = inject(Actions);

    constructor(private departmentService: WordListService) {}

    loadDepartments$ = createEffect(() =>
        this.action$.pipe(
            ofType(loadDepartment),
            mergeMap(() =>
                this.departmentService.fetchData().pipe(
                    map((departments) => loadDepartmentSuccess({ departments }))
                )
            )
        )

    );
}

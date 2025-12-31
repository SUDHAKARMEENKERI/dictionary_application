import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { DropdownResponse } from '../models/Technology';

@Injectable({
    providedIn: 'root'
})

export class MCQQuestionService {
    private apiUrl = environment.apiUrl;

    private categories$?: Observable<DropdownResponse[]>;

    constructor(private http: HttpClient) { }

    private normalizeKey(value: unknown): string {
        return (value ?? '')
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[_\s]+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-');
    }

    private getCategories$(): Observable<DropdownResponse[]> {
        if (!this.categories$) {
            const url = `${this.apiUrl}/getTechCategories`;
            this.categories$ = this.http.get<DropdownResponse[]>(url).pipe(
                map((data) => data || []),
                shareReplay(1)
            );
        }
        return this.categories$;
    }

    private resolveCategoryId$(category: unknown): Observable<string | undefined> {
        if (category === null || category === undefined) return of(undefined);

        if (typeof category === 'number' && Number.isFinite(category)) {
            return of(String(category));
        }

        const raw = (category ?? '').toString().trim();
        if (!raw) return of(undefined);

        // If already numeric, keep it.
        const asNumber = Number(raw);
        if (Number.isFinite(asNumber) && raw.match(/^\d+$/)) {
            return of(raw);
        }

        const key = this.normalizeKey(raw);
        const keyNoDash = key.replace(/-/g, '');

        return this.getCategories$().pipe(
            map((cats) => {
                const match = (cats || []).find((c) => {
                    const nameKey = this.normalizeKey(c?.name);
                    return nameKey === key || nameKey.replace(/-/g, '') === keyNoDash;
                });
                const id = (match?.id ?? null) as any;
                return id !== null && id !== undefined ? String(id) : undefined;
            })
        );
    }

    getAllMcq(params?: { topic?: string; category?: string; technology?: string; questionType?: string }) {
        const url = `${this.apiUrl}/mcqQuestions/getMcq`;

        const topic = (params?.topic ?? '').toString().trim();
        const technology = (params?.technology ?? '').toString().trim();
        const questionType = (params?.questionType ?? '').toString().trim();

        return this.resolveCategoryId$(params?.category).pipe(
            switchMap((categoryId) => {
                let httpParams = new HttpParams();

                if (topic) httpParams = httpParams.set('topic', topic);
                if (categoryId) httpParams = httpParams.set('category', categoryId);
                if (technology) httpParams = httpParams.set('technology', technology);
                if (questionType) httpParams = httpParams.set('questionType', questionType);

                return this.http.get<any>(url, {
                    params: httpParams.keys().length ? httpParams : undefined,
                });
            })
        );
    }
}
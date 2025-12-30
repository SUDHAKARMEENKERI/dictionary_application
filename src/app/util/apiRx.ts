import { EMPTY, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export function apiFallback<T>(fallbackValue: T, context: string) {
  return (source$: Observable<T>): Observable<T> =>
    source$.pipe(
      catchError((error) => {
        console.error(context, error);
        return of(fallbackValue);
      })
    );
}

export function apiEmpty<T>(context: string) {
  return (source$: Observable<T>): Observable<T> =>
    source$.pipe(
      catchError((error) => {
        console.error(context, error);
        return EMPTY;
      })
    );
}

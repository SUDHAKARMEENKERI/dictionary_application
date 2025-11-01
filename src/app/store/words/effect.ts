// store/user.effects.ts
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserWord } from './model';
import { loadWordLoadSuccess, loadWordLoadFailure, loadWords, submitWord, submitWordFailure, submitWordSuccess, getWordById, getWordByIdSuccess, getWordByIdFailure, deleteWordById, deleteWordByIdFailure, deleteWordByIdSuccess } from './action';
import { WordListService } from '../../service/word-list.service';

@Injectable()
export class UserEffects {
  constructor(private wordsListService: WordListService) { }

  actions$ = inject(Actions);

  submitWord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(submitWord),
      mergeMap(action =>
        this.wordsListService.submitUserAddedWord(action.word).pipe(
          map((response: UserWord) => submitWordSuccess({ response })),
          catchError(err => of(submitWordFailure({ error: err.message })))
        )
      )
    )
  );

  loadWord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadWords),
      mergeMap(() =>
        this.wordsListService.fetchWords().pipe(
          map((response: UserWord) => loadWordLoadSuccess({ response })),
          catchError(err => of(loadWordLoadFailure({ error: err.message })))
        )
      )
    )
  );

  getWordById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getWordById),
      mergeMap((action: any) =>
        this.wordsListService.fetchWordById(action.id).pipe(
          map((response: UserWord) => getWordByIdSuccess({ response })),
          catchError(err => of(getWordByIdFailure({ error: err.message })))
        )
      )
    )
  );

  deleteWordById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteWordById),
      mergeMap((action: any) =>
        this.wordsListService.deleteWordById(action.id).pipe(
          map((response: UserWord) => deleteWordByIdSuccess({ response })),
          catchError(err => of(deleteWordByIdFailure({ error: err.message })))
        )
      )
    )
  )
}
import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { UserEffects } from './store/words/effect';
import { wordReducer } from './store/words/reducer';
import { userReducer } from './store/reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      })
    ),
    provideHttpClient(),
    importProvidersFrom(HttpClientModule),

    // NgRx providers (root)
    provideStore({ word: wordReducer, userDetails: userReducer }), // replace 'word' and 'dataReducer' with actual feature name and reducer
    provideEffects([UserEffects]),
  ]
};

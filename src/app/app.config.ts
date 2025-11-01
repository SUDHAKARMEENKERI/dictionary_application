import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { departmentReducer } from './store/reducer';
import { DepartmentEffects } from './store/effect';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { UserEffects } from './store/words/effect';
import { wordReducer } from './store/words/reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(),
    importProvidersFrom(HttpClientModule),

    // NgRx providers (root)
    provideStore({ department: departmentReducer, user: wordReducer }), // replace 'word' and 'dataReducer' with actual feature name and reducer
    provideEffects([DepartmentEffects, UserEffects]),
  ]
};

import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { departmentReducer } from './store/reducer';
import { DepartmentEffects } from './store/effect';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(),
    importProvidersFrom(HttpClientModule),

    // NgRx providers (root)
    provideStore({ department: departmentReducer }), // replace 'word' and 'dataReducer' with actual feature name and reducer
    provideEffects([DepartmentEffects]),
  ]
};

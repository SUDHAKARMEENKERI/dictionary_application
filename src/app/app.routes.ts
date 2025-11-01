import { Routes } from '@angular/router';
import { HomePageComponent } from './component/home-page/home-page.component';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: HomePageComponent },
    { path: 'wordlist', loadComponent: () => import('./component/wordslist/wordslist.component').then(m => m.WordslistComponent) },
    { path: 'addWords', loadComponent: () => import('./component/addwords/addwords.component').then(m => m.AddwordsComponent) },
    { path: 'addWords/:id', loadComponent: () => import('./component/addwords/addwords.component').then(m => m.AddwordsComponent) },

];

import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { LoginComponent } from './component/login/login.component';
import { SignupComponent } from './component/signup/signup.component';
import { ForgotPasswordComponent } from './component/forgot-password/forgot-password.component';
import { AboutUsComponent } from './component/about-us/about-us.component';
import { ContactUsComponent } from './component/contact-us/contact-us.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'home', loadComponent: () => import('./component/home-page/home-page.component').then(m => m.HomePageComponent), canActivate: [AuthGuard] },
    { path: 'wordlist', loadComponent: () => import('./component/wordslist/wordslist.component').then(m => m.WordslistComponent), canActivate: [AuthGuard] },
    { path: 'addWords', loadComponent: () => import('./component/addwords/addwords.component').then(m => m.AddwordsComponent), canActivate: [AuthGuard] },
    { path: 'addWords/:id', loadComponent: () => import('./component/addwords/addwords.component').then(m => m.AddwordsComponent), canActivate: [AuthGuard] },
    { path: 'addquestionanswer', loadComponent: () => import('./component/add-question-answer/add-question-answer.component').then(m => m.AddQuestionAnswerComponent), canActivate: [AuthGuard] },
    { path: 'showquestionanswer', loadComponent: () => import('./component/show-question-answer/show-question-answer.component').then(m => m.ShowQuestionAnswerComponent), canActivate: [AuthGuard] },
    { path: 'profile', loadComponent: () => import('./component/profile/profile.component').then(m => m.ProfileComponent), canActivate: [AuthGuard] },
    { path: 'about', component: AboutUsComponent },
    { path: 'contact', component: ContactUsComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'forgotpassword', component: ForgotPasswordComponent },

];

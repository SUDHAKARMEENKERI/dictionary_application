import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { LoginComponent } from './component/login/login.component';
import { SignupComponent } from './component/signup/signup.component';
import { ForgotPasswordComponent } from './component/forgot-password/forgot-password.component';
import { AboutUsComponent } from './component/about-us/about-us.component';
import { ContactUsComponent } from './component/contact-us/contact-us.component';
import { QaHomeComponent } from './component/qa-home/qa-home.component';
import { QaPageComponent } from './component/qa-page/qa-page.component';
import { QuizComponent } from './component/quiz/quiz.component';
import { TutorialComponent } from './component/tutorial/tutorial.component';

export const routes: Routes = [
  // Default
  { path: '', redirectTo: '/interview-prep', pathMatch: 'full' },

  // Auth
  { path: 'login', component: LoginComponent, title: 'CareerPrepBook | Login', data: { description: 'Log in to CareerPrepBook to access your dashboard and learning tools.', robots: 'noindex, nofollow' } },
  { path: 'sign-up', component: SignupComponent, title: 'CareerPrepBook | Sign Up', data: { description: 'Create your CareerPrepBook account and start preparing for interviews.', robots: 'noindex, nofollow' } },
  { path: 'forgot-password', component: ForgotPasswordComponent, title: 'CareerPrepBook | Forgot Password', data: { description: 'Reset your CareerPrepBook password securely.', robots: 'noindex, nofollow' } },

  // Main
  { path: 'dashboard', loadComponent: () => import('./component/home-page/home-page.component').then(m => m.HomePageComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | Dashboard', data: { description: 'Your CareerPrepBook dashboard: quick actions, stats, and your learning overview.' } },
  { path: 'profile', loadComponent: () => import('./component/profile/profile.component').then(m => m.ProfileComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | Profile', data: { description: 'Manage your CareerPrepBook profile and account details.' } },
  { path: 'settings', loadComponent: () => import('./component/settings/settings.component').then(m => m.SettingsComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | Settings', data: { description: 'Account settings, password reset, and policy links.' } },
  { path: 'progress', loadComponent: () => import('./component/progress/progress.component').then(m => m.ProgressComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | My Progress', data: { description: 'Track your quiz performance over time and review your progress.' } },
  { path: 'about', component: AboutUsComponent, title: 'CareerPrepBook | About', data: { description: 'Learn about CareerPrepBook and our mission to help you succeed in interviews.' } },
  { path: 'contact', component: ContactUsComponent, title: 'CareerPrepBook | Contact', data: { description: 'Contact CareerPrepBook support for help, feedback, or questions.' } },

  // Words
  { path: 'words', loadComponent: () => import('./component/wordslist/wordslist.component').then(m => m.WordslistComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | Word List', data: { description: 'Build your vocabulary with your personal CareerPrepBook word list.' } },
  { path: 'words/new', loadComponent: () => import('./component/addwords/addwords.component').then(m => m.AddwordsComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | Add Word', data: { description: 'Add a new word and meaning to your CareerPrepBook dictionary.' } },
  { path: 'words/:id/edit', loadComponent: () => import('./component/addwords/addwords.component').then(m => m.AddwordsComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | Edit Word', data: { description: 'Edit a word entry in your CareerPrepBook dictionary.' } },

  // Interview Q&A
  { path: 'interview-qa', loadComponent: () => import('./component/show-question-answer/show-question-answer.component').then(m => m.ShowQuestionAnswerComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | Interview Q&A', data: { description: 'Browse curated interview questions and answers to prepare smarter.' } },
  { path: 'interview-qa/editor', loadComponent: () => import('./component/add-question-answer/add-question-answer.component').then(m => m.AddQuestionAnswerComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | Add Interview Q&A', data: { description: 'Add your interview question and answer to CareerPrepBook.' } },
  { path: 'interview-prep', component: QaHomeComponent, title: 'CareerPrepBook | Interview Prep', data: { description: 'Choose a topic and practice interview Q&A, quizzes, and tutorials.' } },

  // Learning & Practice
  { path: 'tutorial', component: QaPageComponent, title: 'CareerPrepBook | Topic Tutorial', data: { description: 'Topic-based interview learning with guided explanations and practice.' } },
  { path: 'quiz', loadComponent: () => import('./component/quiz-landing/quiz-landing.component').then(m => m.QuizLandingComponent), title: 'CareerPrepBook | Quiz Topics', data: { description: 'Choose a technology/topic and start a quiz.' } },
  { path: 'quiz/play', component: QuizComponent, title: 'CareerPrepBook | Quiz', data: { description: 'Take curated quizzes and see your score with correct/wrong/unattempted breakdown.' } },
  { path: 'output-practice', loadComponent: () => import('./component/output-practice-landing/output-practice-landing.component').then(m => m.OutputPracticeLandingComponent), title: 'CareerPrepBook | Output Practice Topics', data: { description: 'Choose a technology/topic and start output practice.' } },
  { path: 'output-practice/play', component: TutorialComponent, title: 'CareerPrepBook | Output Practice', data: { description: 'Practice output-based questions and check your answers instantly.' } },
  { path: 'programming-questions', loadComponent: () => import('./component/programming-questions/programming-questions.component').then(m => m.ProgrammingQuestionsComponent), title: 'CareerPrepBook | Programming Questions', data: { description: 'Programming interview questions to improve problem-solving and coding skills.' } },

  // Legal & Support
  { path: 'help-center', loadComponent: () => import('./component/help-center/help-center.component').then(m => m.HelpCenterComponent), title: 'CareerPrepBook | Help Center', data: { description: 'Help Center and FAQ for using CareerPrepBook.' } },
  { path: 'faq', loadComponent: () => import('./component/faq/faq.component').then(m => m.FaqComponent), title: 'CareerPrepBook | FAQ', data: { description: 'Frequently asked questions about CareerPrepBook.' } },
  { path: 'privacy-policy', loadComponent: () => import('./component/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent), title: 'CareerPrepBook | Privacy Policy', data: { description: 'Privacy Policy for CareerPrepBook.' } },
  { path: 'terms', loadComponent: () => import('./component/terms/terms.component').then(m => m.TermsComponent), title: 'CareerPrepBook | Terms', data: { description: 'Terms and conditions for using CareerPrepBook.' } },

  // Backward-compatible redirects (old URLs)
  { path: 'home', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'signup', redirectTo: 'sign-up', pathMatch: 'full' },
  { path: 'forgotpassword', redirectTo: 'forgot-password', pathMatch: 'full' },
  { path: 'homeqa', redirectTo: 'interview-prep', pathMatch: 'full' },
  { path: 'qa-tutorial', redirectTo: 'tutorial', pathMatch: 'full' },
  { path: 'qa-quiz', redirectTo: 'quiz', pathMatch: 'full' },
  { path: 'qa-practice', redirectTo: 'output-practice', pathMatch: 'full' },
  { path: 'qa-programming', redirectTo: 'programming-questions', pathMatch: 'full' },
  { path: 'wordlist', redirectTo: 'words', pathMatch: 'full' },
  { path: 'addWords', redirectTo: 'words/new', pathMatch: 'full' },
  { path: 'addWords/:id', redirectTo: 'words/:id/edit', pathMatch: 'full' },
  { path: 'showquestionanswer', redirectTo: 'interview-qa', pathMatch: 'full' },
  { path: 'addquestionanswer', redirectTo: 'interview-qa/editor', pathMatch: 'full' },

  // Not found
  { path: '**', loadComponent: () => import('./component/not-found/not-found.component').then(m => m.NotFoundComponent), title: 'CareerPrepBook | Not Found' },

];

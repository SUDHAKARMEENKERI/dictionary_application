import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { LoginComponent } from './component/login/login.component';
import { SignupComponent } from './component/signup/signup.component';
import { ForgotPasswordComponent } from './component/forgot-password/forgot-password.component';
import { AboutUsComponent } from './component/about-us/about-us.component';
import { ContactUsComponent } from './component/contact-us/contact-us.component';
import { QaHomeComponent } from './component/qa-home/qa-home.component';
import { QaPageComponent } from './component/qa-page/qa-page.component';
import { QuizComponent } from './component/quiz/quiz.component';
import { TutorialComponent } from './component/tutorial/tutorial.component';
import { SeoCategoryLandingComponent } from './component/seo-category-landing/seo-category-landing.component';
import { SeoTopicLandingComponent } from './component/seo-topic-landing/seo-topic-landing.component';

export const routes: Routes = [
  // Default
  { path: '', redirectTo: '/interview-prep', pathMatch: 'full' },

  // SEO landing pages (indexable, keyword-focused)
  {
    path: 'java-interview-questions-and-answers',
    component: SeoCategoryLandingComponent,
    title: 'Java Interview Questions and Answers | CareerPrepBook',
    data: { description: 'Java interview questions and answers: practice by topic with clear explanations.', category: 'java' }
  },
  {
    path: 'javascript-interview-questions-and-answers',
    component: SeoCategoryLandingComponent,
    title: 'JavaScript Interview Questions and Answers | CareerPrepBook',
    data: { description: 'JavaScript interview questions and answers: practice by topic with clear explanations.', category: 'javascript' }
  },
  {
    path: 'angular-interview-questions-and-answers',
    component: SeoCategoryLandingComponent,
    title: 'Angular Interview Questions and Answers | CareerPrepBook',
    data: { description: 'Angular interview questions and answers: practice by topic with clear explanations.', category: 'angular' }
  },
  {
    path: 'react-interview-questions-and-answers',
    component: SeoCategoryLandingComponent,
    title: 'React Interview Questions and Answers | CareerPrepBook',
    data: { description: 'React interview questions and answers: practice by topic with clear explanations.', category: 'react' }
  },
  {
    path: 'html-interview-questions-and-answers',
    component: SeoCategoryLandingComponent,
    title: 'HTML Interview Questions and Answers | CareerPrepBook',
    data: { description: 'HTML interview questions and answers: practice by topic with clear explanations.', category: 'html' }
  },
  {
    path: 'css-interview-questions-and-answers',
    component: SeoCategoryLandingComponent,
    title: 'CSS Interview Questions and Answers | CareerPrepBook',
    data: { description: 'CSS interview questions and answers: practice by topic with clear explanations.', category: 'css' }
  },

  // Java sub-topics (SEO)
  {
    path: 'java-exception-interview-questions-and-answers',
    component: SeoTopicLandingComponent,
    title: 'Java Exception Interview Questions and Answers | CareerPrepBook',
    data: { description: 'Java exception interview questions and answers with clear explanations.', category: 'java', topic: 'Exception' }
  },
  {
    path: 'java-collections-interview-questions-and-answers',
    component: SeoTopicLandingComponent,
    title: 'Java Collections Interview Questions and Answers | CareerPrepBook',
    data: { description: 'Java collections interview questions and answers with clear explanations.', category: 'java', topic: 'Collections' }
  },
  {
    path: 'java-multithreading-interview-questions-and-answers',
    component: SeoTopicLandingComponent,
    title: 'Java Multithreading Interview Questions and Answers | CareerPrepBook',
    data: { description: 'Java multithreading interview questions and answers with clear explanations.', category: 'java', topic: 'Multithreading' }
  },

  // Auth
  { path: 'login', component: LoginComponent, title: 'CareerPrepBook | Login', data: { description: 'Log in to CareerPrepBook to access your dashboard and learning tools.', robots: 'noindex, nofollow' } },
  { path: 'sign-up', component: SignupComponent, title: 'CareerPrepBook | Sign Up', data: { description: 'Create your CareerPrepBook account and start preparing for interviews.', robots: 'noindex, nofollow' } },
  { path: 'forgot-password', component: ForgotPasswordComponent, title: 'CareerPrepBook | Forgot Password', data: { description: 'Reset your CareerPrepBook password securely.', robots: 'noindex, nofollow' } },

  // Main
  { path: 'dashboard', loadComponent: () => import('./component/home-page/home-page.component').then(m => m.HomePageComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | Dashboard', data: { description: 'Your CareerPrepBook dashboard: quick actions, stats, and your learning overview.' } },
  { path: 'profile', loadComponent: () => import('./component/profile/profile.component').then(m => m.ProfileComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | Profile', data: { description: 'Manage your CareerPrepBook profile and account details.' } },
  { path: 'settings', loadComponent: () => import('./component/settings/settings.component').then(m => m.SettingsComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | Settings', data: { description: 'Account settings, password reset, and policy links.' } },
  { path: 'progress', loadComponent: () => import('./component/progress/progress.component').then(m => m.ProgressComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | My Progress', data: { description: 'Track your quiz performance over time and review your progress.' } },
  
  // Admin Only
  { path: 'admin/page-view-stats', loadComponent: () => import('./component/page-view-stats/page-view-stats.component').then(m => m.PageViewStatsComponent), canActivate: [AdminGuard], title: 'CareerPrepBook | Page View Statistics', data: { description: 'View page statistics and user engagement metrics.', robots: 'noindex, nofollow' } },
  { path: 'admin/users', loadComponent: () => import('./component/user-list/user-list.component').then(m => m.UserListComponent), canActivate: [AdminGuard], title: 'CareerPrepBook | User Management', data: { description: 'View and manage registered users.', robots: 'noindex, nofollow' } },
  
  // Public Pages
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
  { path: 'tutorial/:category/:topic', component: QaPageComponent, title: 'CareerPrepBook | Topic Tutorial', data: { description: 'Topic-based interview learning with guided explanations and practice.' } },
  { path: 'tutorial', component: QaPageComponent, title: 'CareerPrepBook | Topic Tutorial', data: { description: 'Topic-based interview learning with guided explanations and practice.' } },
  { path: 'quiz', loadComponent: () => import('./component/quiz-landing/quiz-landing.component').then(m => m.QuizLandingComponent), title: 'CareerPrepBook | Quiz Topics', data: { description: 'Choose a technology/topic and start a quiz.' } },
  { path: 'quiz/play', component: QuizComponent, title: 'CareerPrepBook | Quiz', data: { description: 'Take curated quizzes and see your score with correct/wrong/unattempted breakdown.' } },
  { path: 'output-practice', loadComponent: () => import('./component/output-practice-landing/output-practice-landing.component').then(m => m.OutputPracticeLandingComponent), title: 'CareerPrepBook | Output Practice Topics', data: { description: 'Choose a technology/topic and start output practice.' } },
  { path: 'output-practice/play', component: TutorialComponent, title: 'CareerPrepBook | Output Practice', data: { description: 'Practice output-based questions and check your answers instantly.' } },
  { path: 'my-questions', loadComponent: () => import('./component/my-questions/my-questions.component').then(m => m.MyQuestionsComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | My Questions', data: { description: 'Manage your quiz and output-practice questions.', robots: 'noindex, nofollow' } },
  { path: 'programming-qa', loadComponent: () => import('./component/programming-questions-view/programming-questions-view.component').then(m => m.ProgrammingQuestionsViewComponent), title: 'CareerPrepBook | Programming Q&A', data: { description: 'Programming interview questions with answers in multiple languages.' } },
  { path: 'programming-questions', loadComponent: () => import('./component/programming-questions/programming-questions.component').then(m => m.ProgrammingQuestionsComponent), title: 'CareerPrepBook | Programming Questions', data: { description: 'Programming interview questions to improve problem-solving and coding skills.' } },
  { path: 'programming-questions/new', loadComponent: () => import('./component/add-programming-question/add-programming-question.component').then(m => m.AddProgrammingQuestionComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | Add Programming Question', data: { description: 'Add a new programming interview question.' } },
  { path: 'programming-questions/:id/edit', loadComponent: () => import('./component/add-programming-question/add-programming-question.component').then(m => m.AddProgrammingQuestionComponent), canActivate: [AuthGuard], title: 'CareerPrepBook | Edit Programming Question', data: { description: 'Edit programming interview question.' } },

  // Legal & Supportp
  { path: 'help-center', loadComponent: () => import('./component/help-center/help-center.component').then(m => m.HelpCenterComponent), title: 'CareerPrepBook | Help Center', data: { description: 'Help Center and FAQ for using CareerPrepBook.' } },
  { path: 'faq', loadComponent: () => import('./component/faq/faq.component').then(m => m.FaqComponent), title: 'CareerPrepBook | FAQ', data: { description: 'Frequently asked questions about CareerPrepBook.' } },
  { path: 'privacy-policy', loadComponent: () => import('./component/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent), title: 'CareerPrepBook | Privacy Policy', data: { description: 'Privacy Policy for CareerPrepBook.' } },
  { path: 'disclaimer', loadComponent: () => import('./component/disclaimer/disclaimer.component').then(m => m.DisclaimerComponent), title: 'CareerPrepBook | Disclaimer', data: { description: 'Disclaimer for CareerPrepBook.' } },
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

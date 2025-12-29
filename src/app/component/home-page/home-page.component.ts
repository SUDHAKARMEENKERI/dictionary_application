import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserSignUpService } from '../../service/user-signup.service';
import { WordListService } from '../../service/word-list.service';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface DashboardData {
  userName: string;
  totalWords: number;
  totalUsers: number;
  wordUserContribution: number;
  userquestionsAnswer: number;
  totalQuestionAnswerCount: number;
  qaUserContribution: number;
}

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit, OnDestroy {
  dashBoardData: DashboardData = {
    userName: '',
    totalWords: 0,
    totalUsers: 0,
    wordUserContribution: 0,
    userquestionsAnswer: 0,
    totalQuestionAnswerCount: 0,
    qaUserContribution: 0
  };
  private destroy$ = new Subject<void>();

  announcements = [
    'New feature: Export your word list to PDF!',
  ];
  navLinks = [
    { label: 'Word List', link: '/words', icon: 'bi bi-list-ul' },
    { label: 'Add Word', link: '/words/new', icon: 'bi bi-plus-circle' },
    { label: 'Add Interview Q&A', link: '/interview-qa/editor', icon: 'bi bi-plus-circle' },
    { label: 'Interview Q&A', link: '/interview-qa', icon: 'bi bi-plus-circle' },
    { label: 'Programming Questions', link: '/programming-questions', icon: 'bi bi-code-slash' },
    { label: 'Profile', link: '/profile', icon: 'bi bi-person' },
    { label: 'About', link: '/about', icon: 'bi bi-info-circle' },
    { label: 'Contact', link: '/contact', icon: 'bi bi-envelope' },
    { label: 'Interview Prep', link: '/interview-prep', icon: 'bi bi-list-ul' },
    // { label: 'Settings', link: '/settings', icon: 'bi bi-gear' }
  ];
  recentActivities = [
    'Added new word: "serendipity".',
    'Updated profile information.',
    'Exported word list to Excel.'
  ];

  constructor(private router: Router, private userService: UserSignUpService,
    private wordService: WordListService,
    private questionAnswerService: QuestionAnswerService
  ) { }

 

  ngOnInit(): void {
    const loginData = localStorage.getItem('login');
    this.userService.getUserDetailsByMobile(loginData ? JSON.parse(loginData).mobile : '').pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        this.dashBoardData.userName = user.firstName + ' ' + user.lastName; // Assuming the user object has a 'name' property
      },
      error: (error) => {
        console.error('Error fetching user details:', error);
      }
    });
    this.userService.getUserCount().pipe(takeUntil(this.destroy$)).subscribe({
      next: (countData) => {
        this.dashBoardData.totalUsers = countData.totalUserCount;
      },
      error: (error) => {
        console.error('Error fetching user count:', error);
      }
    });

    this.wordService.getWordCount().pipe(takeUntil(this.destroy$)).subscribe({
      next: (countData) => {
        this.dashBoardData.totalWords = countData.totalWordCount;
      },
      error: (error) => {
        console.error('Error fetching word count:', error);
      }
    });

    this.wordService.getWordCountByMobile(localStorage.getItem('login') ? JSON.parse(localStorage.getItem('login')!).mobile : '').pipe(takeUntil(this.destroy$)).subscribe({
      next: (countData) => {
        this.dashBoardData.wordUserContribution = countData;
      },
      error: (error) => {
        console.error('Error fetching word count:', error);
      }
    });

    this.questionAnswerService.getQuestionAnswerCountByMobile(localStorage.getItem('login') ? JSON.parse(localStorage.getItem('login')!).mobile : '').pipe(takeUntil(this.destroy$)).subscribe({
      next: (countData) => {
        this.dashBoardData.qaUserContribution = countData;
      },
      error: (error) => {
        console.error('Error fetching question answer count by user mobile:', error);
      }
    });

    this.questionAnswerService.getQuestionAnswerCount().pipe(takeUntil(this.destroy$)).subscribe({
      next: (countData: any) => {
        this.dashBoardData.totalQuestionAnswerCount = countData;
      },
      error: (error) => {
        console.error('Error fetching question answer count:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}

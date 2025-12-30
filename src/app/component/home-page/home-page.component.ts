import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserSignUpService } from '../../service/user-signup.service';
import { WordListService } from '../../service/word-list.service';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { readLoginMobile } from '../../util/loginStorage';

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
    { label: 'FAQ', link: '/faq', icon: 'bi bi-question-circle' },
    { label: 'Contact', link: '/contact', icon: 'bi bi-envelope' },
    { label: 'Interview Prep', link: '/interview-prep', icon: 'bi bi-list-ul' },
    // { label: 'Settings', link: '/settings', icon: 'bi bi-gear' }
  ];
  recentActivities = [
    'Added new word: "serendipity".',
    'Updated profile information.',
    'Exported word list to Excel.'
  ];

  constructor(private userService: UserSignUpService,
    private wordService: WordListService,
    private questionAnswerService: QuestionAnswerService
  ) { }

  ngOnInit(): void {
    const mobile = readLoginMobile();

    const userName$ = mobile
      ? this.userService.getUserDetailsByMobile(mobile).pipe(
        map((user: any) => {
          const first = (user?.firstName ?? '').toString().trim();
          const last = (user?.lastName ?? '').toString().trim();
          return `${first} ${last}`.trim();
        }),
        catchError((error) => {
          console.error('Error fetching user details:', error);
          return of('');
        })
      )
      : of('');

    const totalUsers$ = this.userService.getUserCount().pipe(
      map((countData: any) => Number(countData?.totalUserCount ?? 0)),
      catchError((error) => {
        console.error('Error fetching user count:', error);
        return of(0);
      })
    );

    const totalWords$ = this.wordService.getWordCount().pipe(
      map((countData: any) => Number(countData?.totalWordCount ?? 0)),
      catchError((error) => {
        console.error('Error fetching word count:', error);
        return of(0);
      })
    );

    const wordUserContribution$ = mobile
      ? this.wordService.getWordCountByMobile(mobile).pipe(
        map((countData: any) => Number(countData ?? 0)),
        catchError((error) => {
          console.error('Error fetching word count by user mobile:', error);
          return of(0);
        })
      )
      : of(0);

    const qaUserContribution$ = mobile
      ? this.questionAnswerService.getQuestionAnswerCountByMobile(mobile).pipe(
        map((countData: any) => Number(countData ?? 0)),
        catchError((error) => {
          console.error('Error fetching question answer count by user mobile:', error);
          return of(0);
        })
      )
      : of(0);

    const totalQuestionAnswerCount$ = this.questionAnswerService.getQuestionAnswerCount().pipe(
      map((countData: any) => Number(countData ?? 0)),
      catchError((error) => {
        console.error('Error fetching question answer count:', error);
        return of(0);
      })
    );

    forkJoin({
      userName: userName$,
      totalUsers: totalUsers$,
      totalWords: totalWords$,
      wordUserContribution: wordUserContribution$,
      qaUserContribution: qaUserContribution$,
      totalQuestionAnswerCount: totalQuestionAnswerCount$
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        this.dashBoardData = {
          ...this.dashBoardData,
          ...result
        };
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}

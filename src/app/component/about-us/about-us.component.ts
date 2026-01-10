import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserSignUpService } from '../../service/user-signup.service';
import { WordListService } from '../../service/word-list.service';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-about-us',
  imports: [CommonModule, RouterModule],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss'
})
export class AboutUsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  statistics = [
    { number: '0', label: 'Active Users', icon: 'bi bi-people-fill' },
    { number: '0', label: 'Words Added', icon: 'bi bi-book-fill' },
    { number: '0', label: 'Q&A Pairs', icon: 'bi bi-chat-dots-fill' },
    { number: '0', label: 'Contributors', icon: 'bi bi-star-fill' }
  ];

  features = [
    {
      icon: 'bi bi-lightning-fill',
      title: 'Fast Learning',
      description: 'Quickly expand your vocabulary with our organized word lists and interactive flashcards.'
    },
    {
      icon: 'bi bi-people-fill',
      title: 'Community Driven',
      description: 'Learn from real interview experiences shared by thousands of professionals in our community.'
    },
    {
      icon: 'bi bi-bar-chart-fill',
      title: 'Track Progress',
      description: 'Monitor your learning journey with detailed analytics and personalized recommendations.'
    },
    {
      icon: 'bi bi-shield-fill',
      title: 'Quality Content',
      description: 'Curated and verified content by experienced professionals and subject matter experts.'
    },
    {
      icon: 'bi bi-globe2',
      title: 'Always Available',
      description: 'Access your learning materials anytime, anywhere across all your devices.'
    },
    {
      icon: 'bi bi-gear-fill',
      title: 'Easy to Use',
      description: 'Intuitive interface designed for seamless learning experience without steep learning curves.'
    }
  ];

  teamMembers = [
    {
      name: 'Suhakar Meenkeri',
      role: 'Founder & CEO',
      bio: 'Tech enthusiast with 7+ years in education technology. Passionate about democratizing learning.',
      icon: 'bi bi-person-circle'
    },
    {
      name: 'Annapoorna Meenkeri',
      role: 'Head of Content',
      bio: 'Expert educator with background in linguistics and curriculum design. Ensures quality content.',
      icon: 'bi bi-person-circle'
    },
    {
      name: 'Sandhya Rani Bhangare',
      role: 'Tech Lead',
      bio: 'Full-stack developer focused on creating robust, scalable solutions for educational platforms.',
      icon: 'bi bi-person-circle'
    }
  ];

  values = [
    {
      icon: 'bi bi-heart-fill',
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, from content quality to user experience.'
    },
    {
      icon: 'bi bi-people-fill',
      title: 'Community',
      description: 'We believe in the power of community collaboration and peer learning.'
    },
    {
      icon: 'bi bi-lightbulb-fill',
      title: 'Innovation',
      description: 'Constantly innovating to provide cutting-edge learning tools and features.'
    },
    {
      icon: 'bi bi-graph-up',
      title: 'Growth',
      description: 'Committed to helping every learner achieve their career and personal growth goals.'
    }
  ];

  constructor(
    private userService: UserSignUpService,
    private wordService: WordListService,
    private questionAnswerService: QuestionAnswerService
  ) { }

  ngOnInit(): void {
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStatistics(): void {
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

    const totalQuestionAnswerCount$ = this.questionAnswerService.getQuestionAnswerCount().pipe(
      map((countData: any) => Number(countData ?? 0)),
      catchError((error) => {
        console.error('Error fetching question answer count:', error);
        return of(0);
      })
    );

    forkJoin({
      totalUsers: totalUsers$,
      totalWords: totalWords$,
      totalQuestionAnswerCount: totalQuestionAnswerCount$
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        this.statistics = [
          { 
            number: this.formatNumber(result.totalUsers), 
            label: 'Active Users', 
            icon: 'bi bi-people-fill' 
          },
          { 
            number: this.formatNumber(result.totalWords), 
            label: 'Words Added', 
            icon: 'bi bi-book-fill' 
          },
          { 
            number: this.formatNumber(result.totalQuestionAnswerCount), 
            label: 'Q&A Pairs', 
            icon: 'bi bi-chat-dots-fill' 
          },
          { 
            number: this.formatNumber(result.totalUsers), 
            label: 'Contributors', 
            icon: 'bi bi-star-fill' 
          }
        ];
      });
  }

  private formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K+';
    }
    return num.toString() + (num > 0 ? '+' : '');
  }
}

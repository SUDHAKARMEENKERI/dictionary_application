import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { QuizAttemptService, QuizAttempt } from '../../service/quiz-attempt.service';
import { apiFallback, apiEmpty } from '../../util/apiRx';
import { ModalComponent, ModalDetails } from '../modal/modal.component';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalComponent],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss'
})
export class ProgressComponent implements OnInit, OnDestroy {
  attempts: QuizAttempt[] = [];
  private destroy$ = new Subject<void>();
  
  confirmModalDetails: ModalDetails = {
    isOpen: false,
    title: 'Confirm Clear History',
    message: 'Are you sure you want to clear your quiz history? This action will hide all your quiz attempts.',
    status: 'warning',
    isConfirmation: true,
    confirmText: 'Clear History',
    cancelText: 'Cancel'
  };

  constructor(private quizAttemptService: QuizAttemptService) { }

  ngOnInit(): void {
    this.loadAttempts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAttempts(): void {
    this.quizAttemptService.getAttempts({ limit: 25 })
      .pipe(
        apiFallback<QuizAttempt[]>([], 'Error loading quiz attempts'),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.attempts = data || [];
      });
  }

  get totalAttempts(): number {
    return this.attempts.length;
  }

  get bestPercent(): number {
    return this.attempts.reduce((max, a) => Math.max(max, a.percent ?? 0), 0);
  }

  get averagePercent(): number {
    if (!this.attempts.length) return 0;
    const sum = this.attempts.reduce((acc, a) => acc + (a.percent ?? 0), 0);
    return Math.round(sum / this.attempts.length);
  }

  clearHistory(): void {
    this.confirmModalDetails.isOpen = true;
  }

  onConfirmClearHistory(): void {
    this.quizAttemptService.clearAttempts()
      .pipe(
        apiEmpty('Error clearing quiz attempts'),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.attempts = [];
      });
  }

  trackById = (_: number, a: QuizAttempt) => a.id;
}

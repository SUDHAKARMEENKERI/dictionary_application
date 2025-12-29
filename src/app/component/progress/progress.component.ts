import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

type QuizAttempt = {
  id: string;
  createdAt: string;
  topic?: string;
  planTitle?: string;
  total: number;
  correct: number;
  wrong: number;
  unattempted: number;
  percent: number;
};

const STORAGE_KEY = 'cpb_quiz_attempts';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss'
})
export class ProgressComponent implements OnInit {
  attempts: QuizAttempt[] = [];

  ngOnInit(): void {
    this.attempts = this.readAttempts();
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
    localStorage.removeItem(STORAGE_KEY);
    this.attempts = [];
  }

  private readAttempts(): QuizAttempt[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as QuizAttempt[];
    } catch {
      return [];
    }
  }

  trackById = (_: number, a: QuizAttempt) => a.id;
}

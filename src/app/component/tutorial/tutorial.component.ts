import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import {
  distinctUntilChanged,
  finalize,
  map,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { apiFallback } from '../../util/apiRx';
import { MCQQuestionService } from '../../service/mcqQuestion.service';

type OutputQuestion = {
  question: string;
  code: string;
  answer: string;
  options: string[];
  selectedOption: string;
  topic?: string;
  showAnswer: boolean;
  checked: boolean;
  isCorrect: boolean | null;
};

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class TutorialComponent implements OnInit, OnDestroy {

  constructor(
    private activeRouter: ActivatedRoute,
    private router: Router,
    private mcqQuestionService: MCQQuestionService
  ) {}

  private destroy$ = new Subject<void>();
  isLoadingQuestions = false;
  selectedTopic: string = 'All';

  category = '';

  questions: OutputQuestion[] = [];

  private normalizeOutput(text: string): string {
    // Normalizes whitespace/newlines so users can type the same output format in different ways.
    return (text ?? '')
      .toString()
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
  }

  private normalizeOutputQuestions(data: any): OutputQuestion[] {
    const list = Array.isArray(data)
      ? data
      : (data?.data ?? data?.result ?? data?.items ?? data?.content ?? []);

    if (!Array.isArray(list)) return [];

    return list
      .map((item: any) => {
        const question = (item?.questionText ?? item?.prompt ?? item?.question ?? item?.ques ?? item?.title ?? '').toString().trim();
        const code = (
          item?.code ??
          item?.codeSnippet ??
          item?.questionCode ??
          item?.snippet ??
          item?.program ??
          item?.source ??
          item?.body ??
          item?.content ??
          ''
        ).toString();
        const answer = (
          item?.correctAnswer ??
          item?.answer ??
          item?.output ??
          item?.expectedOutput ??
          item?.expected ??
          ''
        ).toString();

        const optionsRaw = item?.options ?? item?.option ?? item?.choices ?? item?.answers;
        const options = Array.isArray(optionsRaw)
          ? optionsRaw.map((o: any) => (o ?? '').toString()).filter((v: string) => v.trim().length > 0)
          : [];
        const topic = (item?.topic ?? item?.technology ?? item?.category ?? item?.tech ?? '').toString().trim();

        // For output-practice we need at least a prompt + expected output.
        // Backend may send expected value in `correctAnswer` (OUTPUTBASEDMCQ).
        if (!question || !answer) return null;

        return {
          question,
          code,
          answer,
          options,
          selectedOption: '',
          topic: topic || undefined,
          showAnswer: false,
          checked: false,
          isCorrect: null,
        } as OutputQuestion;
      })
      .filter(Boolean) as OutputQuestion[];
  }

  ngOnInit(): void {
    this.activeRouter.queryParams
      .pipe(
        map((params) => {
          const topic = (params?.['topic'] ?? '').toString().trim();
          const category = (params?.['category'] ?? '').toString().trim();
          return {
            topic: topic || 'All',
            category,
          };
        }),
        distinctUntilChanged((a, b) => a.topic === b.topic && a.category === b.category),
        tap(({ topic, category }) => {
          this.selectedTopic = topic;
          this.category = category;
          this.isLoadingQuestions = true;
        }),
        switchMap(({ topic, category }) =>
          this.loadQuestionBank$(topic === 'All' ? '' : topic, category).pipe(
            finalize(() => {
              this.isLoadingQuestions = false;
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((qs) => {
        this.questions = qs || [];
      });
  }

  private loadQuestionBank$(topic: string, category: string) {
    return this.mcqQuestionService.getAllMcq({ topic, category, questionType: 'OUTPUTBASEDMCQ' }).pipe(
      apiFallback<any[]>([], 'Error loading output practice question bank'),
      map((data) => this.normalizeOutputQuestions(data))
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToTopicPicker(): void {
    this.router.navigate(['/output-practice']);
  }

  get displayedQuestions(): OutputQuestion[] {
    return this.questions;
  }

  get totalQuestions(): number {
    return this.displayedQuestions.length;
  }

  get attemptedCount(): number {
    return this.displayedQuestions.filter(q => (q.selectedOption ?? '').toString().trim().length > 0).length;
  }

  get correctCount(): number {
    return this.displayedQuestions.filter(q => q.checked && q.isCorrect === true).length;
  }

  get wrongCount(): number {
    return this.displayedQuestions.filter(q => q.checked && q.isCorrect === false).length;
  }

  get unattemptedCount(): number {
    return Math.max(0, this.totalQuestions - this.attemptedCount);
  }

  toggleAnswer(q: OutputQuestion) {
    q.showAnswer = !q.showAnswer;
  }

  checkAnswer(q: OutputQuestion) {
    const expected = this.normalizeOutput(q.answer);
    const actual = this.normalizeOutput(q.selectedOption);
    q.checked = true;
    q.isCorrect = actual.length > 0 && actual === expected;
  }

  selectOption(q: OutputQuestion, option: string) {
    q.selectedOption = (option ?? '').toString();
    // If user changes option after checking, mark as unchecked until they press Check again.
    if (q.checked) {
      q.checked = false;
      q.isCorrect = null;
    }
  }

  resetQuestion(q: OutputQuestion) {
    q.selectedOption = '';
    q.checked = false;
    q.isCorrect = null;
    q.showAnswer = false;
  }

  resetAll() {
    this.questions.forEach(q => this.resetQuestion(q));
  }

}

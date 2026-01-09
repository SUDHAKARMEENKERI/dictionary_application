import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
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
  userAnswer: string;
  topic?: string;
  category?: string;
  questionType?: string;
  showAnswer: boolean;
  mcqChecked: boolean;
  mcqIsCorrect: boolean | null;
  typedChecked: boolean;
  typedIsCorrect: boolean | null;
};

type OutputSection = 'mcq' | 'typed';

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

  activeSection: OutputSection = 'mcq';

  category = '';

  questions: OutputQuestion[] = [];

  // Question set plans
  questionSets = [
    { count: 5, title: 'Quick Set' },
    { count: 10, title: 'Practice Set' },
    { count: 25, title: 'Challenge Set' },
    { count: 35, title: 'Pro Set' },
    { count: 50, title: 'Expert Set' },
    { count: 75, title: 'Elite Set' },
    { count: 100, title: 'Master Set' }
  ];
  
  selectedSetCount: number | null = null;

  private readonly typedOutputQuestionType = 'OUTPUTBASED';

  private firstNonEmpty(...values: any[]): string {
    for (const v of values) {
      const s = (v ?? '').toString();
      if (s.trim().length > 0) return s;
    }
    return '';
  }

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
        const question = this.firstNonEmpty(item?.questionText, item?.prompt, item?.question, item?.ques, item?.title).trim();
        const code = this.firstNonEmpty(
          item?.code,
          item?.question_code,
          item?.questionCode,
          item?.programCode,
          item?.sourceCode,
          item?.codeText,
          item?.codeSnippet,
          item?.snippet,
          item?.program,
          item?.source,
          item?.body,
          item?.content
        );
        const answer = this.firstNonEmpty(
          // Some APIs send correctAnswer as empty string for OUTPUTBASED.
          item?.correctAnswer,
          item?.answer,
          item?.output,
          item?.expectedOutput,
          item?.expected
        );

        const optionsRaw = item?.options ?? item?.option ?? item?.choices ?? item?.answers;
        const options = Array.isArray(optionsRaw)
          ? optionsRaw.map((o: any) => (o ?? '').toString()).filter((v: string) => v.trim().length > 0)
          : [];
        const topic = this.firstNonEmpty(item?.topic, item?.technology, item?.tech).trim();
        const category = this.firstNonEmpty(item?.category).trim();
        const questionType = this.firstNonEmpty(item?.questionType, item?.question_type, item?.type).trim();

        // For output-practice we need at least a prompt + expected output.
        // Backend may send expected value in `correctAnswer` (OUTPUTBASEDMCQ).
        if (!question || !answer) return null;

        return {
          question,
          code,
          answer,
          options,
          selectedOption: '',
          userAnswer: '',
          topic: topic || undefined,
          category: category || undefined,
          questionType: questionType || undefined,
          showAnswer: false,
          mcqChecked: false,
          mcqIsCorrect: null,
          typedChecked: false,
          typedIsCorrect: null,
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
    const mcq$ = this.mcqQuestionService
      .getAllMcq({ topic, category, questionType: 'OUTPUTBASEDMCQ' })
      .pipe(
        apiFallback<any[]>([], 'Error loading output MCQ question bank'),
        map((data) => this.normalizeOutputQuestions(data))
      );

    // Typed-output (answer type) questions now load from the MCQ endpoint
    // with questionType=OUTPUTBASED.
    const typed$ = this.mcqQuestionService
      .getAllMcq({ topic, category, questionType: this.typedOutputQuestionType })
      .pipe(
        apiFallback<any[]>([], 'Error loading typed output question bank'),
        map((data) => this.normalizeOutputQuestions(data)),
        // Typed-output questions should not show MCQ options.
        map((qs) => (qs ?? []).map((q) => ({ ...q, options: [] })))
      );

    return forkJoin({ mcq: mcq$, typed: typed$ }).pipe(
      map(({ mcq, typed }) => {
        return [...(mcq ?? []), ...(typed ?? [])];
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToTopicPicker(): void {
    this.router.navigate(['/output-practice']);
  }

  setActiveSection(section: OutputSection) {
    this.activeSection = section;
  }

  get displayedQuestions(): OutputQuestion[] {
    const all = this.questions;
    if (this.selectedSetCount === null) return all;
    return all.slice(0, this.selectedSetCount);
  }

  get mcqQuestions(): OutputQuestion[] {
    return this.displayedQuestions.filter(q => (q.options?.length ?? 0) > 0);
  }

  get typedQuestions(): OutputQuestion[] {
    // Typed tab is for OUTPUTBASED questions (answer-type). Code may be missing depending on backend payload.
    return this.displayedQuestions.filter(q =>
      (q.options?.length ?? 0) === 0 &&
      (q.questionType ?? '').toString().trim().toUpperCase() === this.typedOutputQuestionType
    );
  }

  private get activeQuestions(): OutputQuestion[] {
    return this.activeSection === 'mcq' ? this.mcqQuestions : this.typedQuestions;
  }

  get totalQuestions(): number {
    return this.activeQuestions.length;
  }

  get attemptedCount(): number {
    if (this.activeSection === 'mcq') {
      return this.activeQuestions.filter(q => (q.selectedOption ?? '').toString().trim().length > 0).length;
    }

    return this.activeQuestions.filter(q => (q.userAnswer ?? '').toString().trim().length > 0).length;
  }

  get correctCount(): number {
    if (this.activeSection === 'mcq') {
      return this.activeQuestions.filter(q => q.mcqChecked && q.mcqIsCorrect === true).length;
    }

    return this.activeQuestions.filter(q => q.typedChecked && q.typedIsCorrect === true).length;
  }

  get wrongCount(): number {
    if (this.activeSection === 'mcq') {
      return this.activeQuestions.filter(q => q.mcqChecked && q.mcqIsCorrect === false).length;
    }

    return this.activeQuestions.filter(q => q.typedChecked && q.typedIsCorrect === false).length;
  }

  get unattemptedCount(): number {
    return Math.max(0, this.totalQuestions - this.attemptedCount);
  }

  toggleAnswer(q: OutputQuestion) {
    q.showAnswer = !q.showAnswer;
  }

  // Backwards-compatible: the existing template uses this for MCQ.
  checkAnswer(q: OutputQuestion) {
    this.checkMcqAnswer(q);
  }

  checkMcqAnswer(q: OutputQuestion) {
    const expected = this.normalizeOutput(q.answer);
    const actual = this.normalizeOutput(q.selectedOption);
    q.mcqChecked = true;
    q.mcqIsCorrect = actual.length > 0 && actual === expected;
  }

  checkTypedAnswer(q: OutputQuestion) {
    const expected = this.normalizeOutput(q.answer);
    const actual = this.normalizeOutput(q.userAnswer);
    q.typedChecked = true;
    q.typedIsCorrect = actual.length > 0 && actual === expected;
  }

  selectOption(q: OutputQuestion, option: string) {
    q.selectedOption = (option ?? '').toString();
    // If user changes option after checking, mark as unchecked until they press Check again.
    if (q.mcqChecked) {
      q.mcqChecked = false;
      q.mcqIsCorrect = null;
    }
  }

  onTypedAnswerChanged(q: OutputQuestion) {
    if (q.typedChecked) {
      q.typedChecked = false;
      q.typedIsCorrect = null;
    }
  }

  resetQuestion(q: OutputQuestion) {
    q.selectedOption = '';
    q.userAnswer = '';
    q.mcqChecked = false;
    q.mcqIsCorrect = null;
    q.typedChecked = false;
    q.typedIsCorrect = null;
    q.showAnswer = false;
  }

  resetAll() {
    this.questions.forEach(q => this.resetQuestion(q));
  }

  selectQuestionSet(count: number) {
    this.selectedSetCount = count;
  }

  showAllQuestions() {
    this.selectedSetCount = null;
  }

  get isSetSelected(): boolean {
    return this.selectedSetCount !== null;
  }

}

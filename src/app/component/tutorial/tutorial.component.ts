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
import { readLoginMobile } from '../../util/loginStorage';
import { ADMIN_MOBILE } from '../../util/app-constants';
import { ModalComponent, ModalDetails } from '../modal/modal.component';

type OutputQuestion = {
  id?: string | number;
  question: string;
  code: string;
  answer: string;
  correctAnswer?: string;
  options: string[];
  selectedOption: string;
  userAnswer: string;
  topic?: string;
  category?: string;
  questionType?: string;
  level?: string;
  mobile?: string;
  admin?: boolean;
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
  imports: [CommonModule, FormsModule, ModalComponent],
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

  private readonly optionLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  private readonly adminMobile = ADMIN_MOBILE;
  private readonly currentMobile = (readLoginMobile() ?? '').toString().trim();

  private get isAdminUser(): boolean {
    return !!this.currentMobile && this.currentMobile === this.adminMobile;
  }

  modalDetails: ModalDetails = {
    isOpen: false,
    message: '',
    status: 'info',
    title: 'Output Practice'
  };

  confirmModalDetails: ModalDetails = {
    isOpen: false,
    message: '',
    status: 'warning',
    title: 'Confirm Delete',
    isConfirmation: true,
    confirmText: 'Delete',
    cancelText: 'Cancel'
  };

  questionToDelete: OutputQuestion | null = null;

  private firstNonEmpty(...values: any[]): string {
    for (const v of values) {
      const s = (v ?? '').toString();
      if (s.trim().length > 0) return s;
    }
    return '';
  }

  private fixEncoding(value: unknown): string {
    return (value ?? '')
      .toString()
      .replace(/â€™|â€˜/g, "'")
      .replace(/â€œ|â€/g, '"')
      .replace(/â€“|â€”/g, '-')
      .replace(/â€¦/g, '...')
      .replace(/\u00c2\u00a0/g, ' ')
      .replace(/\u00a0/g, ' ');
  }

  private decodeEscapes(value: unknown): string {
    return (value ?? '')
      .toString()
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t');
  }

  private normalizeDisplayText(value: unknown): string {
    return this.decodeEscapes(this.fixEncoding(value));
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
        const id = item?.id ?? item?._id ?? item?.mcqId ?? item?.questionId;
        const question = this.normalizeDisplayText(
          this.firstNonEmpty(item?.questionText, item?.prompt, item?.question, item?.ques, item?.title)
        ).trim();
        const code = this.normalizeDisplayText(
          this.firstNonEmpty(
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
          )
        );
        const correctAnswerRaw = this.normalizeDisplayText(
          this.firstNonEmpty(item?.correctAnswer, item?.correct_answer, item?.correct)
        );
        const answer = this.normalizeDisplayText(
          this.firstNonEmpty(
            item?.answer,
            item?.output,
            item?.expectedOutput,
            item?.expected,
            // Some APIs send correctAnswer as the expected output.
            item?.correctAnswer
          )
        );

        const optionsRaw = item?.options ?? item?.option ?? item?.choices ?? item?.answers;
        const options = Array.isArray(optionsRaw)
          ? optionsRaw
              .map((o: any) => this.normalizeDisplayText(o))
              .filter((v: string) => v.trim().length > 0)
          : [];
        const topic = this.firstNonEmpty(item?.topic, item?.technology, item?.tech).trim();
        const category = this.firstNonEmpty(item?.category).trim();
        const questionType = this.firstNonEmpty(item?.questionType, item?.question_type, item?.type).trim();
        const level = this.firstNonEmpty(item?.level, item?.difficulty, item?.questionLevel).trim();
        const mobile = this.firstNonEmpty(item?.mobile, item?.createdByMobile, item?.userMobile).trim();
        const admin = (item?.admin ?? item?.isAdmin ?? item?.is_admin);

        // For output-practice we need at least a prompt + expected output.
        // Backend may send expected value in `correctAnswer` (OUTPUTBASEDMCQ).
        if (!question || !answer) return null;

        return {
          id: id ?? undefined,
          question,
          code,
          answer,
          correctAnswer: correctAnswerRaw || undefined,
          options,
          selectedOption: '',
          userAnswer: '',
          topic: topic || undefined,
          category: category || undefined,
          questionType: questionType || undefined,
          level: level || undefined,
          mobile: mobile || undefined,
          admin: typeof admin === 'boolean' ? admin : undefined,
          showAnswer: false,
          mcqChecked: false,
          mcqIsCorrect: null,
          typedChecked: false,
          typedIsCorrect: null,
        } as OutputQuestion;
      })
      .filter(Boolean) as OutputQuestion[];
  }

  getOptionLabel(index: number): string {
    return this.optionLabels[index] ?? '';
  }

  private parseAnswerKeyToIndex(raw: any): number | null {
    const s = (raw ?? '').toString().trim();
    if (!s) return null;

    // Letter keys: A, B, C...
    if (/^[A-Za-z]$/.test(s)) {
      return s.toUpperCase().charCodeAt(0) - 65;
    }

    // Numeric keys: 1,2,3... (assume 1-based)
    if (/^\d+$/.test(s)) {
      const n = Number.parseInt(s, 10);
      if (!Number.isNaN(n) && n > 0) return n - 1;
    }

    return null;
  }

  private getSelectedOptionIndex(q: OutputQuestion): number | null {
    const selected = (q?.selectedOption ?? '').toString();
    if (!selected) return null;
    const idx = (q?.options ?? []).indexOf(selected);
    return idx >= 0 ? idx : null;
  }

  private getCorrectOptionIndex(q: OutputQuestion): number | null {
    const options = q?.options ?? [];
    if (!options.length) return null;

    // Prefer explicit correctAnswer when present.
    const keyFromCorrect = this.parseAnswerKeyToIndex(q.correctAnswer);
    if (keyFromCorrect !== null && keyFromCorrect >= 0 && keyFromCorrect < options.length) {
      return keyFromCorrect;
    }

    // Some payloads store the key in `answer` (e.g., "B").
    const keyFromAnswer = this.parseAnswerKeyToIndex(q.answer);
    if (keyFromAnswer !== null && keyFromAnswer >= 0 && keyFromAnswer < options.length) {
      return keyFromAnswer;
    }

    // Some payloads store the actual option text as answer/correctAnswer.
    const target = (q.correctAnswer ?? q.answer ?? '').toString().trim().toLowerCase();
    if (!target) return null;
    const textIndex = options.findIndex(o => (o ?? '').toString().trim().toLowerCase() === target);
    return textIndex >= 0 ? textIndex : null;
  }

  getMcqCorrectDisplay(q: OutputQuestion): string {
    const idx = this.getCorrectOptionIndex(q);
    if (idx === null) return q.answer;
    const label = this.getOptionLabel(idx);
    const text = (q.options?.[idx] ?? '').toString();
    return label ? `${label}. ${text}` : text;
  }

  private getOwnerMobile(q: any): string {
    const candidates = [
      q?.mobile,
      q?.userMobile,
      q?.mobileNo,
      q?.createdByMobile,
      q?.createdBy?.mobile,
      q?.ownerMobile
    ];
    for (const c of candidates) {
      const v = (c ?? '').toString().trim();
      if (v) return v;
    }
    return '';
  }

  private isPublicQuestion(q: any): boolean {
    // Default is private; only admin-approved questions are public.
    const v = (q?.admin ?? q?.isAdmin ?? q?.is_admin);
    return v === true;
  }

  private canSeeQuestion(q: any): boolean {
    if (this.isAdminUser) return true;

    const current = this.currentMobile;
    if (current) {
      const owner = this.getOwnerMobile(q);
      if (owner && owner === current) return true;
    }

    return this.isPublicQuestion(q);
  }

  canManageMcq(q: OutputQuestion): boolean {
    const current = this.currentMobile;
    if (!current) return false;
    if (this.isAdminUser) return true;
    const owner = this.getOwnerMobile(q);
    if (!owner || owner !== current) return false;

    // Once published (admin:true), only admin can modify.
    const published = (q?.admin ?? (q as any)?.isAdmin ?? (q as any)?.is_admin) === true;
    return !published;
  }

  editQuestion(q: OutputQuestion): void {
    if (!q?.id) return;
    if (!this.canManageMcq(q)) return;

    this.router.navigate(['/interview-qa/editor'], {
      queryParams: {
        id: q.id,
        questionType: q.questionType ?? '',
        source: 'output-practice'
      },
      state: {
        mcqEdit: {
          id: q.id,
          question: q.question,
          code: q.code,
          answer: q.answer,
          options: q.options,
          correctAnswer: q.correctAnswer,
          questionType: q.questionType,
          category: q.category,
          topic: q.topic,
          level: q.level,
          mobile: q.mobile,
        }
      }
    });
  }

  openDeleteConfirm(q: OutputQuestion): void {
    if (!q?.id) return;
    if (!this.canManageMcq(q)) return;

    this.questionToDelete = q;
    this.confirmModalDetails.message = 'Are you sure you want to delete this question? This action cannot be undone.';
    this.confirmModalDetails.isOpen = true;
  }

  confirmDelete(): void {
    const q = this.questionToDelete;
    if (!q?.id) return;

    this.mcqQuestionService
      .deleteMcqQuestion(q.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.questionToDelete = null;
          this.reloadBank();
          this.modalDetails = {
            ...this.modalDetails,
            isOpen: true,
            status: 'success',
            message: 'Question deleted successfully.'
          };
        },
        error: () => {
          this.modalDetails = {
            ...this.modalDetails,
            isOpen: true,
            status: 'error',
            message: 'Error deleting output question.'
          };
        }
      });
  }

  private reloadBank(): void {
    const topic = this.selectedTopic === 'All' ? '' : this.selectedTopic;
    const category = this.category;
    this.isLoadingQuestions = true;

    this.loadQuestionBank$(topic, category)
      .pipe(
        finalize(() => {
          this.isLoadingQuestions = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((qs) => {
        this.questions = (qs || []).filter((q) => this.canSeeQuestion(q));
      });
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
        this.questions = (qs || []).filter((q) => this.canSeeQuestion(q));
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
    this.scrollToSection('question-sets-section');
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
    q.mcqChecked = true;

    const correctIndex = this.getCorrectOptionIndex(q);
    const selectedIndex = this.getSelectedOptionIndex(q);

    // If the backend/admin stored A/B/C/D (or 1/2/3/4), validate by index.
    if (correctIndex !== null && selectedIndex !== null) {
      q.mcqIsCorrect = selectedIndex === correctIndex;
      return;
    }

    // Fallback: validate by exact text match (legacy behavior).
    const expected = this.normalizeOutput(q.answer);
    const actual = this.normalizeOutput(q.selectedOption);
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
    this.scrollToSection('statistics-section');
  }

  showAllQuestions() {
    this.selectedSetCount = null;
    this.scrollToSection('statistics-section');
  }

  private scrollToSection(sectionId: string): void {
    // Scroll to specific section on mobile after a short delay to let the DOM update
    setTimeout(() => {
      if (window.innerWidth < 992) { // Bootstrap's lg breakpoint
        const section = document.getElementById(sectionId);
        if (section) {
          const yOffset = 130 // Add 20px offset from top
          const y = section.getBoundingClientRect().top + window.pageYOffset - yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    }, 100);
  }

  get isSetSelected(): boolean {
    return this.selectedSetCount !== null;
  }

}

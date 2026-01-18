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

  private readonly adminMobile = '9611675325';
  private readonly currentMobile = (readLoginMobile() ?? '').toString().trim();

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
        const correctAnswerRaw = this.firstNonEmpty(item?.correctAnswer, item?.correct_answer, item?.correct);
        const answer = this.firstNonEmpty(
          item?.answer,
          item?.output,
          item?.expectedOutput,
          item?.expected,
          // Some APIs send correctAnswer as the expected output.
          item?.correctAnswer
        );

        const optionsRaw = item?.options ?? item?.option ?? item?.choices ?? item?.answers;
        const options = Array.isArray(optionsRaw)
          ? optionsRaw.map((o: any) => (o ?? '').toString()).filter((v: string) => v.trim().length > 0)
          : [];
        const topic = this.firstNonEmpty(item?.topic, item?.technology, item?.tech).trim();
        const category = this.firstNonEmpty(item?.category).trim();
        const questionType = this.firstNonEmpty(item?.questionType, item?.question_type, item?.type).trim();
        const level = this.firstNonEmpty(item?.level, item?.difficulty, item?.questionLevel).trim();
        const mobile = this.firstNonEmpty(item?.mobile, item?.createdByMobile, item?.userMobile).trim();

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
          showAnswer: false,
          mcqChecked: false,
          mcqIsCorrect: null,
          typedChecked: false,
          typedIsCorrect: null,
        } as OutputQuestion;
      })
      .filter(Boolean) as OutputQuestion[];
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

  canManageMcq(q: OutputQuestion): boolean {
    const current = this.currentMobile;
    if (!current) return false;
    if (current === this.adminMobile) return true;
    const owner = this.getOwnerMobile(q);
    return !!owner && owner === current;
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
        this.questions = qs || [];
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

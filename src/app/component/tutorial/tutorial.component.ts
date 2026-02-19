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
import { jsPDF } from 'jspdf';
import { ImageGeneratorService } from '../../service/image-generator.service';

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
  imageGenerated?: boolean;
  pdfGenerated?: boolean;
  showAnswer: boolean;
  mcqChecked: boolean;
  mcqIsCorrect: boolean | null;
  typedChecked: boolean;
  typedIsCorrect: boolean | null;
};

type OutputSection = 'mcq' | 'typed';

type ImagePreset = {
  label: string;
  width: number;
  height: number;
};

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
    private mcqQuestionService: MCQQuestionService,
    private imageGeneratorService: ImageGeneratorService
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

  get isAdmin(): boolean {
    return this.isAdminUser;
  }

  selectedForPdf: OutputQuestion[] = [];
  selectedForImage: OutputQuestion[] = [];
  isGeneratingPdf = false;
  isGeneratingImage = false;
  pendingImageSelection: OutputQuestion[] = [];

  imagePresets: ImagePreset[] = [
    { label: 'LinkedIn Post (1.91:1 • 1200×627)', width: 1200, height: 627 },
    { label: 'Facebook Post (1.91:1 • 1200×630)', width: 1200, height: 630 },
    { label: 'Instagram Square (1:1 • 1080×1080)', width: 1080, height: 1080 },
    { label: 'Instagram Story (9:16 • 1080×1920)', width: 1080, height: 1920 },
    { label: 'YouTube Shorts (9:16 • 1080×1920)', width: 1080, height: 1920 },
    { label: 'YouTube Video (16:9 • 1920×1080)', width: 1920, height: 1080 }
  ];
  selectedImagePreset: ImagePreset = this.imagePresets[0];
  isSelectedForImage(q: OutputQuestion): boolean {
    const key = (v: any) => (v ?? '').toString();
    const idKey = key(q?.id);
    const persisted = idKey ? !!q?.imageGenerated : false;
    const pending = this.selectedForImage.some((x) => {
      const xId = key(x?.id);
      if (idKey && xId) return xId === idKey;
      return (x?.question ?? '') === (q?.question ?? '');
    });
    return persisted || pending;
  }

  toggleImageSelection(q: OutputQuestion, event: Event): void {
    event.stopPropagation();
    if (!this.isAdminUser) return;

    const key = (v: any) => (v ?? '').toString();
    const idKey = key(q?.id);
    const idx = this.selectedForImage.findIndex((x) => {
      const xId = key(x?.id);
      if (idKey && xId) return xId === idKey;
      return (x?.question ?? '') === (q?.question ?? '');
    });

    if (idx >= 0) this.selectedForImage.splice(idx, 1);
    else this.selectedForImage.push(q);
  }

  clearImageSelection(): void {
    this.selectedForImage = [];
  }

  generateImage(): void {
    const selected = [...this.activeQuestions];
    if (!selected.length) return;

    this.isGeneratingImage = true;
    setTimeout(async () => {
      try {
        await this.buildSelectedImages(selected);
        selected.forEach((q) => {
          const idKey = (q?.id ?? '').toString();
          if (idKey) q.imageGenerated = true;
        });
      } finally {
        this.isGeneratingImage = false;
        this.pendingImageSelection = [];
        this.confirmImageModalDetails.isOpen = false;
      }
    }, 0);
  }

  // Use shared ImageGeneratorService for image generation
  private async buildSelectedImages(questions: OutputQuestion[]): Promise<void> {
    const preset = this.selectedImagePreset ?? this.imagePresets[0];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      try {
        const url = await this.imageGeneratorService.generateQuestionImage(
          q,
          q.options && q.options.length ? 'mcq' : 'qa',
          q.topic || this.selectedTopic || 'Output Practice',
          i + 1,
          { width: preset.width, height: preset.height }
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = `output-q${i + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to generate image for question', q, err);
        this.modalDetails = {
          ...this.modalDetails,
          isOpen: true,
          status: 'error',
          message: `Failed to generate image for Q${i + 1}.`
        };
      }
    }
    this.modalDetails = {
      ...this.modalDetails,
      isOpen: true,
      status: 'success',
      message: `Generated ${questions.length} image(s). Downloads should start automatically.`
    };
  }

  // escapeHtml no longer needed; using service for rendering

  modalDetails: ModalDetails = {
    isOpen: false,
    message: '',
    status: 'info',
    title: 'Output Practice'
  };

  confirmImageModalDetails: ModalDetails = {
    isOpen: false,
    message: '',
    status: 'warning',
    title: 'Confirm Image Generation',
    isConfirmation: true,
    confirmText: 'Generate',
    cancelText: 'Cancel'
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
        const imageGenerated = this.toBoolFlag(
          item?.imageGenerated ??
          item?.image_generated ??
          item?.imagegenerated ??
          item?.imagegeneratedd ??
          item?.imageStatus ??
          item?.image_status ??
          item?.image_flag ??
          item?.image_done
        );
        const pdfGenerated = this.toBoolFlag(
          item?.pdfGenerated ??
          item?.pdf_generated ??
          item?.pdfgenerated ??
          item?.pdfgeneratedd ??
          item?.pdfStatus ??
          item?.pdf_status ??
          item?.pdf_flag ??
          item?.pdf_done
        );

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
          imageGenerated,
          pdfGenerated,
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

  getQuestionLines(question: string): string[] {
    const text = this.normalizeDisplayText(question ?? '').trim();
    if (!text) return [];

    if (text.includes('\n')) {
      return text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);
    }

    const parts = text
      .split(/(?<=;)\s*/)
      .map(part => part.trim())
      .filter(Boolean);

    return parts.length ? parts : [text];
  }

  private toBoolFlag(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (value === null || value === undefined) return false;
    const str = value.toString().trim().toLowerCase();
    if (!str) return false;
    return ['true', '1', 'yes', 'y', 'generated', 'done', 'completed'].includes(str);
  }

  private markGenerationStatus(q: OutputQuestion, changes: { imageGenerated?: boolean; pdfGenerated?: boolean }): void {
    // API calls removed per request; keep local state in sync only.
    const idKey = (q?.id ?? '').toString().trim();
    if (!idKey) return;

    const payload: Partial<OutputQuestion> = {};
    if (changes.imageGenerated !== undefined) payload.imageGenerated = changes.imageGenerated;
    if (changes.pdfGenerated !== undefined) payload.pdfGenerated = changes.pdfGenerated;

    const sync = (list: OutputQuestion[]) => {
      const idx = list.findIndex((x) => (x?.id ?? '').toString() === idKey);
      if (idx >= 0) list[idx] = { ...list[idx], ...payload };
    };
    sync(this.questions);
    sync(this.selectedForImage);
    sync(this.selectedForPdf);
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

  private sliceBySelectedSet(list: OutputQuestion[]): OutputQuestion[] {
    if (this.selectedSetCount === null) return list;
    return list.slice(0, this.selectedSetCount);
  }

  private get allMcqQuestions(): OutputQuestion[] {
    return this.questions.filter(q => (q.options?.length ?? 0) > 0);
  }

  private get allTypedQuestions(): OutputQuestion[] {
    // Typed tab is for OUTPUTBASED questions (answer-type). Code may be missing depending on backend payload.
    return this.questions.filter(q =>
      (q.options?.length ?? 0) === 0 &&
      (q.questionType ?? '').toString().trim().toUpperCase() === this.typedOutputQuestionType
    );
  }

  get mcqQuestions(): OutputQuestion[] {
    return this.sliceBySelectedSet(this.allMcqQuestions);
  }

  get typedQuestions(): OutputQuestion[] {
    return this.sliceBySelectedSet(this.allTypedQuestions);
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

  isSelectedForPdf(q: OutputQuestion): boolean {
    const key = (v: any) => (v ?? '').toString();
    const idKey = key(q?.id);
    if (q?.pdfGenerated === true) return true;
    if (idKey) return this.selectedForPdf.some((x) => key(x?.id) === idKey);
    return this.selectedForPdf.some((x) => (x?.question ?? '') === (q?.question ?? ''));
  }

  togglePdfSelection(q: OutputQuestion, event: Event): void {
    event.stopPropagation();
    if (!this.isAdminUser) return;
    if (q?.pdfGenerated === true) return;

    const key = (v: any) => (v ?? '').toString();
    const idKey = key(q?.id);
    const idx = this.selectedForPdf.findIndex((x) => {
      const xId = key(x?.id);
      if (idKey && xId) return xId === idKey;
      return (x?.question ?? '') === (q?.question ?? '');
    });

    if (idx >= 0) this.selectedForPdf.splice(idx, 1);
    else this.selectedForPdf.push(q);
  }

  clearPdfSelection(): void {
    this.selectedForPdf = [];
  }

  generatePdf(): void {
    const selected = [...this.activeQuestions];
    if (!selected.length) return;

    this.isGeneratingPdf = true;
    setTimeout(() => {
      try {
        this.buildSelectedPdf(selected);
        selected.forEach((q) => {
          const idKey = (q?.id ?? '').toString();
          if (idKey) q.pdfGenerated = true;
        });
      } finally {
        this.isGeneratingPdf = false;
      }
    }, 0);
  }

  private buildSelectedPdf(questions: OutputQuestion[]): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    const lineHeightFor = (size: number) => Math.round(size * 1.4);
    const drawRounded = (x: number, yPos: number, w: number, h: number, radius = 10) => {
      const anyDoc = doc as any;
      if (typeof anyDoc.roundedRect === 'function') anyDoc.roundedRect(x, yPos, w, h, radius, radius, 'FD');
      else doc.rect(x, yPos, w, h, 'FD');
    };

    const brand = { r: 29, g: 78, b: 216 };
    const neutral = { r: 15, g: 23, b: 42 };
    const questionColor = { r: 30, g: 64, b: 175 };
    const answerColor = { r: 217, g: 119, b: 6 };

    // Header
    doc.setFillColor(brand.r, brand.g, brand.b);
    doc.rect(0, 0, pageWidth, 86, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('CareerPrepBook.Com', margin, 36);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Output Practice — Selected Questions', margin, 56);

    let y = 108;
    doc.setTextColor(neutral.r, neutral.g, neutral.b);

    // Topic badge + stats
    const topicText = this.selectedTopic === 'All' ? 'All Topics' : this.selectedTopic;
    const sectionText = this.activeSection === 'mcq' ? 'MCQ' : 'Type Answer';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const badgeText = `Topic: ${topicText}`;
    const badgeWidth = doc.getTextWidth(badgeText) + 18;
    doc.setFillColor(224, 231, 255);
    doc.setTextColor(30, 64, 175);
    drawRounded(margin, y - 14, badgeWidth, 22, 11);
    doc.text(badgeText, margin + 9, y + 1);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Section: ${sectionText}`, margin + badgeWidth + 14, y + 1);
    doc.text(`Selected: ${questions.length}`, pageWidth - margin - 120, y + 1);
    y += 20;

    const wrapLines = (text: string, fontSize: number, font: string, style: 'normal' | 'bold' | 'italic', width = contentWidth) => {
      doc.setFont(font, style);
      doc.setFontSize(fontSize);
      return doc.splitTextToSize(text || '', width) as string[];
    };

    const addLines = (lines: string[], x: number, yPos: number, font: string, style: 'normal' | 'bold' | 'italic', fontSize: number) => {
      doc.setFont(font, style);
      doc.setFontSize(fontSize);
      const lh = lineHeightFor(fontSize);
      for (const line of lines) {
        doc.text(line, x, yPos);
        yPos += lh;
      }
      return yPos;
    };

    const cardGap = 12;
    const cardPadding = 14;
    const footerReserve = 110;
    const sectionSpacing = 10;

    questions.forEach((q, index) => {
      const questionText = this.normalizeDisplayText(q?.question ?? '');
      const codeText = this.normalizeDisplayText(q?.code ?? '');
      const answerText = (q?.options?.length ?? 0) > 0 ? this.getMcqCorrectDisplay(q) : this.normalizeDisplayText(q?.answer ?? '');

      const questionLines = wrapLines(`Q${index + 1}. ${questionText}`, 11, 'helvetica', 'bold');
      const codeLines = codeText
        ? wrapLines('Code:', 9, 'helvetica', 'bold').concat(wrapLines(codeText, 9, 'courier', 'normal'))
        : [];
      const optionLines = (q?.options?.length ?? 0) > 0
        ? wrapLines('Options:', 9, 'helvetica', 'bold').concat(
            (q.options || []).flatMap((opt, i) => wrapLines(`${this.getOptionLabel(i)}. ${this.normalizeDisplayText(opt)}`, 9, 'helvetica', 'normal'))
          )
        : [];
      const answerLines = answerText ? wrapLines(`Correct Output: ${this.normalizeDisplayText(answerText)}`, 10, 'helvetica', 'normal') : [];

      const blockHeight = [
        questionLines.length * lineHeightFor(11),
        codeLines.length * lineHeightFor(9),
        optionLines.length * lineHeightFor(9),
        answerLines.length * lineHeightFor(10),
      ].reduce((a, b) => a + b, 0)
        + cardPadding * 2
        + (codeLines.length ? sectionSpacing : 0)
        + (optionLines.length ? sectionSpacing : 0)
        + (answerLines.length ? sectionSpacing : 0);

      if (y + blockHeight > pageHeight - margin - footerReserve) {
        doc.addPage();
        y = margin;
      }

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      drawRounded(margin, y, contentWidth, blockHeight, 12);

      let yCursor = y + cardPadding;
      doc.setTextColor(questionColor.r, questionColor.g, questionColor.b);
      yCursor = addLines(questionLines, margin + cardPadding, yCursor, 'helvetica', 'bold', 11);

      if (codeLines.length) {
        yCursor += sectionSpacing;
        doc.setTextColor(neutral.r, neutral.g, neutral.b);
        yCursor = addLines(codeLines, margin + cardPadding, yCursor, 'courier', 'normal', 9);
      }

      if (optionLines.length) {
        yCursor += sectionSpacing;
        doc.setTextColor(neutral.r, neutral.g, neutral.b);
        yCursor = addLines(optionLines, margin + cardPadding, yCursor, 'helvetica', 'normal', 9);
      }

      if (answerLines.length) {
        yCursor += sectionSpacing;
        doc.setTextColor(answerColor.r, answerColor.g, answerColor.b);
        yCursor = addLines(answerLines, margin + cardPadding, yCursor, 'helvetica', 'normal', 10);
      }

      y += blockHeight + cardGap;
    });

    // Footer with page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i += 1) {
      doc.setPage(i);
      const pageLabel = `${i}/${totalPages}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(i === 1 ? 255 : 100, i === 1 ? 255 : 116, i === 1 ? 255 : 139);
      const textWidth = doc.getTextWidth(pageLabel);
      doc.text(pageLabel, pageWidth - margin - textWidth, i === 1 ? 22 : pageHeight - 22);
    }

    const date = new Date().toISOString().split('T')[0];
    doc.save(`careerprepbook-output-${topicText.replace(/\s+/g, '-').toLowerCase()}-${date}.pdf`);
  }

}

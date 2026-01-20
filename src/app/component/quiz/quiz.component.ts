import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { apiFallback, apiEmpty } from '../../util/apiRx';
import { MCQQuestionService } from '../../service/mcqQuestion.service';
import { QuizAttemptService, QuizAttempt } from '../../service/quiz-attempt.service';
import { FormsModule } from '@angular/forms';
import { readLoginMobile } from '../../util/loginStorage';
import { ModalComponent, ModalDetails } from '../modal/modal.component';

type QuizQuestion = {
  id?: string | number;
  question: string;
  options: string[];
  correct: number;
  correctAnswer?: string;
  topic?: string;
  category?: string;
  questionType?: string;
  level?: string;
  code?: string;
  answer?: string;
  mobile?: string;
  admin?: boolean;
};

type ChatMessage = {
  from: 'bot' | 'user';
  text: string;
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
};

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
})
export class QuizComponent implements OnInit, OnDestroy {
  quizStarted = false;
  isLoadingQuestions = false;
  displayQuestions: QuizQuestion[] = [];
  answeredOptions: Array<number | null> = [];
  visited: boolean[] = [];
  correctCount = 0;
  wrongCount = 0;
  unattemptedCount = 0;
  quizPlans = [
    { title: 'Quick Set', description: 'Test yourself with 5 questions', count: 5 },
    { title: 'Challenge Set', description: 'Go deeper with 10 questions', count: 10 },
    { title: 'Ultimate Set', description: 'Full challenge with 15 questions', count: 15 },
    { title: 'Pro Set', description: 'Advanced practice with 25 questions', count: 25 },
    { title: 'Expert Set', description: 'Master level with 35 questions', count: 35 },
    { title: 'Champion Set', description: 'Challenge yourself with 50 questions', count: 50 },
    { title: 'Elite Set', description: 'Elite preparation with 75 questions', count: 75 },
    { title: 'Master Set', description: 'Complete mastery with 100 questions', count: 100 }
  ];
  selectedPlan: any = null;
  careerPrepBookInfo = {
    title: 'CareerPrepBook',
    description: 'Boost your tech career with curated quizzes, interview prep, and learning resources. Join thousands of successful candidates who started here!'
  };

  constructor(
    private activeRouter: ActivatedRoute,
    private mcqQuestionService: MCQQuestionService,
    private quizAttemptService: QuizAttemptService,
    private router: Router
  ) { }
  private destroy$ = new Subject<void>();
  topic = '';
  category = '';

  private readonly currentMobile = (readLoginMobile() ?? '').toString().trim();
  private readonly adminMobile = '9611675325';

  private get isAdminUser(): boolean {
    return !!this.currentMobile && this.currentMobile === this.adminMobile;
  }

  modalDetails: ModalDetails = {
    isOpen: false,
    message: '',
    status: 'info',
    title: 'Quiz'
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

  questionToDelete: QuizQuestion | null = null;

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

  canManageMcq(q: QuizQuestion): boolean {
    const current = this.currentMobile;
    if (!current) return false;
    if (this.isAdminUser) return true;
    const owner = this.getOwnerMobile(q);
    if (!owner || owner !== current) return false;

    // Once published (admin:true), only admin can modify.
    const published = (q?.admin ?? (q as any)?.isAdmin ?? (q as any)?.is_admin) === true;
    return !published;
  }

  editQuestion(q: QuizQuestion): void {
    if (!q?.id) return;
    if (!this.canManageMcq(q)) return;

    this.router.navigate(['/interview-qa/editor'], {
      queryParams: {
        id: q.id,
        questionType: q.questionType ?? 'MCQ',
        source: 'quiz'
      },
      state: {
        mcqEdit: {
          id: q.id,
          question: q.question,
          options: q.options,
          // Preserve these if present so the editor can pre-fill category/topic/level.
          topic: q.topic,
          category: q.category,
          level: q.level,
          questionType: q.questionType ?? 'MCQ',
          code: q.code,
          answer: q.answer,
          mobile: q.mobile,
        }
      }
    });
  }

  openDeleteConfirm(q: QuizQuestion): void {
    if (!q?.id) return;
    if (!this.canManageMcq(q)) return;
    this.questionToDelete = q;
    this.confirmModalDetails.message = 'Are you sure you want to delete this question? This action cannot be undone.';
    this.confirmModalDetails.isOpen = true;
  }

  confirmDelete(): void {
    const q = this.questionToDelete;
    if (!q) return;
    if (q.id === undefined || q.id === null) return;

    const deletedId: string | number = q.id;

    this.mcqQuestionService
      .deleteMcqQuestion(q.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.questionToDelete = null;
          this.confirmModalDetails = {
            ...this.confirmModalDetails,
            isOpen: false,
          };

          // Update UI immediately (avoid requiring full page refresh).
          this.removeDeletedFromUi(deletedId);

          // Then sync from backend.
          this.loadQuestionBank();
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
            message: 'Error deleting question.'
          };
        }
      });
  }

  private removeDeletedFromUi(deletedId: string | number): void {
    const key = (v: any) => (v ?? '').toString();
    const idKey = key(deletedId);

    // Prefer removing from the current displayed set (active quiz).
    const usingDisplay = this.displayQuestions.length > 0;
    const list = usingDisplay ? this.displayQuestions : this.questions;
    const idx = list.findIndex((item) => key(item?.id) === idKey);
    if (idx < 0) return;

    if (usingDisplay) {
      this.displayQuestions = [...this.displayQuestions.slice(0, idx), ...this.displayQuestions.slice(idx + 1)];
    } else {
      this.questions = [...this.questions.slice(0, idx), ...this.questions.slice(idx + 1)];
    }

    if (this.quizStarted) {
      if (idx >= 0 && idx < this.answeredOptions.length) this.answeredOptions.splice(idx, 1);
      if (idx >= 0 && idx < this.visited.length) this.visited.splice(idx, 1);

      if (this.currentIndex >= this.questionsToShow.length) {
        this.currentIndex = Math.max(0, this.questionsToShow.length - 1);
      }
      this.selectedOption = this.answeredOptions[this.currentIndex] ?? null;
    }
  }

  private normalizeKey(value: string): string {
    return (value || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  private normalizeMcqQuestions(data: any): QuizQuestion[] {
    if (!Array.isArray(data)) return [];

    const normalized = data
      .map((item: any) => {
        const id = item?.id ?? item?._id ?? item?.mcqId ?? item?.questionId;
        const question = (item?.question ?? item?.ques ?? item?.title ?? '').toString().trim();
        const optionsRaw = item?.options ?? item?.option ?? item?.choices ?? item?.answers;
        const options = Array.isArray(optionsRaw)
          ? optionsRaw.map((o: any) => String(o))
          : [item?.optionA, item?.optionB, item?.optionC, item?.optionD]
              .map((o: any) => (o ?? '').toString())
              .filter((v: string) => v.trim().length > 0);

        const topic = (item?.topic ?? item?.technology ?? item?.category ?? item?.tag ?? item?.subject ?? '').toString().trim();
        const category = (item?.category ?? item?.categoryId ?? item?.categoryName ?? '').toString().trim();
        const level = (item?.level ?? item?.difficulty ?? item?.questionLevel ?? '').toString().trim();
        const questionType = (item?.questionType ?? item?.type ?? 'MCQ').toString().trim();
        const mobile = (item?.mobile ?? item?.createdByMobile ?? item?.userMobile ?? '').toString().trim();
        const admin = (item?.admin ?? item?.isAdmin ?? item?.is_admin);

        let correct: number | undefined;
        
        // Priority 1: Check correctAnswer field (most common in API)
        if (item?.correctAnswer !== undefined && item?.correctAnswer !== null) {
          if (typeof item.correctAnswer === 'number') {
            correct = item.correctAnswer;
          } else if (typeof item.correctAnswer === 'string') {
            const correctStr = item.correctAnswer.toString().trim().toUpperCase();
            // Check if it's a letter (A, B, C, D, etc.)
            if (correctStr.length === 1 && correctStr >= 'A' && correctStr <= 'Z') {
              correct = correctStr.charCodeAt(0) - 'A'.charCodeAt(0);
            }
            // Otherwise try finding exact match in options
            else {
              correct = options.findIndex(o => o === item.correctAnswer);
            }
          }
        }
        // Priority 2: Check correctIndex field
        else if (typeof item?.correctIndex === 'number') {
          correct = item.correctIndex;
        }
        // Priority 3: Check answerIndex field
        else if (typeof item?.answerIndex === 'number') {
          correct = item.answerIndex;
        }
        // Priority 4: Check answer field
        else if (item?.answer !== undefined && item?.answer !== null) {
          if (typeof item.answer === 'number') {
            correct = item.answer;
          } else if (typeof item.answer === 'string') {
            const answerStr = item.answer.toString().trim().toUpperCase();
            // Check if it's a letter (A, B, C, D, etc.)
            if (answerStr.length === 1 && answerStr >= 'A' && answerStr <= 'Z') {
              correct = answerStr.charCodeAt(0) - 'A'.charCodeAt(0);
            }
            // Otherwise try finding exact match in options
            else {
              correct = options.findIndex(o => o === item.answer);
            }
          } else if (typeof item.answer === 'object' && item.answer !== null && typeof item.answer.value === 'string') {
            correct = options.findIndex(o => o === item.answer.value);
          }
        }

        if (!question || options.length < 2) return null;

        // If we couldn't infer, default to first option (keeps UI usable)
        if (typeof correct !== 'number' || Number.isNaN(correct) || correct < 0 || correct >= options.length) {
          correct = 0;
        }

        return {
          id: id ?? undefined,
          question,
          options,
          correct,
          correctAnswer: (item?.correctAnswer ?? item?.correct_answer ?? item?.correct ?? '').toString().trim() || undefined,
          topic: topic || undefined,
          category: category || undefined,
          level: level || undefined,
          questionType: questionType || undefined,
          mobile: mobile || undefined,
          admin: typeof admin === 'boolean' ? admin : undefined,
        };
      })
      .filter(Boolean) as QuizQuestion[];

    return normalized;
  }

  startQuiz(plan: any) {
    this.selectedPlan = plan;
    this.quizStarted = true;

    // Load only the number of questions for the selected plan.
    const available = this.topicFilteredQuestions;
    this.displayQuestions = available.slice(0, plan.count);

    // If the plan asks for more than we have, still show what we have.
    // UI will handle empty state if zero.
    this.currentIndex = 0;
    this.score = 0;
    this.showResult = false;
    this.selectedOption = null;

    this.correctCount = 0;
    this.wrongCount = 0;
    this.unattemptedCount = 0;

    this.answeredOptions = new Array(this.displayQuestions.length).fill(null);
    this.visited = new Array(this.displayQuestions.length).fill(false);

    // Scroll to quiz section on mobile after a short delay to let the DOM update
    setTimeout(() => {
      if (window.innerWidth < 992) { // Bootstrap's lg breakpoint
        const quizSection = document.querySelector('.quiz-active-card');
        if (quizSection) {
          const yOffset = -180; // Add 20px offset from top
          const y = quizSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    }, 100);
  }

  ngOnInit(): void {
    this.activeRouter.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.topic = (params?.['topic'] ?? '').toString().trim();
      this.category = (params?.['category'] ?? '').toString().trim();

      // If user navigates to a different topic while already on the quiz route,
      // reset plan selection so the next run uses the new topic question bank.
      if (this.quizStarted) {
        this.reload();
      }

      this.loadQuestionBank();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  questions: QuizQuestion[] = [];

  private loadQuestionBank(): void {
    this.isLoadingQuestions = true;

    this.mcqQuestionService
      .getAllMcq({ topic: this.topic, category: this.category, questionType: 'MCQ' })
      .pipe(
        apiFallback<any[]>([], 'Error loading quiz questions from service'),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        const normalized = this.normalizeMcqQuestions(data);
        this.questions = (normalized ?? []).filter((q) => this.canSeeQuestion(q));

        // If user already picked a plan, refresh the sliced questions.
        if (this.quizStarted && this.selectedPlan?.count) {
          const prevDisplay = this.displayQuestions;
          const prevAnswered = this.answeredOptions;
          const prevVisited = this.visited;
          const prevCurrentId = prevDisplay?.[this.currentIndex]?.id;

          const byId = (id: any) => (id ?? '').toString();
          const answeredById = new Map<string, number | null>();
          const visitedById = new Map<string, boolean>();
          for (let i = 0; i < (prevDisplay?.length ?? 0); i++) {
            const id = byId(prevDisplay[i]?.id);
            if (!id) continue;
            answeredById.set(id, prevAnswered?.[i] ?? null);
            visitedById.set(id, prevVisited?.[i] ?? false);
          }

          const available = this.topicFilteredQuestions;
          this.displayQuestions = available.slice(0, this.selectedPlan.count);

          this.answeredOptions = this.displayQuestions.map((qq) => {
            const id = byId(qq?.id);
            return id ? (answeredById.get(id) ?? null) : null;
          });
          this.visited = this.displayQuestions.map((qq) => {
            const id = byId(qq?.id);
            return id ? (visitedById.get(id) ?? false) : false;
          });

          if (this.displayQuestions.length === 0) {
            this.currentIndex = 0;
            this.selectedOption = null;
          } else {
            const prevIdKey = byId(prevCurrentId);
            const nextIndex = prevIdKey
              ? this.displayQuestions.findIndex((qq) => byId(qq?.id) === prevIdKey)
              : -1;

            if (nextIndex >= 0) {
              this.currentIndex = nextIndex;
            } else if (this.currentIndex >= this.displayQuestions.length) {
              this.currentIndex = this.displayQuestions.length - 1;
            }

            this.selectedOption = this.answeredOptions[this.currentIndex] ?? null;
          }
        }

        this.isLoadingQuestions = false;
      });
  }

  currentIndex = 0;
  selectedOption: number | null = null;
  score = 0;
  showResult = false;

  selectOption(index: number) {
    this.selectedOption = index;
    // Mark as attended
    if (this.quizStarted && this.questionsToShow.length > 0) {
      this.answeredOptions[this.currentIndex] = index;
      this.visited[this.currentIndex] = true;
    }
  }

  goToQuestion(index: number) {
    if (!this.quizStarted) return;
    if (index < 0 || index >= this.questionsToShow.length) return;
    this.currentIndex = index;
    this.selectedOption = this.answeredOptions[index];
    this.visited[index] = true;
  }

  get attendedCount(): number {
    return this.answeredOptions.filter(v => v !== null).length;
  }

  get notAttendedCount(): number {
    return Math.max(0, this.questionsToShow.length - this.attendedCount);
  }

  userAnswerText(index: number): string {
    const q = this.questionsToShow[index];
    const ansIndex = this.answeredOptions[index];
    if (!q || ansIndex === null || ansIndex === undefined) return 'Not answered';
    return q.options[ansIndex] ?? 'Not answered';
  }

  correctAnswerText(index: number): string {
    const q = this.questionsToShow[index];
    if (!q) return '';
    return q.options[q.correct] ?? '';
  }

  optionLabel(index: number): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return alphabet[index] ?? `${index + 1}`;
  }

  answerStatus(index: number): 'Correct' | 'Wrong' | 'Unanswered' {
    const q = this.questionsToShow[index];
    const ansIndex = this.answeredOptions[index];
    if (!q || ansIndex === null || ansIndex === undefined) return 'Unanswered';
    return ansIndex === q.correct ? 'Correct' : 'Wrong';
  }

  private computeResultBreakdown() {
    const list = this.questionsToShow;
    const total = list.length;
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    for (let i = 0; i < total; i++) {
      const ans = this.answeredOptions[i];
      if (ans === null || ans === undefined) {
        unattempted++;
        continue;
      }
      if (ans === list[i]?.correct) correct++;
      else wrong++;
    }

    this.correctCount = correct;
    this.wrongCount = wrong;
    this.unattemptedCount = unattempted;
    this.score = correct;
  }

  private persistAttempt(): void {
    const total = this.totalQuestions;
    if (!total) return;

    const attempt: QuizAttempt = {
      createdAt: new Date().toISOString(),
      topic: this.topic || undefined,
      planTitle: this.selectedPlan?.title ?? undefined,
      total,
      correct: this.correctCount,
      wrong: this.wrongCount,
      unattempted: this.unattemptedCount,
      percent: Math.round((this.correctCount / total) * 100),
      showResult: true,
    };

    this.quizAttemptService.saveAttempt(attempt)
      .pipe(
        apiEmpty('Error saving quiz attempt'),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  get totalQuestions(): number {
    return this.questionsToShow.length;
  }

  get correctPercent(): number {
    return this.totalQuestions ? Math.round((this.correctCount / this.totalQuestions) * 100) : 0;
  }

  get wrongPercent(): number {
    return this.totalQuestions ? Math.round((this.wrongCount / this.totalQuestions) * 100) : 0;
  }

  get unattemptedPercent(): number {
    return this.totalQuestions ? Math.max(0, 100 - this.correctPercent - this.wrongPercent) : 0;
  }

  get resultChartStyle(): { [key: string]: string } {
    const c = this.correctPercent;
    const w = this.wrongPercent;
    const cw = Math.min(100, c + w);

    return {
      // Use a more visible neutral for unattempted so the chart doesn't blend into card borders.
      background: `conic-gradient(#16a34a 0 ${c}%, #ef4444 ${c}% ${cw}%, #94a3b8 ${cw}% 100%)`,
    };
  }

  private get topicFilteredQuestions(): QuizQuestion[] {
    const topicKey = this.normalizeKey(this.topic);
    if (!topicKey) return this.questions;

    const filtered = (this.questions || []).filter((q) => {
      const qTopicKey = this.normalizeKey(q?.topic ?? '');
      return qTopicKey && qTopicKey === topicKey;
    });

    // If we don't have topic-tagged questions, fall back to the full bank.
    return filtered.length > 0 ? filtered : this.questions;
  }

  get questionsToShow() {
    const base = this.displayQuestions.length > 0 ? this.displayQuestions : this.topicFilteredQuestions;
    return base;
  }

  // ...existing code...
    nextQuestion() {
      this.selectedOption = null;
      if (this.currentIndex < this.questionsToShow.length - 1) {
        this.currentIndex++;
        this.selectedOption = this.answeredOptions[this.currentIndex];
      } else {
        this.computeResultBreakdown();
        this.persistAttempt();
        this.showResult = true;
        this.generateChatResult();
      }
    }

    chatMessages: ChatMessage[] = [];
    generateChatResult() {
      const total = this.questionsToShow.length;
      if (!total) {
        this.chatMessages = [
          { from: 'bot', text: 'No questions were attempted in this run. Please try another plan.', tone: 'neutral' },
        ];
        return;
      }

      const percent = Math.round((this.score / total) * 100);
      const topicText = (this.topic || '').toString().trim();
      const title = topicText ? `${topicText} Quiz` : 'Quiz';

      let tone: ChatMessage['tone'] = 'neutral';
      let coaching = 'Try a shorter plan and focus on fundamentals.';

      if (percent >= 80) {
        tone = 'success';
        coaching = 'Excellent accuracy—try the bigger plan next.';
      } else if (percent >= 50) {
        tone = 'warning';
        coaching = 'Good progress—review wrong answers and try again.';
      } else {
        tone = 'danger';
        coaching = 'Don’t worry—review the basics and retake this topic.';
      }

      this.chatMessages = [
        { from: 'bot', text: `Nice work finishing the ${title}.`, tone: 'neutral' },
        {
          from: 'bot',
          text: `Score: ${this.score}/${total} (${percent}%). Correct ${this.correctCount}, Wrong ${this.wrongCount}, Unattempted ${this.unattemptedCount}.`,
          tone,
        },
        { from: 'bot', text: coaching, tone },
        { from: 'bot', text: 'Tip: open Interview Q&A for the same topic and practice 10 minutes daily.', tone: 'neutral' },
      ];
    }

  reload() {
    this.showResult = false;
    this.currentIndex = 0;
    this.selectedOption = null;
    this.score = 0;
    this.quizStarted = false;
    this.displayQuestions = [];
    this.selectedPlan = null;
    this.chatMessages = [];
    this.answeredOptions = [];
    this.visited = [];
    this.correctCount = 0;
    this.wrongCount = 0;
    this.unattemptedCount = 0;
  }

  backToPlans() {
    this.reload();
  }
}

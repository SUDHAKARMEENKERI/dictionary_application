import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { finalize, map, takeUntil } from 'rxjs/operators';
import { MCQQuestionService } from '../../service/mcqQuestion.service';
import { apiFallback } from '../../util/apiRx';
import { isUserAdmin, readLoginMobile } from '../../util/loginStorage';
import { ModalComponent, ModalDetails } from '../modal/modal.component';

type MyQuestionTab = 'quiz' | 'output';

type MyQuestion = {
  id?: string | number;
  question: string;
  code?: string;
  answer?: string;
  options: string[];
  correctAnswer?: string;
  questionType: string;
  topic?: string;
  category?: string;
  level?: string;
  mobile?: string;
  admin?: boolean;
};

@Component({
  selector: 'app-my-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './my-questions.component.html',
  styleUrls: ['./my-questions.component.scss'],
})
export class MyQuestionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  activeTab: MyQuestionTab = 'quiz';

  readonly currentMobile = (readLoginMobile() ?? '').toString().trim();
  readonly isAdminUser = isUserAdmin();

  // For admins, default to showing only their own questions (matches requirement).
  showOnlyMine = !this.isAdminUser;

  isLoading = false;

  quizQuestions: MyQuestion[] = [];
  outputMcqQuestions: MyQuestion[] = [];
  outputTypedQuestions: MyQuestion[] = [];

  modalDetails: ModalDetails = {
    isOpen: false,
    message: '',
    status: 'info',
    title: 'My Questions'
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

  questionToDelete: MyQuestion | null = null;

  constructor(
    private mcqQuestionService: MCQQuestionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: MyQuestionTab): void {
    this.activeTab = tab;
  }

  private firstNonEmpty(...values: any[]): string {
    for (const v of values) {
      const s = (v ?? '').toString();
      if (s.trim().length > 0) return s;
    }
    return '';
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

  canManage(q: MyQuestion): boolean {
    if (!this.currentMobile) return false;
    if (this.isAdminUser) return true;
    const owner = this.getOwnerMobile(q);
    if (!owner || owner !== this.currentMobile) return false;

    // Once published (admin:true), only admin can modify.
    const published = (q?.admin ?? (q as any)?.isAdmin ?? (q as any)?.is_admin) === true;
    return !published;
  }

  private shouldShow(q: MyQuestion): boolean {
    if (!this.isAdminUser) {
      return this.getOwnerMobile(q) === this.currentMobile;
    }

    if (this.showOnlyMine) {
      return this.getOwnerMobile(q) === this.currentMobile;
    }

    return true;
  }

  private normalizeList(data: any): any[] {
    if (Array.isArray(data)) return data;
    const list = data?.data ?? data?.result ?? data?.items ?? data?.content ?? [];
    return Array.isArray(list) ? list : [];
  }

  private normalizeQuestions(data: any, defaultQuestionType: string): MyQuestion[] {
    const list = this.normalizeList(data);

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
        ).trim();

        const answer = this.firstNonEmpty(item?.answer, item?.output, item?.expectedOutput, item?.expected).trim();

        const optionsRaw = item?.options ?? item?.option ?? item?.choices ?? item?.answers;
        const options = Array.isArray(optionsRaw)
          ? optionsRaw.map((o: any) => (o ?? '').toString()).filter((v: string) => v.trim().length > 0)
          : [item?.optionA, item?.optionB, item?.optionC, item?.optionD]
              .map((o: any) => (o ?? '').toString())
              .filter((v: string) => v.trim().length > 0);

        const correctAnswer = this.firstNonEmpty(item?.correctAnswer, item?.correct_answer, item?.correct).trim();

        const topic = this.firstNonEmpty(item?.topic, item?.technology, item?.tech).trim();
        const category = this.firstNonEmpty(item?.category, item?.categoryId, item?.categoryName).trim();
        const questionType = this.firstNonEmpty(item?.questionType, item?.question_type, item?.type).trim() || defaultQuestionType;
        const level = this.firstNonEmpty(item?.level, item?.difficulty, item?.questionLevel).trim();
        const mobile = this.firstNonEmpty(item?.mobile, item?.createdByMobile, item?.userMobile).trim();
        const adminRaw = (item?.admin ?? item?.isAdmin ?? item?.is_admin);

        if (!question) return null;

        return {
          id: id ?? undefined,
          question,
          code: code || undefined,
          answer: answer || undefined,
          options,
          correctAnswer: correctAnswer || undefined,
          questionType,
          topic: topic || undefined,
          category: category || undefined,
          level: level || undefined,
          mobile: mobile || undefined,
          admin: typeof adminRaw === 'boolean' ? adminRaw : undefined,
        } as MyQuestion;
      })
      .filter(Boolean) as MyQuestion[];
  }

  loadAll(): void {
    if (!this.currentMobile) {
      this.modalDetails = {
        ...this.modalDetails,
        isOpen: true,
        status: 'warning',
        message: 'Please log in to view your questions.'
      };
      return;
    }

    this.isLoading = true;

    const quiz$ = this.mcqQuestionService
      .getAllMcq({ questionType: 'MCQ' })
      .pipe(
        apiFallback<any[]>([], 'Error loading quiz questions'),
        map((d) => this.normalizeQuestions(d, 'MCQ'))
      );

    const outputMcq$ = this.mcqQuestionService
      .getAllMcq({ questionType: 'OUTPUTBASEDMCQ' })
      .pipe(
        apiFallback<any[]>([], 'Error loading output MCQ questions'),
        map((d) => this.normalizeQuestions(d, 'OUTPUTBASEDMCQ'))
      );

    const outputTyped$ = this.mcqQuestionService
      .getAllMcq({ questionType: 'OUTPUTBASED' })
      .pipe(
        apiFallback<any[]>([], 'Error loading output typed questions'),
        map((d) => this.normalizeQuestions(d, 'OUTPUTBASED'))
      );

    forkJoin({ quiz: quiz$, outMcq: outputMcq$, outTyped: outputTyped$ })
      .pipe(
        finalize(() => (this.isLoading = false)),
        takeUntil(this.destroy$)
      )
      .subscribe(({ quiz, outMcq, outTyped }) => {
        this.quizQuestions = (quiz ?? []).filter((q) => this.shouldShow(q));
        this.outputMcqQuestions = (outMcq ?? []).filter((q) => this.shouldShow(q));
        this.outputTypedQuestions = (outTyped ?? []).filter((q) => this.shouldShow(q));
      });
  }

  editQuestion(q: MyQuestion): void {
    if (!q?.id) return;
    if (!this.canManage(q)) return;

    this.router.navigate(['/interview-qa/editor'], {
      queryParams: {
        id: q.id,
        questionType: q.questionType,
        source: 'my-questions'
      },
      state: {
        mcqEdit: {
          id: q.id,
          question: q.question,
          code: q.code ?? '',
          answer: q.answer ?? '',
          options: q.options ?? [],
          correctAnswer: q.correctAnswer ?? '',
          questionType: q.questionType,
          category: q.category,
          topic: q.topic,
          level: q.level,
          mobile: q.mobile,
          admin: q.admin,
        }
      }
    });
  }

  openDeleteConfirm(q: MyQuestion): void {
    if (!q?.id) return;
    if (!this.canManage(q)) return;

    this.questionToDelete = q;
    this.confirmModalDetails = {
      ...this.confirmModalDetails,
      isOpen: true,
      message: 'Are you sure you want to delete this question? This action cannot be undone.'
    };
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
          this.confirmModalDetails = { ...this.confirmModalDetails, isOpen: false };
          this.modalDetails = { ...this.modalDetails, isOpen: true, status: 'success', message: 'Question deleted successfully.' };
          this.loadAll();
        },
        error: () => {
          this.modalDetails = { ...this.modalDetails, isOpen: true, status: 'error', message: 'Error deleting question.' };
        }
      });
  }

  toggleAdminFlag(q: MyQuestion): void {
    if (!this.isAdminUser) return;
    if (!q?.id) return;

    const nextValue = !(q.admin === true);

    const reqBody: any = {
      question: q.question,
      code: q.code ?? '',
      answer: q.answer ?? '',
      options: q.options ?? [],
      correctAnswer: q.correctAnswer ?? '',
      questionType: q.questionType,
      category: q.category ?? '',
      topic: q.topic ?? '',
      level: q.level ?? 'BASIC',
      mobile: q.mobile ?? this.currentMobile,
      admin: nextValue,
    };

    this.mcqQuestionService
      .updateMcqQuestion(q.id, reqBody)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          q.admin = nextValue;
          this.modalDetails = {
            ...this.modalDetails,
            isOpen: true,
            status: 'success',
            message: nextValue ? 'Question marked as admin-approved (visible to all).' : 'Question marked as private (visible only to owner/admin).'
          };
        },
        error: () => {
          this.modalDetails = {
            ...this.modalDetails,
            isOpen: true,
            status: 'error',
            message: 'Failed to update admin flag.'
          };
        }
      });
  }
}

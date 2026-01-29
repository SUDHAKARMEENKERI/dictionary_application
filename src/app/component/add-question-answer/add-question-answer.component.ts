import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';
import { Subject, of } from 'rxjs';
import { filter, map, switchMap, takeUntil, tap, catchError, finalize } from 'rxjs/operators';
import { TechnologyService } from '../../service/technology.service';
import { DropdownResponse, QuestionTypeDropdownOption } from '../../models/Technology';
import { readLoginMobile } from '../../util/loginStorage';
import { ADMIN_MOBILE } from '../../util/app-constants';
import { apiFallback } from '../../util/apiRx';
import { MCQQuestionService } from '../../service/mcqQuestion.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-add-question-answer',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent, RouterModule],
  templateUrl: './add-question-answer.component.html',
  styleUrl: './add-question-answer.component.scss'
})
export class AddQuestionAnswerComponent implements OnInit, OnDestroy {
  constructor(private formBuilder: FormBuilder,
    private questionAnswerService: QuestionAnswerService,
    private activeRouter: ActivatedRoute, private sanitizer: DomSanitizer,
    private techService: TechnologyService,
    private router: Router,
    private mcqQuestionService: MCQQuestionService) { }

  questionAnswerForm!: FormGroup;
  imageSrc: string | null = null;
  imageFile: File | null = null;
  private destroy$ = new Subject<void>();
  editMode: {
    isEditMode: boolean;
    id: string | null;
  } = {
      isEditMode: false,
      id: null
    };

  topicItem: DropdownResponse[] = [];

  categoryTopic: DropdownResponse[] = [];

  openModalDetails = {
    isOpen: false,
    message: ''
  }
  excelFile!: File;
  isNonTheoryQuestion: boolean = false;
  isOutputBasedQuestion: boolean = false;

  isBulkUploading: boolean = false;

  bulkTemplateType: string = 'THEORY';

  private pendingEditQa: any | null = null;

  private readonly adminMobile = ADMIN_MOBILE;

  private isMcqLikeQuestionType(value: unknown): boolean {
    const t = (value ?? '').toString().trim().toUpperCase();
    return t === 'MCQ' || t === 'OUTPUTBASEDMCQ' || t === 'OUTPUTBASED';
  }

  private normalizeHeaderKey(value: unknown): string {
    return (value ?? '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[\s_\-]+/g, '');
  }

  private coerceString(value: unknown): string {
    const v = value ?? '';
    return typeof v === 'string' ? v.trim() : String(v).trim();
  }

  private normalizeDifficulty(value: unknown): 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' {
    const v = this.coerceString(value).toUpperCase();
    if (v === 'ADVANCED') return 'ADVANCED';
    if (v === 'INTERMEDIATE') return 'INTERMEDIATE';
    return 'BASIC';
  }

  private readExcelRows$(file: File) {
    return new Promise<any[]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const bstr: string = e.target.result;
          const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
          const wsname: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[];
          if (!data?.length) return resolve([]);

          const headers = (data[0] ?? []).map((h: any) => this.coerceString(h));
          const rows = (data.slice(1) ?? []).map((row: any[]) => {
            const obj: any = {};
            headers.forEach((header: string, i: number) => {
              obj[header] = row?.[i];
            });
            return obj;
          });

          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsBinaryString(file);
    });
  }

  private getNormalizedRow(row: any): Record<string, any> {
    const out: Record<string, any> = {};
    Object.keys(row || {}).forEach((k) => {
      out[this.normalizeHeaderKey(k)] = row[k];
    });
    return out;
  }

  private pick(row: Record<string, any>, keys: string[]): any {
    for (const key of keys) {
      const v = row[this.normalizeHeaderKey(key)];
      if (v !== undefined && v !== null && this.coerceString(v) !== '') return v;
    }
    return '';
  }

  private resolveCategoryIdForBulk(value: unknown): number | null {
    return this.parseCategoryId(value) ?? this.resolveCategoryIdFromName(value);
  }

  private detectBulkQuestionType(selected: unknown, rows: any[]): string {
    const fromSelected = this.normalizeQuestionType(selected);
    if (fromSelected) return fromSelected;

    // Try to infer from the sheet itself.
    const types = new Set<string>();
    for (const r of rows || []) {
      const nr = this.getNormalizedRow(r);
      const raw = this.pick(nr, ['questionType', 'type']);
      const t = this.normalizeQuestionType(raw);
      if (t) types.add(t);
    }

    if (types.size === 1) return Array.from(types)[0];
    return '';
  }

  private canManageMcqItem(item: any): boolean {
    const current = (readLoginMobile() ?? '').toString().trim();
    if (!current) return false;
    if (current === this.adminMobile) return true;
    const owner = (item?.mobile ?? item?.createdByMobile ?? item?.userMobile ?? '').toString().trim();
    return !!owner && owner === current;
  }

  private applyEditMcqItem(item: any): void {
    const normalizedLevel = (item.level ?? item.difficulty ?? item.questionLevel ?? 'BASIC')
      .toString()
      .trim()
      .toUpperCase();

    const qt = this.normalizeQuestionType(item.questionType);

    // Set questionType first so the valueChanges logic sets validators/fields.
    this.questionAnswerForm.get('questionType')?.setValue(qt);

    const optionsRaw = Array.isArray(item?.options) ? item.options : [];
    const options = optionsRaw.map((o: any) => (o ?? '').toString());

    this.questionAnswerForm.patchValue({
      question: item.question,
      code: item.code ?? '',
      answer: item.answer ?? '',
      // Category is reconciled once categories are loaded (id is required for select value).
      category: '',
      topic: (item.topic ?? '').toString().trim(),
      level: normalizedLevel || 'BASIC',
      optionA: options[0] ?? '',
      optionB: options[1] ?? '',
      optionC: options[2] ?? '',
      optionD: options[3] ?? '',
      correctAnswer: (item.correctAnswer ?? '').toString().trim(),
    });

    this.syncCategoryFromPendingEdit(item);
  }

  readonly difficultyLevels = [
    { label: 'Basic', value: 'BASIC' },
    { label: 'Intermediate', value: 'INTERMEDIATE' },
    { label: 'Advanced', value: 'ADVANCED' }
  ] as const;

  questionType: QuestionTypeDropdownOption[] = [
    { label: 'Theory', value: 'THEORY' },
    { label: 'MCQ', value: 'MCQ' },
    { label: 'Output Based MCQ', value: 'OUTPUTBASEDMCQ' },
    { label: 'Output Based (Type Answer)', value: 'OUTPUTBASED' }
  ];

  ngOnInit(): void {
    this.questionAnswerForm = this.formBuilder.group({
      question: ['', Validators.required],
      code: [''],
      answer: [''],
      category: ['', Validators.required],
      topic: ['', Validators.required],
      questionType: ['', Validators.required],
      level: ['BASIC', Validators.required],
      optionA: [''],
      optionB: [''],
      optionC: [''],
      optionD: [''],
      correctAnswer: [''],
    });

    this.questionAnswerForm
      .get('category')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((categoryValue) => {
        this.loadTopicsForCategory(categoryValue);
      });

    this.questionAnswerForm
      .get('questionType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((questionTypeValue) => {
        const normalized = this.normalize(questionTypeValue);
        // Only option-based question types should show Option A-D + correctAnswer.
        this.isNonTheoryQuestion = normalized === 'mcq' || normalized === 'outputbasedmcq';
        this.isOutputBasedQuestion = normalized === 'outputbasedmcq' || normalized === 'outputbased';

        // Dynamic validators based on type
        const answerCtrl = this.questionAnswerForm.get('answer');
        const codeCtrl = this.questionAnswerForm.get('code');
        const optionA = this.questionAnswerForm.get('optionA');
        const optionB = this.questionAnswerForm.get('optionB');
        const optionC = this.questionAnswerForm.get('optionC');
        const optionD = this.questionAnswerForm.get('optionD');
        const correctAnswer = this.questionAnswerForm.get('correctAnswer');

        // Reset validators
        answerCtrl?.clearValidators();
        codeCtrl?.clearValidators();
        optionA?.clearValidators();
        optionB?.clearValidators();
        optionC?.clearValidators();
        optionD?.clearValidators();
        correctAnswer?.clearValidators();

        if (this.isNonTheoryQuestion) {
          optionA?.setValidators([Validators.required]);
          optionB?.setValidators([Validators.required]);
          optionC?.setValidators([Validators.required]);
          optionD?.setValidators([Validators.required]);
          correctAnswer?.setValidators([Validators.required]);
          // For MCQ types we don't require long-form answer.
          answerCtrl?.setValue('');
        } else {
          // THEORY and OUTPUTBASED (typed) require answer.
          answerCtrl?.setValidators([Validators.required]);
          // Clear MCQ fields
          optionA?.setValue('');
          optionB?.setValue('');
          optionC?.setValue('');
          optionD?.setValue('');
          correctAnswer?.setValue('');
        }

        if (this.isOutputBasedQuestion) {
          codeCtrl?.setValidators([Validators.required]);
        } else {
          codeCtrl?.setValue('');
        }

        answerCtrl?.updateValueAndValidity({ emitEvent: false });
        codeCtrl?.updateValueAndValidity({ emitEvent: false });
        optionA?.updateValueAndValidity({ emitEvent: false });
        optionB?.updateValueAndValidity({ emitEvent: false });
        optionC?.updateValueAndValidity({ emitEvent: false });
        optionD?.updateValueAndValidity({ emitEvent: false });
        correctAnswer?.updateValueAndValidity({ emitEvent: false });
      });

    this.activeRouter.queryParams
      .pipe(
        map((params) => {
          const id = (params?.['id'] ?? '').toString().trim();
          const questionType = (params?.['questionType'] ?? '').toString().trim();
          return { id, questionType };
        }),
        tap(({ id }) => {
          if (id) {
            this.editMode = { isEditMode: true, id };
          }
        }),
        filter(({ id }) => !!id),
        switchMap(({ id, questionType }) => {
          const state = (history.state ?? {}) as any;
          const mcqEdit = state?.mcqEdit;

          // If coming from quiz/output-practice edit, prefer navigation state.
          if (this.isMcqLikeQuestionType(questionType) || this.isMcqLikeQuestionType(mcqEdit?.questionType)) {
            if (mcqEdit) {
              return [mcqEdit];
            }

            // Fallback: try to locate the MCQ item by id (may be heavy, but supports reload).
            return this.mcqQuestionService.getAllMcq({}).pipe(
              apiFallback<any[]>([], 'Error fetching MCQ list for edit'),
              map((list: any) => {
                const arr = Array.isArray(list)
                  ? list
                  : (list?.data ?? list?.result ?? list?.items ?? list?.content ?? []);
                const match = (arr || []).find((x: any) => {
                  const xid = (x?.id ?? x?._id ?? x?.mcqId ?? x?.questionId ?? '').toString();
                  return xid && xid === id;
                });
                return match ?? null;
              })
            );
          }

          return this.questionAnswerService.getAllUserQAById(id).pipe(
            apiFallback<any | null>(null, 'Error fetching QA by ID')
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((data: any) => {
        if (!data) return;

        const normalizedType = this.normalizeQuestionType(data?.questionType);
        const isMcqLike = this.isMcqLikeQuestionType(normalizedType);

        if (isMcqLike) {
          if (!this.canManageMcqItem(data)) {
            this.modalMessage('You can edit/delete only your own Q&A.');
            this.editMode = { isEditMode: false, id: null };
            this.pendingEditQa = null;
            this.router.navigate([], {
              relativeTo: this.activeRouter,
              queryParams: { id: null },
              queryParamsHandling: 'merge',
              replaceUrl: true
            });
            return;
          }

          this.pendingEditQa = data;
          this.applyEditMcqItem(data);
          this.imageSrc = null;
          this.imageFile = null;
          return;
        }

        const qaItem = data;

        if (!this.canManageQa(qaItem)) {
          this.modalMessage('You can edit/delete only your own Q&A.');
          this.editMode = { isEditMode: false, id: null };
          this.pendingEditQa = null;
          // Clear the id from the URL so the user can create a new Q&A instead.
          this.router.navigate([], {
            relativeTo: this.activeRouter,
            queryParams: { id: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
          return;
        }

        this.pendingEditQa = qaItem;
        this.applyEditQa(qaItem);
        this.imageSrc = qaItem.imageBase64 ? this.getImageSrc(qaItem.imageBase64) : '';
      });

    this.techService
      .getAllTechCategories()
      .pipe(
        apiFallback([] as DropdownResponse[], 'API failed while fetching tech categories'),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.categoryTopic = data || [];
        // If edit mode loaded first, reconcile category/topic once categories exist.
        if (this.pendingEditQa) {
          this.syncCategoryFromPendingEdit(this.pendingEditQa);
        }
      });
  }

  private normalize(value: unknown): string {
    return (value ?? '').toString().trim().toLowerCase();
  }

  private canManageQa(qa: any): boolean {
    const current = (readLoginMobile() ?? '').toString().trim();
    if (!current) return false;
    if (current === this.adminMobile) return true;
    const owner = this.getQaOwnerMobile(qa);
    if (!owner) return false;
    return owner === current;
  }

  private getQaOwnerMobile(qa: any): string {
    const candidates = [
      qa?.mobile,
      qa?.userMobile,
      qa?.mobileNo,
      qa?.createdByMobile,
      qa?.createdBy?.mobile,
      qa?.ownerMobile
    ];
    for (const c of candidates) {
      const v = (c ?? '').toString().trim();
      if (v) return v;
    }
    return '';
  }

  private normalizeQuestionType(value: unknown): string {
    const v = (value ?? '').toString().trim();
    if (!v) return '';
    const lower = v.toLowerCase();
    if (lower === 'theory') return 'THEORY';
    if (lower === 'mcq') return 'MCQ';
    if (lower.includes('output') && lower.includes('mcq')) return 'OUTPUTBASEDMCQ';
    if (lower.includes('output')) return 'OUTPUTBASED';
    if (v.toUpperCase() === 'THEORY' || v.toUpperCase() === 'MCQ') return v.toUpperCase();
    if (v.toUpperCase().includes('OUTPUT') && v.toUpperCase().includes('MCQ')) return 'OUTPUTBASEDMCQ';
    if (v.toUpperCase().includes('OUTPUT')) return 'OUTPUTBASED';
    return v;
  }

  private getTemplateSpec(questionType: string): { fileName: string; header: string[]; sample: any[] } {
    const qt = this.normalizeQuestionType(questionType);

    const commonPrefix = ['questionType', 'category', 'topic', 'level', 'question'];
    const level = 'BASIC';
    const categoryExample = 'Java'; // can also be numeric id
    const topicExample = 'Arrays';

    if (qt === 'MCQ') {
      return {
        fileName: 'bulk_template_mcq',
        header: [...commonPrefix, 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer'],
        sample: [
          'MCQ',
          categoryExample,
          topicExample,
          level,
          'What is the output of: System.out.println(2 + 3 * 4);',
          '14',
          '20',
          '24',
          '18',
          'A'
        ]
      };
    }

    if (qt === 'OUTPUTBASEDMCQ') {
      return {
        fileName: 'bulk_template_outputbasedmcq',
        header: [...commonPrefix, 'code', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer'],
        sample: [
          'OUTPUTBASEDMCQ',
          categoryExample,
          topicExample,
          level,
          'What is the output?',
          'int x = 10;\nSystem.out.println(x++ + ++x);',
          '21',
          '22',
          '23',
          '24',
          'B'
        ]
      };
    }

    if (qt === 'OUTPUTBASED') {
      return {
        fileName: 'bulk_template_outputbased_answer',
        header: [...commonPrefix, 'code', 'answer'],
        sample: [
          'OUTPUTBASED',
          categoryExample,
          topicExample,
          level,
          'Find the output',
          'int a = 5;\nSystem.out.println(a * 2);',
          '10'
        ]
      };
    }

    // THEORY (default)
    return {
      fileName: 'bulk_template_theory',
      header: [...commonPrefix, 'code', 'answer'],
      sample: [
        'THEORY',
        categoryExample,
        topicExample,
        level,
        'Explain what an array is in Java.',
        '',
        'An array is a fixed-size data structure that stores elements of the same type in contiguous memory.'
      ]
    };
  }

  downloadBulkTemplate(type?: string): void {
    const qt = this.normalizeQuestionType(type ?? this.bulkTemplateType ?? this.questionAnswerForm?.get('questionType')?.value);
    const spec = this.getTemplateSpec(qt || 'THEORY');

    const sheet = XLSX.utils.aoa_to_sheet([spec.header, spec.sample]);
    // Make the header row bold-ish by widening columns (simple UX improvement).
    const colWidths = spec.header.map((h, i) => {
      const sample = this.coerceString(spec.sample[i] ?? '');
      return { wch: Math.max(12, Math.min(60, Math.max(h.length, sample.length))) };
    });
    (sheet as any)['!cols'] = colWidths;

    const workbook: XLSX.WorkBook = {
      Sheets: { Template: sheet },
      SheetNames: ['Template']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${spec.fileName}.xlsx`);
  }

  private parseCategoryId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const raw = (value ?? '').toString().trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private resolveCategoryIdFromName(value: unknown): number | null {
    const raw = (value ?? '').toString().trim();
    if (!raw) return null;
    const key = this.normalize(raw);
    const match = (this.categoryTopic || []).find((c) => this.normalize(c?.name) === key);
    const id = this.parseCategoryId(match?.id);
    return id;
  }

  private applyEditQa(qaItem: any): void {
    const normalizedLevel = (qaItem.level ?? qaItem.difficulty ?? qaItem.questionLevel ?? qaItem.experienceLevel ?? 'BASIC')
      .toString()
      .trim()
      .toUpperCase();

    this.questionAnswerForm.patchValue({
      question: qaItem.question,
      code: (qaItem.code ?? qaItem.codeSnippet ?? qaItem.questionCode ?? qaItem.snippet ?? qaItem.program ?? ''),
      answer: qaItem.answer,
      // Category is reconciled once categories are loaded (id is required for select value).
      category: '',
      questionType: this.normalizeQuestionType(qaItem.questionType),
      topic: (qaItem.topic ?? '').toString().trim(),
      level: normalizedLevel || 'BASIC',
    });

    this.syncCategoryFromPendingEdit(qaItem);
  }

  private syncCategoryFromPendingEdit(qaItem: any): void {
    if (!this.categoryTopic?.length) return;

    const current = this.questionAnswerForm.get('category')?.value;
    const hasId = this.parseCategoryId(current);
    if (hasId) return;

    const categoryId = this.parseCategoryId(qaItem?.category) ?? this.resolveCategoryIdFromName(qaItem?.category);
    if (!categoryId) return;

    // Setting category triggers loadTopicsForCategory via valueChanges.
    this.questionAnswerForm.get('category')?.setValue(categoryId);
  }

  private loadTopicsForCategory(categoryValue: unknown): void {
    const categoryId = this.parseCategoryId(categoryValue);
    if (!categoryId) {
      this.topicItem = [];
      return;
    }

    this.techService
      .getAllTechItems(categoryId)
      .pipe(
        apiFallback([] as DropdownResponse[], 'API failed while fetching tech Items'),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.topicItem = data || [];

        // In edit mode, once topics arrive, select the exact matching topic option.
        const pendingTopic = (this.pendingEditQa?.topic ?? this.questionAnswerForm.get('topic')?.value ?? '').toString().trim();
        if (!pendingTopic) return;

        const match = (this.topicItem || []).find((t) => this.normalize(t?.name) === this.normalize(pendingTopic));
        if (match?.name) {
          this.questionAnswerForm.get('topic')?.setValue(match.name);
        }
      });
  }

  onSubmit() {
    if (this.questionAnswerForm.invalid) return;
    if (this.isNonTheoryQuestion || this.isOutputBasedQuestion) {
      const options = [
        this.questionAnswerForm.value.optionA,
        this.questionAnswerForm.value.optionB,
        this.questionAnswerForm.value.optionC,
        this.questionAnswerForm.value.optionD
      ];
      
      const reqBoy = {
        code: this.questionAnswerForm.value.code,
        answer: this.questionAnswerForm.value.answer,
        options: options,
        correctAnswer: this.questionAnswerForm.value.correctAnswer,
        questionType: this.questionAnswerForm.value.questionType,
        category: this.questionAnswerForm.value.category,
        topic: this.questionAnswerForm.value.topic,
        question: this.questionAnswerForm.value.question,
        level: this.questionAnswerForm.value.level,
        mobile: readLoginMobile()
      };

      if (this.editMode.isEditMode && this.editMode.id) {
        this.mcqQuestionService
          .updateMcqQuestion(this.editMode.id, reqBoy)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.modalMessage('Question Answer updated Successfully.');
              this.questionAnswerForm.reset();
              this.removeImage();
            },
            error: (error) => {
              this.modalMessage('Opps!, Something went wrong.');
              console.log(error);
            }
          });
      } else {
        this.questionAnswerService.createMcqQA(reqBoy)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.questionAnswerForm.reset();
              this.modalMessage('Question Answer added Successfully.');
            },
            error: (error) => {
              this.modalMessage('Opps!, Something went wrong.');
              console.log(error);
            }
          });
      }
    } else {
      const formData = new FormData();
      formData.append('question', this.questionAnswerForm.value.question);
      formData.append('code', this.questionAnswerForm.value.code ?? '');
      formData.append('answer', this.questionAnswerForm.value.answer);
      formData.append('topic', this.questionAnswerForm.value.topic);
      formData.append('questionType', this.questionAnswerForm.value.questionType);
      formData.append('category', this.questionAnswerForm.value.category);
      formData.append('level', this.questionAnswerForm.value.level);
      formData.append('mobile', readLoginMobile());
      if (this.imageFile) {
        formData.append('image', this.imageFile);
      } else {
        formData.append('image', '');
        formData.append('imageBase64', '');
      }

      if (this.editMode.isEditMode && this.editMode.id) {
        formData.append('id', this.editMode.id);
        this.questionAnswerService.upateUserQA(this.editMode.id, formData).pipe(takeUntil(this.destroy$)).subscribe({
          next: (response) => {
            this.questionAnswerForm.reset();
            this.removeImage();
            this.modalMessage("Question Answer changed Successfully.");
          },
          error: (error) => {
            console.error('Error submitting Question-Answer:', error);
            this.modalMessage("Opps!, Something went wrong");
          }
        });
      } else {
        this.questionAnswerService.createUserQA(formData).pipe(takeUntil(this.destroy$)).subscribe({
          next: (response) => {
            this.questionAnswerForm.reset();
            this.removeImage();
            this.modalMessage("Question Answer added Successfully.");
          },
          error: (error) => {
            console.error('Error submitting Question-Answer:', error);
            this.modalMessage("Opps!, Something went wrong.");

          }
        });
      }
    }

  }

  modalMessage(message: string) {
    this.openModalDetails = {
      isOpen: true,
      message: message
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.imageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageSrc = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.imageSrc = null;
    this.imageFile = null;
  }

  getImageSrc(imageData: string): string {
    return this.sanitizer.bypassSecurityTrustUrl(
      'data:image/jpeg;base64,' + imageData
    ) as string;
  }

  onFileSelect(event: any) {
    this.excelFile = event.target.files[0];
  }

  upload() {
    if (!this.excelFile) {
      this.modalMessage('Please choose an Excel file first.');
      return;
    }

    const mobile = (readLoginMobile() ?? '').toString().trim();
    if (!mobile) {
      this.modalMessage('Please login again to bulk upload.');
      return;
    }

    if (this.isBulkUploading) return;
    this.isBulkUploading = true;

    // Bulk upload endpoint selection is driven by the dropdown.
    // - MCQ/Output Based MCQ => /api/mcqQuestions/bulk-upload
    // - Theory/Output Based (answer type) => /api/qa/bulk-upload
    const selectedType = this.normalizeQuestionType(
      this.bulkTemplateType || this.questionAnswerForm.get('questionType')?.value
    );

    if (!selectedType) {
      this.modalMessage('Please select a bulk upload type.');
      this.isBulkUploading = false;
      return;
    }

    const formData = new FormData();
    formData.append('file', this.excelFile);

    const isMcqBulk = selectedType === 'MCQ' || selectedType === 'OUTPUTBASEDMCQ' || selectedType === 'OUTPUTBASED';

    const upload$ = isMcqBulk
      ? this.mcqQuestionService.bulkUploadMcq(formData)
      : this.questionAnswerService.bulkUploadQA(formData);

    upload$
      .pipe(
        map((response: any) => {
          const message = response?.message ?? response?.result ?? response?.status ?? 'Bulk upload successful.';
          return { message };
        }),
        catchError((error: any) => {
          console.error('Error during bulk upload:', error);
          const message = error?.error?.message || 'Opps!, Something went wrong during bulk upload.';
          return of({ message });
        }),
        finalize(() => {
          this.isBulkUploading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((result: any) => {
        if (result?.message) this.modalMessage(result.message);
      });
  }

  // Category/topic and question-type behavior are handled via reactive form valueChanges.

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}

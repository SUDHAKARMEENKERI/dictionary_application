import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';
import { Subject } from 'rxjs';
import { filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { TechnologyService } from '../../service/technology.service';
import { DropdownResponse, QuestionTypeDropdownOption } from '../../models/Technology';
import { readLoginMobile } from '../../util/loginStorage';
import { apiFallback } from '../../util/apiRx';

@Component({
  selector: 'app-add-question-answer',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './add-question-answer.component.html',
  styleUrl: './add-question-answer.component.scss'
})
export class AddQuestionAnswerComponent implements OnInit, OnDestroy {
  constructor(private formBuilder: FormBuilder,
    private questionAnswerService: QuestionAnswerService,
    private activeRouter: ActivatedRoute, private sanitizer: DomSanitizer,
    private techService: TechnologyService) { }

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
  selectedCategoryId!: number;
  selectedQuestionType!: string;
  isNonTheoryQuestion: boolean = false;

  readonly difficultyLevels = [
    { label: 'Basic', value: 'BASIC' },
    { label: 'Intermediate', value: 'INTERMEDIATE' },
    { label: 'Advanced', value: 'ADVANCED' }
  ] as const;

  questionType: QuestionTypeDropdownOption[] = [
    { label: 'Theory', value: 'THEORY' },
    // { label: 'Practical', value: 'PRACTICAL' },
    { label: 'mcq', value: 'MCQ' },
    { label: 'OutPutBasesMCQ', value: 'OUTPUT BASED MCQ' }
  ];

  ngOnInit(): void {
    this.questionAnswerForm = this.formBuilder.group({
      question: ['', Validators.required],
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

    this.activeRouter.queryParams
      .pipe(
        map((params) => (params?.['id'] ?? '').toString().trim()),
        tap((id) => {
          if (id) {
            this.editMode = { isEditMode: true, id };
          }
        }),
        filter((id) => !!id),
        switchMap((id) =>
          this.questionAnswerService.getAllUserQAById(id).pipe(
            apiFallback<any | null>(null, 'Error fetching QA by ID')
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        if (!data) return;

        const qaItem = data;
        this.questionAnswerForm.patchValue({
          question: qaItem.question,
          answer: qaItem.answer,
          topic: (qaItem.topic ?? '').toString().toLowerCase(),
          level: (qaItem.level ?? qaItem.difficulty ?? qaItem.questionLevel ?? qaItem.experienceLevel ?? 'BASIC')
            .toString()
            .trim()
            .toUpperCase(),
        });
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
      });
  }

  onSubmit() {
    if (this.questionAnswerForm.invalid) return;
    if (this.isNonTheoryQuestion) {
      const option = [
        this.questionAnswerForm.value.optionA,
        this.questionAnswerForm.value.optionB,
        this.questionAnswerForm.value.optionC,
        this.questionAnswerForm.value.optionD
      ];
      
      const reqBoy = {
        option: option,
        answer: this.questionAnswerForm.value.correctAnswer,
        questionType: this.questionAnswerForm.value.questionType,
        category: this.questionAnswerForm.value.category,
        topic: this.questionAnswerForm.value.topic,
        level: this.questionAnswerForm.value.level,
        mobile: readLoginMobile()
      };

      this.questionAnswerService.createMcqQA(reqBoy).
        pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            this.questionAnswerForm.reset();
          }, error: (error) => {
            console.log(error);
          }
        });
    } else {
      const formData = new FormData();
      formData.append('question', this.questionAnswerForm.value.question);
      formData.append('answer', this.questionAnswerForm.value.answer);
      formData.append('topic', this.questionAnswerForm.value.topic);
      formData.append('questionType', this.questionAnswerForm.value.questionType);
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
            this.modalMessage("Question Answer added Successfully.");
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
            this.modalMessage("Word added successfully.");
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
    const formData = new FormData();
    formData.append('excel', this.excelFile);

    this.questionAnswerService.bulkUploadQA(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.modalMessage("Bulk upload successful.");
      },
      error: (error) => {
        console.error('Error during bulk upload:', error);
        this.modalMessage("Opps!, Something went wrong during bulk upload.");
      }
    });
  }

  onCategoryChange() {
    if (!this.selectedCategoryId) return;
    this.techService.getAllTechItems(this.selectedCategoryId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.topicItem = data;
      }, error: (error) => {
        console.error("API failed while fetching tech Items", error)
      }
    });

  }

  onLoadQuestionTypeChange() {
    if (this.selectedQuestionType.toLowerCase() !== 'theory') {
      this.isNonTheoryQuestion = true;
    } else {
      this.isNonTheoryQuestion = false;
    }

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}

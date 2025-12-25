import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-question-answer',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './add-question-answer.component.html',
  styleUrl: './add-question-answer.component.scss'
})
export class AddQuestionAnswerComponent implements OnInit, OnDestroy {
  constructor(private formBuilder: FormBuilder,
    private questionAnswerService: QuestionAnswerService,
    private activeRouter: ActivatedRoute, private sanitizer: DomSanitizer) { }
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

  dropdownOptions = [
    { value: 'angular', label: 'Angular' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'java', label: 'Java' },
    { value: 'react', label: 'React' },
    { value: 'english', label: 'English' },
    { value: 'other', label: 'Other' }
  ];

  openModalDetails = {
    isOpen: false,
    message: ''
  }
  excelFile!: File;

  ngOnInit(): void {
    this.questionAnswerForm = this.formBuilder.group({
      question: ['', Validators.required],
      answer: ['', Validators.required],
      topic: ['', Validators.required],
    });

    this.activeRouter.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];

      if (id) {
        this.editMode = {
          isEditMode: true,
          id: id
        };
        this.questionAnswerService.getAllUserQAById(id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (data) => {
            if (data) {
              const qaItem = data;
              this.questionAnswerForm.patchValue({
                question: qaItem.question,
                answer: qaItem.answer,
                topic: qaItem.topic.toLowerCase(),
              });
              this.imageSrc = qaItem.imageBase64 ? this.getImageSrc(qaItem.imageBase64) : '';
            }
          },
          error: (error) => {
            console.error('Error fetching QA by ID:', error);
          }
        });
      }
    });
  }

  onSubmit() {
    if (this.questionAnswerForm.invalid) return;
    const formData = new FormData();
    formData.append('question', this.questionAnswerForm.value.question);
    formData.append('answer', this.questionAnswerForm.value.answer);
    formData.append('topic', this.questionAnswerForm.value.topic);
    formData.append('mobile', JSON.parse(localStorage.getItem('login') || '{}').mobile || '');
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
          this.modalMessage("Word added successfully.");
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

    this
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}

import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProgrammingQuestionService } from '../../service/programming-question.service';
import { Subject, takeUntil } from 'rxjs';
import { ModalComponent, ModalDetails } from '../modal/modal.component';
import { readLoginStorage } from '../../util/loginStorage';

@Component({
  selector: 'app-add-programming-question',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './add-programming-question.component.html',
  styleUrls: ['./add-programming-question.component.scss']
})
export class AddProgrammingQuestionComponent implements OnInit, OnDestroy {
  questionForm!: FormGroup;
  isEditMode = false;
  questionId: string | number | null = null;
  topicInput = '';
  technologyInput = '';
  useMultipleAnswers = false;
  private destroy$ = new Subject<void>();

  // Modal
  modalDetails: ModalDetails = {
    isOpen: false,
    message: '',
    status: 'info',
    title: 'Programming Question'
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private programmingQuestionService: ProgrammingQuestionService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.questionId = params['id'];
        this.loadQuestion(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.questionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      difficulty: ['Easy', Validators.required],
      prompt: ['', [Validators.required, Validators.minLength(10)]],
      answer: [''],
      hints: [''],
      isAdmin: [false],
      topics: this.fb.array([]),
      answers: this.fb.array([]) // Array of {technology, answer}
    });
  }

  get topics(): FormArray {
    return this.questionForm.get('topics') as FormArray;
  }

  get answers(): FormArray {
    return this.questionForm.get('answers') as FormArray;
  }

  get isCurrentUserAdmin(): boolean {
    const user = readLoginStorage();
    return user?.mobile === '961165325';
  }

  addTopic(): void {
    const topic = this.topicInput.trim();
    if (topic && !this.topics.value.includes(topic)) {
      this.topics.push(this.fb.control(topic));
      this.topicInput = '';
    }
  }

  removeTopic(index: number): void {
    this.topics.removeAt(index);
  }

  addTechnologyAnswer(): void {
    const technology = this.technologyInput.trim();
    if (technology && !this.answers.value.some((a: any) => a.technology === technology)) {
      this.answers.push(this.fb.group({
        technology: [technology, Validators.required],
        answer: ['', Validators.required]
      }));
      this.technologyInput = '';
    }
  }

  removeTechnologyAnswer(index: number): void {
    this.answers.removeAt(index);
  }

  toggleAnswerMode(): void {
    this.useMultipleAnswers = !this.useMultipleAnswers;
    if (!this.useMultipleAnswers) {
      // Clear technology answers when switching to single answer
      this.answers.clear();
    } else {
      // Clear single answer when switching to multiple
      this.questionForm.patchValue({ answer: '' });
    }
  }

  loadQuestion(id: string | number): void {
    this.programmingQuestionService.getQuestionById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (question) => {
          this.questionForm.patchValue({
            title: question.title,
            difficulty: question.difficulty,
            prompt: question.prompt,
            answer: question.answer || '',
            hints: question.hints || '',
            isAdmin: question.isAdmin || false
          });

          // Clear existing topics and add from question
          this.topics.clear();
          (question.topics || []).forEach(topic => {
            this.topics.push(this.fb.control(topic));
          });

          // Handle multiple answers
          this.answers.clear();
          if (question.answers && question.answers.length > 0) {
            this.useMultipleAnswers = true;
            question.answers.forEach(techAnswer => {
              this.answers.push(this.fb.group({
                technology: [techAnswer.technology, Validators.required],
                answer: [techAnswer.answer, Validators.required]
              }));
            });
          }
        },
        error: (error) => {
          console.error('Error loading question:', error);
          this.showModal('Failed to load question. Please try again.', 'error');
          setTimeout(() => {
            this.router.navigate(['/programming-questions']);
          }, 2000);
        }
      });
  }

  onSubmit(): void {
    if (this.questionForm.invalid) {
      Object.keys(this.questionForm.controls).forEach(key => {
        this.questionForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.questionForm.value;
    const user = readLoginStorage();
    const questionData: any = {
      title: formValue.title,
      difficulty: formValue.difficulty,
      topics: formValue.topics,
      prompt: formValue.prompt,
      hints: formValue.hints,
      isAdmin: formValue.isAdmin || false,
      mobile: user?.mobile || ''
    };

    // Add answer or answers based on mode
    if (this.useMultipleAnswers && formValue.answers.length > 0) {
      questionData.answers = formValue.answers;
    } else {
      questionData.answer = formValue.answer;
    }

    if (this.isEditMode && this.questionId) {
      // Update existing question
      this.programmingQuestionService.updateQuestion(this.questionId, questionData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showModal('Question updated successfully!', 'success');
            setTimeout(() => {
              this.router.navigate(['/programming-questions']);
            }, 1500);
          },
          error: (error) => {
            console.error('Error updating question:', error);
            this.showModal('Failed to update question. Please try again.', 'error');
          }
        });
    } else {
      // Create new question
      this.programmingQuestionService.createQuestion(questionData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showModal('Question created successfully!', 'success');
            setTimeout(() => {
              this.router.navigate(['/programming-questions']);
            }, 1500);
          },
          error: (error) => {
            console.error('Error creating question:', error);
            this.showModal('Failed to create question. Please try again.', 'error');
          }
        });
    }
  }

  cancel(): void {
    this.router.navigate(['/programming-questions']);
  }

  getError(fieldName: string): string {
    const control = this.questionForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${fieldName} must be at least ${minLength} characters`;
    }
    return '';
  }

  showModal(message: string, status: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.modalDetails = {
      isOpen: true,
      message,
      status,
      title: 'Programming Question'
    };
  }
}

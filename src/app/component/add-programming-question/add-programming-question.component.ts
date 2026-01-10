import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProgrammingQuestionService } from '../../service/programming-question.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-add-programming-question',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-programming-question.component.html',
  styleUrls: ['./add-programming-question.component.scss']
})
export class AddProgrammingQuestionComponent implements OnInit, OnDestroy {
  questionForm!: FormGroup;
  isEditMode = false;
  questionId: string | null = null;
  topicInput = '';
  private destroy$ = new Subject<void>();

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
      topics: this.fb.array([])
    });
  }

  get topics(): FormArray {
    return this.questionForm.get('topics') as FormArray;
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

  loadQuestion(id: string): void {
    this.programmingQuestionService.getQuestionById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (question) => {
          this.questionForm.patchValue({
            title: question.title,
            difficulty: question.difficulty,
            prompt: question.prompt,
            answer: question.answer || '',
            hints: question.hints || ''
          });

          // Clear existing topics and add from question
          this.topics.clear();
          (question.topics || []).forEach(topic => {
            this.topics.push(this.fb.control(topic));
          });
        },
        error: (error) => {
          console.error('Error loading question:', error);
          alert('Failed to load question. Please try again.');
          this.router.navigate(['/programming-questions']);
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
    const questionData = {
      title: formValue.title,
      difficulty: formValue.difficulty,
      topics: formValue.topics,
      prompt: formValue.prompt,
      answer: formValue.answer,
      hints: formValue.hints
    };

    if (this.isEditMode && this.questionId) {
      // Update existing question
      this.programmingQuestionService.updateQuestion(this.questionId, questionData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Question updated successfully!');
            this.router.navigate(['/programming-questions']);
          },
          error: (error) => {
            console.error('Error updating question:', error);
            alert('Failed to update question. Please try again.');
          }
        });
    } else {
      // Create new question
      this.programmingQuestionService.createQuestion(questionData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Question created successfully!');
            this.router.navigate(['/programming-questions']);
          },
          error: (error) => {
            console.error('Error creating question:', error);
            alert('Failed to create question. Please try again.');
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
}

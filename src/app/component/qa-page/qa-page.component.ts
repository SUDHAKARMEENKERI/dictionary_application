import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { QaListComponent } from '../qa-list/qa-list.component';
import { TutorialComponent } from '../tutorial/tutorial.component';
import { QuizComponent } from '../quiz/quiz.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { QuestionAnswer } from '../../models/Technology';

@Component({
  selector: 'app-qa-page',
  imports: [CommonModule],
  templateUrl: './qa-page.component.html',
  styleUrl: './qa-page.component.scss',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QaPageComponent implements OnInit {
  constructor(private activeRouter: ActivatedRoute,
    private questionAnswerService: QuestionAnswerService,
    private router: Router) { }

  private destroy$ = new Subject<void>();
  questionAnswers: QuestionAnswer[] = [];
  topic: string = '';

  ngOnInit(): void {
    this.activeRouter.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.topic = params['topic']
      if (this.topic) {
        this.questionAnswerService.getQAByTopic(this.topic).pipe(takeUntil(this.destroy$)).subscribe({
          next: (data: any) => {
            this.questionAnswers = data;
          },
          error: (error) => {
            console.log(error);
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLoadQuiz() {
    this.router.navigate(['/qa-quiz'], { queryParams: { topic: this.topic } });
  }

  onLoadPracticeQuestion() {
    this.router.navigate(['/qa-practice'], { queryParams: { topic: this.topic } });
  }

}

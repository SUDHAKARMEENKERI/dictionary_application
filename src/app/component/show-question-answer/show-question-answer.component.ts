import { Component, OnInit } from '@angular/core';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-show-question-answer',
  imports: [CommonModule],
  templateUrl: './show-question-answer.component.html',
  styleUrl: './show-question-answer.component.scss'
})

export class ShowQuestionAnswerComponent implements OnInit {
  questionAnswers: any[] = [];
  constructor(private questionAnswerService: QuestionAnswerService,
    private sanitizer: DomSanitizer,
    private router: Router) { }

  ngOnInit(): void {
    this.questionAnswerService.getAllUserQA().subscribe({
      next: (data) => {
        this.questionAnswers = data;
      },
      error: (error) => {
        console.error('Error fetching question and answer data:', error);
      }
    });

  }

  getImageSrc(imageData: string): string {
    return this.sanitizer.bypassSecurityTrustUrl(
      'data:image/jpeg;base64,' + imageData
    ) as string;
  }

  onEdit(qa: any): void {
    // Implement edit functionality here
    console.log('Edit QA:', qa);
    this.router.navigate(['/addquestionanswer'], { queryParams: { id: qa.id } });
  }

  onDelete(qa: any): void {
    // Implement delete functionality here
    console.log('Delete QA:', qa);
  }
}

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

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;

  constructor(private questionAnswerService: QuestionAnswerService,
    private sanitizer: DomSanitizer,
    private router: Router) { }

  ngOnInit(): void {
    this.loadPage(0);
    // this.questionAnswerService.getAllUserQA().subscribe({
    //   next: (data) => {
    //     this.questionAnswers = data;
    //   },
    //   error: (error) => {
    //     console.error('Error fetching question and answer data:', error);
    //   }
    // });

  }

  loadPage(page: number) {
    this.questionAnswerService.getPagedQuestionAnswers(page, this.pageSize).subscribe(res => {
      this.questionAnswers = res.content;
      this.totalPages = res.totalPages;
      this.currentPage = res.number;
    });
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.loadPage(page);
    }
  }

    getImageSrc(imageData: string): string {
      return this.sanitizer.bypassSecurityTrustUrl(
        'data:image/jpeg;base64,' + imageData
      ) as string;
    }

    onEdit(qa: any): void {
      this.router.navigate(['/addquestionanswer'], { queryParams: { id: qa.id } });
    }

    onDelete(qa: any): void {
      this.questionAnswerService.deleteUserQAById(qa.id).subscribe({
        next: (response) => {
          console.log('QA deleted successfully:', response);
          this.questionAnswers = this.questionAnswers.filter(item => item.id !== qa.id);
        },
        error: (error) => {
          console.error('Error deleting QA:', error);
        }
      });
    }
  }
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { TechnologyService } from '../../service/technology.service';
import { Subject, takeUntil } from 'rxjs';
import { Technology } from '../../models/Technology';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-qa-home',
  imports: [CommonModule,],
  templateUrl: './qa-home.component.html',
  styleUrl: './qa-home.component.scss'
})
export class QaHomeComponent implements OnInit {
  destroyed$ = new Subject<void>();
  technologies: Technology[] = [];
  constructor(private technologyService: TechnologyService,
    private qaService: QuestionAnswerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Initialization logic can be added here
    this.technologyService.getAllTechnologies().pipe(takeUntil(this.destroyed$)).subscribe({
      next: data => {
        this.technologies = data
      },
      error: err => {
        console.error('Error fetching technologies:', err);
      }
    });
  }

  popularQuestions = [
    {
      question: 'What is JVM?',
      shortAnswer: 'JVM is a virtual machine that enables Java bytecode execution...'
    },
    {
      question: 'What is Dependency Injection?',
      shortAnswer: 'DI is a design pattern used to implement IoC...'
    }
  ];

  onLoadQA(qa: any) {
    this.qaService.getQAByTopic(qa.name).pipe(takeUntil(this.destroyed$)).subscribe({
      next: (data) => {
        this.router.navigate(['/qa-tutorial'], { queryParams: { topic: qa.name } });
      },
      error: (error) => {
        console.log('error', error);
      }
    });

  }
}

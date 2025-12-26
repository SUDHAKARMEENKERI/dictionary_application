import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { TechnologyService } from '../../service/technology.service';
import { Subject, takeUntil } from 'rxjs';
import { Technology } from '../../models/Technology';

@Component({
  selector: 'app-qa-home',
  imports: [CommonModule,],
  templateUrl: './qa-home.component.html',
  styleUrl: './qa-home.component.scss'
})
export class QaHomeComponent implements OnInit {
  destroyed$ = new Subject<void>();
  technologies: Technology[] = [];
  constructor(private technologyService: TechnologyService) { }

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
}

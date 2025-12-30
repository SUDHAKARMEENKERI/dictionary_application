import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { TechnologyService } from '../../service/technology.service';
import { Subject, takeUntil } from 'rxjs';
import { Technology } from '../../models/Technology';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-qa-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './qa-home.component.html',
  styleUrl: './qa-home.component.scss'
})
export class QaHomeComponent implements OnInit {
  destroyed$ = new Subject<void>();
  technologies: Technology[] = [];

  searchQuery = '';
  constructor(
    private technologyService: TechnologyService,
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

  onOpenCategory(tech: Technology) {
    const firstTopic = tech.items?.[0]?.name;
    this.router.navigate(['/tutorial'], {
      queryParams: { category: tech.slug || tech.name, topic: firstTopic }
    });
  }

  onLoadQA(tech: Technology, item: { name: string }) {
    this.router.navigate(['/tutorial'], {
      queryParams: { category: tech.slug || tech.name, topic: item.name }
    });
  }

  private normalize(value: unknown): string {
    return (value ?? '').toString().trim().toLowerCase();
  }

  get filteredTechnologies(): Technology[] {
    const q = this.normalize(this.searchQuery);
    if (!q) return this.technologies;

    return (this.technologies || [])
      .map((tech) => {
        const techName = this.normalize(tech?.name);
        const techSlug = this.normalize(tech?.slug);
        const techMatches = techName.includes(q) || techSlug.includes(q);

        const items = (tech?.items || []).filter((item) => {
          const itemName = this.normalize(item?.name);
          return techMatches || itemName.includes(q);
        });

        if (!techMatches && items.length === 0) return null;

        return {
          ...tech,
          items
        } as Technology;
      })
      .filter(Boolean) as Technology[];
  }

  get hasSearchResults(): boolean {
    return this.filteredTechnologies.some((t) => (t.items || []).length > 0);
  }
}

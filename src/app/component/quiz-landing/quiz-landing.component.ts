import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Technology } from '../../models/Technology';
import { TechnologyService } from '../../service/technology.service';

@Component({
  selector: 'app-quiz-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-landing.component.html',
  styleUrl: './quiz-landing.component.scss'
})
export class QuizLandingComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isLoading = false;
  technologies: Technology[] = [];
  searchQuery = '';

  get filteredTechnologies(): Technology[] {
    const query = (this.searchQuery ?? '').toString().trim().toLowerCase();
    if (!query) return this.technologies;

    return (this.technologies || [])
      .map((tech) => {
        const techName = (tech?.name ?? '').toString();
        const techSlug = (tech?.slug ?? '').toString();
        const matchesTech = [techName, techSlug].some((v) => v.toLowerCase().includes(query));

        const items = tech?.items || [];
        const filteredItems = matchesTech
          ? items
          : items.filter((i) => ((i?.name ?? '').toString().toLowerCase().includes(query)));

        return {
          ...tech,
          items: filteredItems,
        } as Technology;
      })
      .filter((tech) => {
        const techName = (tech?.name ?? '').toString().toLowerCase();
        const techSlug = (tech?.slug ?? '').toString().toLowerCase();
        return techName.includes(query) || techSlug.includes(query) || (tech?.items?.length ?? 0) > 0;
      });
  }

  get hasSearchResults(): boolean {
    return (this.filteredTechnologies || []).some((t) => (t?.items?.length ?? 0) > 0);
  }

  constructor(
    private readonly technologyService: TechnologyService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Backward compatibility: if someone deep-links to /quiz?topic=..., take them straight to the quiz.
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const topic = (params?.['topic'] ?? '').toString().trim();
      if (topic) {
        this.router.navigate(['/quiz/play'], { queryParams: { ...params, topic } });
      }
    });

    this.isLoading = true;
    this.technologyService
      .getAllTechnologies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.technologies = data || [];
          this.isLoading = false;
        },
        error: () => {
          this.technologies = [];
          this.isLoading = false;
        }
      });
  }

  startGeneralQuiz(): void {
    this.router.navigate(['/quiz/play']);
  }

  startTopicQuiz(tech: Technology, topic: string): void {
    const cleaned = (topic ?? '').toString().trim();
    if (!cleaned) return;

    const category = (tech?.slug || tech?.name || '').toString().trim();
    this.router.navigate(['/quiz/play'], {
      queryParams: category ? { topic: cleaned, category } : { topic: cleaned },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

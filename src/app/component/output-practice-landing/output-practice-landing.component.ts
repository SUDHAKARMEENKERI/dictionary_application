import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DropdownResponse, Technology } from '../../models/Technology';
import { TechnologyService } from '../../service/technology.service';

@Component({
  selector: 'app-output-practice-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './output-practice-landing.component.html',
  styleUrl: './output-practice-landing.component.scss',
})
export class OutputPracticeLandingComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isLoading = false;
  technologies: Technology[] = [];
  categories: DropdownResponse[] = [];
  searchQuery = '';

  constructor(
    private readonly technologyService: TechnologyService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Backward compatibility: if someone deep-links to /output-practice?topic=..., take them straight to practice.
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const topic = (params?.['topic'] ?? '').toString().trim();
      if (topic) {
        this.router.navigate(['/output-practice/play'], { queryParams: { ...params, topic } });
      }
    });

    this.isLoading = true;

    // Load categories so we can pass numeric `category` id in query params.
    this.technologyService
      .getAllTechCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cats) => {
          this.categories = cats || [];
        },
        error: () => {
          this.categories = [];
        },
      });

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
        },
      });
  }

  private normalizeKey(value: unknown): string {
    return (value ?? '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  private resolveCategoryIdForTech(tech: Technology): number | null {
    const slugKey = this.normalizeKey(tech?.slug);
    const nameKey = this.normalizeKey(tech?.name);
    if (!slugKey && !nameKey) return null;

    const match = (this.categories || []).find((c) => {
      const key = this.normalizeKey(c?.name);
      return !!key && (key === slugKey || key === nameKey);
    });

    const id = (match?.id ?? null) as any;
    return typeof id === 'number' && Number.isFinite(id) ? id : null;
  }

  startGeneralPractice(): void {
    this.router.navigate(['/output-practice/play']);
  }

  startTopicPractice(tech: Technology, topic: string): void {
    const cleaned = (topic ?? '').toString().trim();
    if (!cleaned) return;

    const categoryId = this.resolveCategoryIdForTech(tech);
    if (categoryId !== null) {
      this.router.navigate(['/output-practice/play'], {
        queryParams: { topic: cleaned, category: String(categoryId) },
      });
      return;
    }

    // Fallback: keep old behavior if we couldn't resolve an id.
    const category = (tech?.slug || tech?.name || '').toString().trim();
    this.router.navigate(['/output-practice/play'], {
      queryParams: category ? { topic: cleaned, category } : { topic: cleaned },
    });
  }

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

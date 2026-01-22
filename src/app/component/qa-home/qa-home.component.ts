import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { OnDestroy, OnInit } from '@angular/core';
import { TechnologyService } from '../../service/technology.service';
import { Subject, takeUntil } from 'rxjs';
import { Technology } from '../../models/Technology';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { apiFallback } from '../../util/apiRx';
import { AdsenseAdComponent } from '../../shared/adsense-ad/adsense-ad.component';

@Component({
  selector: 'app-qa-home',
  imports: [CommonModule, FormsModule, RouterLink, AdsenseAdComponent],
  templateUrl: './qa-home.component.html',
  styleUrl: './qa-home.component.scss'
})
export class QaHomeComponent implements OnInit, OnDestroy {
  private readonly destroyed$ = new Subject<void>();
  technologies: Technology[] = [];

  searchQuery = '';
  constructor(
    private technologyService: TechnologyService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.technologyService
      .getAllTechnologies()
      .pipe(
        apiFallback([] as Technology[], 'Error fetching technologies'),
        takeUntil(this.destroyed$)
      )
      .subscribe((data) => {
        this.technologies = data || [];
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
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
    this.router.navigate(['/tutorial', tech.slug || tech.name, firstTopic || '']);
  }

  onLoadQA(tech: Technology, item: { name: string }) {
    this.router.navigate(['/tutorial', tech.slug || tech.name, item.name]);
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

  getIconSrc(icon: string | undefined | null): string {
    const raw = (icon ?? '').toString().trim();
    if (!raw) return 'assets/images/database.png';

    // Allow absolute URLs and data URIs.
    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) return raw;

    // Normalize Windows/backslash paths.
    const normalized = raw.replace(/\\/g, '/');

    // If backend sends full public path, strip it.
    const withoutPublicPrefix = normalized.replace(/^public\//i, '');

    // If already points to assets, keep as-is.
    if (withoutPublicPrefix.startsWith('assets/')) return withoutPublicPrefix;

    // If starts with a leading slash, keep it relative to site root.
    if (withoutPublicPrefix.startsWith('/assets/')) return withoutPublicPrefix.slice(1);

    // If it looks like a filename, assume it's under assets/images.
    return `assets/images/${withoutPublicPrefix}`;
  }
}

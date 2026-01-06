import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Technology, TechnologyItem } from '../../models/Technology';
import { TechnologyService } from '../../service/technology.service';
import { apiFallback } from '../../util/apiRx';

@Component({
  selector: 'app-seo-category-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seo-category-landing.component.html',
  styleUrl: './seo-category-landing.component.scss'
})
export class SeoCategoryLandingComponent implements OnInit, OnDestroy {
  private readonly destroyed$ = new Subject<void>();

  categoryKey = '';
  categoryTitle = '';
  categorySegment = '';
  topics: TechnologyItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private technologyService: TechnologyService
  ) {}

  ngOnInit(): void {
    this.categoryKey = (this.route.snapshot.data?.['category'] ?? '').toString();

    this.technologyService
      .getAllTechnologies()
      .pipe(
        apiFallback([] as Technology[], 'Error fetching technologies'),
        takeUntil(this.destroyed$)
      )
      .subscribe((techs) => {
        const list = techs || [];
        const key = this.normalize(this.categoryKey);

        const match =
          list.find((t) => this.normalize(t.slug) === key) ||
          list.find((t) => this.normalize(t.name) === key);

        this.categoryTitle = match?.name || this.categoryKey || 'Interview';
        this.categorySegment = match?.slug || match?.name || this.categoryKey;
        this.topics = match?.items || [];
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private normalize(value: unknown): string {
    return (value ?? '').toString().trim().toLowerCase();
  }
}

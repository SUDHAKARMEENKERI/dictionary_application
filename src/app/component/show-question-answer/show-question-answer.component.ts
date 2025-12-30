import { Component, OnInit, OnDestroy } from '@angular/core';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { from, of, Subject } from 'rxjs';
import { TechnologyService } from '../../service/technology.service';
import { Technology } from '../../models/Technology';
import { apiFallback } from '../../util/apiRx';
import { catchError, concatMap, defaultIfEmpty, filter, map, take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-show-question-answer',
  imports: [CommonModule, FormsModule],
  templateUrl: './show-question-answer.component.html',
  styleUrl: './show-question-answer.component.scss'
})

export class ShowQuestionAnswerComponent implements OnInit, OnDestroy {
  questionAnswers: any[] = [];

  qaSearchQuery = '';

  leftSearchQuery = '';

  readonly levels = ['basic', 'intermediate', 'advanced'] as const;
  selectedLevel: (typeof this.levels)[number] = 'basic';

  technologies: string[] = [];
  selectedTechnology: string = 'All';

  // For a structured left sidebar (Technology -> Topics)
  technologySections: Technology[] = [];

  private technologyIndex: Technology[] = [];
  private selectedTechAllQAs: any[] = [];
  private isAllMode = true;

  totalResults = 0;

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  private destroy$ = new Subject<void>();

  constructor(private questionAnswerService: QuestionAnswerService,
    private technologyService: TechnologyService,
    private sanitizer: DomSanitizer,
    private router: Router) { }

  ngOnInit(): void {
    this.loadTechnologies();
    this.selectTechnology('All');
  }

  get filteredTechnologySections(): Technology[] {
    const query = (this.leftSearchQuery ?? '').toString().trim().toLowerCase();
    if (!query) return this.technologySections;

    return (this.technologySections || [])
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

  get filteredTechnologiesFlat(): string[] {
    const query = (this.leftSearchQuery ?? '').toString().trim().toLowerCase();
    if (!query) return this.technologies;

    const list = (this.technologies || []).filter((t) => {
      if (t === 'All') return true;
      return (t ?? '').toString().toLowerCase().includes(query);
    });

    return list.length > 0 ? list : ['All'];
  }

  get displayQuestionAnswers(): any[] {
    const query = (this.qaSearchQuery ?? '').toString().trim().toLowerCase();
    if (!query) return this.questionAnswers;

    // In topic mode, questionAnswers already reflects the filtered + paged slice.
    if (!this.isAllMode) return this.questionAnswers;

    return (this.questionAnswers || []).filter((qa) => this.matchesQaSearch(qa, query));
  }

  setLevel(level: (typeof this.levels)[number]): void {
    this.selectedLevel = level;
    this.currentPage = 0;

    if (this.isAllMode) {
      this.loadPage(0);
      return;
    }

    this.applyTopicSearchAndRefresh();
  }

  private getQaLevel(qa: any): (typeof this.levels)[number] {
    const raw = (
      qa?.level ??
      qa?.difficulty ??
      qa?.questionLevel ??
      qa?.experienceLevel ??
      ''
    )
      .toString()
      .trim()
      .toLowerCase();

    if (raw.startsWith('adv')) return 'advanced';
    if (raw.startsWith('int') || raw.startsWith('mid')) return 'intermediate';
    return 'basic';
  }

  levelLabel(qa: any): string {
    const lvl = this.getQaLevel(qa);
    if (lvl === 'advanced') return 'Advanced';
    if (lvl === 'intermediate') return 'Intermediate';
    return 'Basic';
  }

  private loadTechnologies(): void {
    this.technologyService
      .getAllTechnologies()
      .pipe(apiFallback([] as Technology[], 'Error loading technologies'), takeUntil(this.destroy$))
      .subscribe((data) => {
        this.technologyIndex = data || [];
        this.technologySections = this.technologyIndex;
        this.rebuildTechnologiesFromIndex();
      });
  }

  private rebuildTechnologiesFromIndex(): void {
    const names = new Set<string>();

    for (const tech of this.technologyIndex) {
      if (tech?.name) names.add(String(tech.name).trim());
      for (const item of tech?.items || []) {
        if (item?.name) names.add(String(item.name).trim());
      }
    }

    const list = Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b));
    this.technologies = ['All', ...list];
  }

  private rebuildTechnologiesFromCurrentData(): void {
    const names = new Set<string>();
    for (const qa of this.questionAnswers || []) {
      const t = this.getTechnologyLabel(qa);
      if (t) names.add(t);
    }
    const list = Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b));
    this.technologies = ['All', ...list];
  }

  selectTechnology(technology: string): void {
    this.selectedTechnology = technology || 'All';
    this.currentPage = 0;
    this.qaSearchQuery = '';

    if (this.selectedTechnology === 'All') {
      this.isAllMode = true;
      this.loadPage(0);
      return;
    }

    this.isAllMode = false;
    this.loadQAsForTopicWithFallback(this.selectedTechnology);
  }

  private loadQAsForTopicWithFallback(topicLabel: string): void {
    const candidates = this.buildTopicCandidates(topicLabel);

    from(candidates)
      .pipe(
        concatMap((candidate) =>
          this.questionAnswerService.getQAByTopic(candidate).pipe(
            catchError(() => of([] as any[])),
            map((qas) => ({ candidate, qas: (qas as any[]) || [] }))
          )
        ),
        filter((r) => r.qas.length > 0),
        take(1),
        defaultIfEmpty({ candidate: topicLabel, qas: [] as any[] }),
        takeUntil(this.destroy$)
      )
      .subscribe(({ qas }) => {
        this.selectedTechAllQAs = qas;
        this.applyTopicSearchAndRefresh();

        if (!this.technologies?.length || this.technologies.length === 1) {
          this.rebuildTechnologiesFromCurrentData();
        }
      });
  }

  onQaSearchChange(): void {
    if (this.isAllMode) return;
    this.currentPage = 0;
    this.applyTopicSearchAndRefresh();
  }

  private applyTopicSearchAndRefresh(): void {
    const list = this.getTopicSearchList();
    this.totalResults = list.length;
    this.totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
    this.updateVisibleSlice(list);
  }

  private getTopicSearchList(): any[] {
    const base = (this.selectedTechAllQAs || []).filter((qa) => this.getQaLevel(qa) === this.selectedLevel);
    const query = (this.qaSearchQuery ?? '').toString().trim().toLowerCase();
    if (!query) return base;
    return base.filter((qa) => this.matchesQaSearch(qa, query));
  }

  private matchesQaSearch(qa: any, queryLower: string): boolean {
    const haystack = [qa?.question, qa?.answer, qa?.topic]
      .filter(Boolean)
      .join(' ')
      .toString()
      .toLowerCase();
    return haystack.includes(queryLower);
  }

  private buildTopicCandidates(label: string): string[] {
    const raw = (label ?? '').toString().trim();
    if (!raw) return [];

    const normalized = this.normalizeKey(raw);
    const candidates: string[] = [raw];

    // If the label differs only by case/spacing, some backends still treat it differently.
    if (normalized && normalized !== raw) candidates.push(normalized);

    // Try matching tech slug/name from the technology index.
    for (const tech of this.technologyIndex || []) {
      const techName = (tech?.name ?? '').toString().trim();
      const techSlug = (tech?.slug ?? '').toString().trim();

      if (this.normalizeKey(techName) === normalized || this.normalizeKey(techSlug) === normalized) {
        if (techName) candidates.push(techName);
        if (techSlug) candidates.push(techSlug);
      }

      for (const item of tech?.items || []) {
        const itemName = (item?.name ?? '').toString().trim();
        if (this.normalizeKey(itemName) === normalized) {
          candidates.push(itemName);
        }
      }
    }

    // De-dupe, preserve order.
    const seen = new Set<string>();
    return candidates.filter((c) => {
      const v = (c ?? '').toString().trim();
      if (!v) return false;
      if (seen.has(v)) return false;
      seen.add(v);
      return true;
    });
  }

  private normalizeKey(value: string): string {
    return (value || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  loadPage(page: number) {
    const fallback = { content: [], totalPages: 1, number: page, totalElements: 0 } as any;

    this.questionAnswerService
      .getPagedQuestionAnswers(page, this.pageSize)
      .pipe(apiFallback(fallback, 'Error loading question answers'), takeUntil(this.destroy$))
      .subscribe((res: any) => {
        const content = (res?.content as any[]) ?? [];
        this.questionAnswers = content;
        this.totalPages = Math.max(1, Number(res?.totalPages ?? 1));
        this.currentPage = Number(res?.number ?? page);
        this.totalResults =
          typeof res?.totalElements === 'number' ? res.totalElements : (content?.length ?? 0);

        if (!this.technologyIndex?.length) {
          this.rebuildTechnologiesFromCurrentData();
        }
      });
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;

    if (this.isAllMode) {
      this.loadPage(page);
      return;
    }

    this.currentPage = page;
    this.updateVisibleSlice(this.getTopicSearchList());
  }

  private updateVisibleSlice(source?: any[]): void {
    const list = source ?? (this.selectedTechAllQAs || []);
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.questionAnswers = (list || []).slice(start, end);
  }

  private getTechnologyLabel(qa: any): string {
    const raw = (qa?.topic ?? '').toString().trim();
    return raw || 'General';
  }

  getImageSrc(imageData: string): string {
    return this.sanitizer.bypassSecurityTrustUrl(
      'data:image/jpeg;base64,' + imageData
    ) as string;
  }

  onEdit(qa: any): void {
    this.router.navigate(['/interview-qa/editor'], { queryParams: { id: qa.id } });
  }

  onDelete(qa: any): void {
    this.questionAnswerService
      .deleteUserQAById(qa.id)
      .pipe(apiFallback(null as any, 'Error deleting QA'), takeUntil(this.destroy$))
      .subscribe((response) => {
        if (!response) return;

        // Remove from the currently visible list
        this.questionAnswers = this.questionAnswers.filter(item => item.id !== qa.id);

        // Remove from topic cache when filtering by a technology
        if (!this.isAllMode) {
          this.selectedTechAllQAs = (this.selectedTechAllQAs || []).filter(item => item.id !== qa.id);
          const list = this.getTopicSearchList();
          this.totalResults = list.length;
          this.totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
          if (this.currentPage >= this.totalPages) {
            this.currentPage = Math.max(0, this.totalPages - 1);
          }
          this.updateVisibleSlice(list);
        }
      });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
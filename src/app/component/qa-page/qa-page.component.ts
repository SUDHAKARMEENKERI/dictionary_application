import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { QaListComponent } from '../qa-list/qa-list.component';
import { TutorialComponent } from '../tutorial/tutorial.component';
import { QuizComponent } from '../quiz/quiz.component';
import { ActivatedRoute, Router } from '@angular/router';
import { from, of, Subject, takeUntil } from 'rxjs';
import { QuestionAnswer, Technology, TechnologyItem } from '../../models/Technology';
import { TechnologyService } from '../../service/technology.service';
import { catchError, concatMap, defaultIfEmpty, filter, map, take } from 'rxjs/operators';

@Component({
  selector: 'app-qa-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './qa-page.component.html',
  styleUrl: './qa-page.component.scss',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QaPageComponent implements OnInit, OnDestroy {
  constructor(
    private activeRouter: ActivatedRoute,
    private questionAnswerService: QuestionAnswerService,
    private technologyService: TechnologyService,
    private router: Router
  ) { }

  private destroy$ = new Subject<void>();
  technologies: Technology[] = [];
  topics: TechnologyItem[] = [];
  topicSearchQuery = '';

  category = '';
  categoryTitle = '';

  questionAnswers: QuestionAnswer[] = [];
  topic: string = '';
  isLoadingQuestions = false;

  readonly levels = ['basic', 'intermediate', 'advanced'] as const;
  selectedLevel: (typeof this.levels)[number] = 'basic';

  ngOnInit(): void {
    this.technologyService.getAllTechnologies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.technologies = data || [];
          this.applySelectionFromUrl();
        },
        error: (error) => {
          console.error('Error loading technologies:', error);
        }
      });

    this.activeRouter.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applySelectionFromUrl();
      });
  }

  private normalize(value: string | null | undefined): string {
    return (value || '').trim().toLowerCase();
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

  private buildTopicCandidates(label: string): string[] {
    const raw = (label ?? '').toString().trim();
    if (!raw) return [];

    const normalized = this.normalizeKey(raw);
    const lower = raw.toLowerCase();

    const candidates: string[] = [raw];
    if (lower && lower !== raw) candidates.push(lower);
    if (normalized && normalized !== raw && normalized !== lower) candidates.push(normalized);

    const seen = new Set<string>();
    return candidates.filter((c) => {
      const v = (c ?? '').toString().trim();
      if (!v) return false;
      if (seen.has(v)) return false;
      seen.add(v);
      return true;
    });
  }

  private applySelectionFromUrl(): void {
    const params = this.activeRouter.snapshot.queryParams;
    this.category = params['category'] || '';
    const urlTopic = params['topic'] || '';

    if (!this.technologies?.length) {
      this.categoryTitle = this.category || 'Tutorial';
      if (urlTopic && urlTopic !== this.topic) {
        this.setTopic(urlTopic);
      } else if (urlTopic && (this.questionAnswers?.length ?? 0) === 0 && !this.isLoadingQuestions) {
        this.loadQuestions();
      }
      return;
    }

    const categoryKey = this.normalize(this.category);
    const topicKey = this.normalize(urlTopic);

    let selectedCategory: Technology | undefined;

    if (categoryKey) {
      selectedCategory = this.technologies.find(t => this.normalize(t.slug) === categoryKey)
        || this.technologies.find(t => this.normalize(t.name) === categoryKey);
    }

    if (!selectedCategory && topicKey) {
      selectedCategory = this.technologies.find(t => (t.items || []).some(i => this.normalize(i.name) === topicKey));
    }

    this.categoryTitle = selectedCategory?.name || (this.category || 'Tutorial');
    this.topics = selectedCategory?.items || [];

    const nextTopic = urlTopic || this.topics?.[0]?.name || '';
    if (nextTopic && nextTopic !== this.topic) {
      this.setTopic(nextTopic);
    }
  }

  private setTopic(nextTopic: string): void {
    this.topic = nextTopic;
    this.loadQuestions();
  }

  get filteredTopics(): TechnologyItem[] {
    const query = (this.topicSearchQuery ?? '').toString().trim().toLowerCase();
    if (!query) return this.topics;
    return (this.topics || []).filter((t) => ((t?.name ?? '').toString().toLowerCase().includes(query)));
  }

  onSelectTopic(topicName: string): void {
    this.router.navigate([], {
      relativeTo: this.activeRouter,
      queryParams: { category: this.category || this.categoryTitle, topic: topicName },
      queryParamsHandling: 'merge'
    });
  }

  setLevel(level: (typeof this.levels)[number]): void {
    this.selectedLevel = level;
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

  get questionAnswersBySelectedLevel(): QuestionAnswer[] {
    const list = (this.questionAnswers || []) as any[];
    return list.filter((qa) => this.getQaLevel(qa) === this.selectedLevel) as QuestionAnswer[];
  }

  private loadQuestions(): void {
    if (!this.topic) {
      this.questionAnswers = [];
      return;
    }

    this.isLoadingQuestions = true;

    const candidates = this.buildTopicCandidates(this.topic);

    from(candidates)
      .pipe(
        concatMap((candidate) =>
          this.questionAnswerService.getQAByTopic(candidate).pipe(
            catchError(() => of([] as QuestionAnswer[])),
            map((qas) => (qas || []) as QuestionAnswer[])
          )
        ),
        filter((qas) => (qas?.length ?? 0) > 0),
        take(1),
        defaultIfEmpty([] as QuestionAnswer[]),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          this.questionAnswers = data || [];
          this.isLoadingQuestions = false;
        },
        error: (error) => {
          console.error('Error loading questions:', error);
          this.questionAnswers = [];
          this.isLoadingQuestions = false;
        }
      });
  }

  trackByTopicName = (_: number, item: TechnologyItem) => item.name;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLoadQuiz() {
    const topic = (this.topic ?? '').toString().trim();
    const category = (this.category || this.categoryTitle || '').toString().trim();
    this.router.navigate(['/quiz'], { queryParams: topic ? (category ? { topic, category } : { topic }) : (category ? { category } : {}) });
  }

  onLoadPracticeQuestion() {
    const topic = (this.topic ?? '').toString().trim();
    const category = (this.category || this.categoryTitle || '').toString().trim();
    this.router.navigate(['/output-practice'], { queryParams: topic ? (category ? { topic, category } : { topic }) : (category ? { category } : {}) });
  }

}

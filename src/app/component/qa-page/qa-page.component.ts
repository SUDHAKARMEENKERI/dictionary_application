import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { QaListComponent } from '../qa-list/qa-list.component';
import { TutorialComponent } from '../tutorial/tutorial.component';
import { QuizComponent } from '../quiz/quiz.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { from, of, Subject, takeUntil } from 'rxjs';
import { QuestionAnswer, Technology, TechnologyItem } from '../../models/Technology';
import { TechnologyService } from '../../service/technology.service';
import { catchError, concatMap, defaultIfEmpty, filter, map, take } from 'rxjs/operators';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-qa-page',
  imports: [CommonModule, FormsModule, RouterLink],
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
    private router: Router,
    private title: Title,
    private meta: Meta
  ) { }

  private destroy$ = new Subject<void>();
  technologies: Technology[] = [];
  topics: TechnologyItem[] = [];
  topicSearchQuery = '';
  qaSearchQuery = '';

  category = '';
  categoryTitle = '';

  categorySegment = '';

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

    // Support both legacy query-param URLs (/tutorial?category=...&topic=...)
    // and crawlable path URLs (/tutorial/:category/:topic).
    this.activeRouter.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applySelectionFromUrl());

    this.activeRouter.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applySelectionFromUrl());
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
    const query = this.activeRouter.snapshot.queryParams;
    const pm = this.activeRouter.snapshot.paramMap;

    const categoryFromPath = pm.get('category') || '';
    const topicFromPath = pm.get('topic') || '';

    this.category = categoryFromPath || query['category'] || '';
    const urlTopic = topicFromPath || query['topic'] || '';

    this.categorySegment = this.category;

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

    // Prefer a stable segment for URLs (slug if available).
    this.categorySegment = selectedCategory?.slug || this.category || selectedCategory?.name || this.categoryTitle;

    const nextTopic = urlTopic || this.topics?.[0]?.name || '';
    if (nextTopic && nextTopic !== this.topic) {
      this.setTopic(nextTopic);
    }
  }

  private setTopic(nextTopic: string): void {
    this.topic = nextTopic;
    this.qaSearchQuery = '';
    this.loadQuestions();
    this.applyDynamicSeo();
  }

  private applyDynamicSeo(): void {
    const topic = (this.topic ?? '').toString().trim();
    const category = (this.categoryTitle ?? '').toString().trim();
    if (!topic) return;

    const pageTitle = `${topic} Interview Questions | CareerPrepBook`;
    const description = `Practice ${topic} interview questions with clear, interview-ready answers${category ? ` for ${category}` : ''}.`;

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }

  fixEncoding(value: unknown): string {
    // Common UTF-8 -> Windows-1252 mojibake seen in content pasted into non-UTF stores.
    return (value ?? '')
      .toString()
      .replace(/â€™|â€˜/g, "'")
      .replace(/â€œ|â€/g, '"')
      .replace(/â€“|â€”/g, '-')
      .replace(/â€¦/g, '...')
      .replace(/\u00c2\u00a0/g, ' ')
      .replace(/\u00a0/g, ' ');
  }

  private decodeEscapes(value: string): string {
    // Bulk uploads (CSV/JSON) often store line breaks as literal "\n".
    // Convert common escaped sequences so UI formatting matches existing content.
    return (value ?? '')
      .toString()
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t');
  }

  private matchesQaSearch(qa: any, queryLower: string): boolean {
    const haystack = [this.fixEncoding(qa?.question), this.fixEncoding(qa?.answer), this.fixEncoding(qa?.topic)]
      .filter(Boolean)
      .join(' ')
      .toString()
      .toLowerCase();
    return haystack.includes(queryLower);
  }

  get filteredTopics(): TechnologyItem[] {
    const query = (this.topicSearchQuery ?? '').toString().trim().toLowerCase();
    if (!query) return this.topics;
    return (this.topics || []).filter((t) => ((t?.name ?? '').toString().toLowerCase().includes(query)));
  }

  onSelectTopic(topicName: string): void {
    this.router.navigate(['/tutorial', this.categorySegment || (this.category || this.categoryTitle), topicName]);
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

  answerParts(answer: unknown):
    Array<
      | { kind: 'text'; text: string }
      | { kind: 'example'; label: 'Example' | 'Scenario'; text: string }
      | { kind: 'table'; headers: string[]; rows: string[][] }
    > {
    const raw = this.decodeEscapes(this.fixEncoding(answer));
    if (!raw.trim()) return [];

    // If "Example:/Scenario:/e.g." appears mid-line, split it onto a new line
    // so our block parser can render it as a styled callout.
    const prepareAnswer = (value: string): string => {
      const baseLines = (value ?? '').toString().replace(/\r\n/g, '\n').split('\n');
      const result: string[] = [];

      const findFirstMarker = (line: string): { index: number } | null => {
        const patterns: RegExp[] = [
          /\bexamples?\b\s*[:\-]/i,
          /\bscenarios?\b\s*[:\-]/i,
          /\b(e\.g\.|eg)\b\s*[:\-–—]/i,
        ];

        let bestIndex = Number.POSITIVE_INFINITY;

        for (const re of patterns) {
          const m = re.exec(line);
          if (!m || typeof m.index !== 'number') continue;
          if (m.index < bestIndex) bestIndex = m.index;
        }

        if (!Number.isFinite(bestIndex)) return null;
        return { index: bestIndex };
      };

      for (const line of baseLines) {
        const info = findFirstMarker(line);
        if (!info || info.index <= 0) {
          result.push(line);
          continue;
        }

        const before = line.slice(0, info.index).trimEnd();
        const after = line.slice(info.index).trimStart();
        if (before) result.push(before);
        result.push(after);
      }

      return result.join('\n');
    };

    const prepared = prepareAnswer(raw);

    const lines = prepared.split(/\r?\n/);
    const parts:
      Array<
        | { kind: 'text'; text: string }
        | { kind: 'example'; label: 'Example' | 'Scenario'; text: string }
        | { kind: 'table'; headers: string[]; rows: string[][] }
      > = [];

    let textBuffer: string[] = [];
    let exampleBuffer: string[] = [];
    let exampleLabel: 'Example' | 'Scenario' = 'Example';
    let tableBuffer: string[][] = [];
    let inExample = false;
    let inTable = false;

    const splitColumns = (value: string): string[] | null => {
      const line = (value ?? '').toString();
      if (!line.trim()) return null;

      if (/\t+/.test(line)) {
        const cols = line.split(/\t+/).map((c) => c.trim());
        return cols.length >= 2 ? cols : null;
      }

      if (/\s{2,}/.test(line.trim())) {
        const cols = line.trim().split(/\s{2,}/).map((c) => c.trim());
        return cols.length >= 2 ? cols : null;
      }

      if (line.includes('|')) {
        const cols = line
          .split('|')
          .map((c) => c.trim())
          .filter((c) => c.length > 0);
        return cols.length >= 2 ? cols : null;
      }

      return null;
    };

    const flushText = () => {
      const text = textBuffer.join('\n').trimEnd();
      if (text) parts.push({ kind: 'text', text });
      textBuffer = [];
    };

    const flushExample = () => {
      const text = exampleBuffer.join('\n').trimEnd();
      if (text) parts.push({ kind: 'example', label: exampleLabel, text });
      exampleBuffer = [];
    };

    const flushTable = () => {
      if (tableBuffer.length < 2) {
        for (const row of tableBuffer) {
          textBuffer.push(row.join('\t'));
        }
        tableBuffer = [];
        return;
      }

      const maxCols = Math.max(...tableBuffer.map((r) => r.length));
      const headers = (tableBuffer[0] || []).map((c) => (c ?? '').toString().trim());
      while (headers.length < maxCols) headers.push('');

      const rows = (tableBuffer.slice(1) || []).map((r) => {
        const row = r.map((c) => (c ?? '').toString().trim());
        while (row.length < maxCols) row.push('');
        return row;
      });

      parts.push({ kind: 'table', headers, rows });
      tableBuffer = [];
    };

    for (let idx = 0; idx < lines.length; idx++) {
      const line = (lines[idx] ?? '').toString();

      const exampleMatch = line.match(/^\s*(examples?|scenarios?|scenario|eg|e\.g\.)\s*(?:[:\-]\s*)?(.*)$/i);
      if (exampleMatch) {
        if (inTable) {
          flushTable();
          inTable = false;
        }
        if (inExample) {
          flushExample();
          inExample = false;
        }
        flushText();
        inExample = true;

        const keyword = (exampleMatch[1] ?? '').toString().trim().toLowerCase();
        exampleLabel = keyword.startsWith('scen') ? 'Scenario' : 'Example';

        const first = (exampleMatch[2] ?? '').toString();
        if (first) exampleBuffer.push(first);
        continue;
      }

      if (inExample) {
        if (!line.trim()) {
          flushExample();
          inExample = false;
          continue;
        }
        exampleBuffer.push(line);
        continue;
      }

      if (inTable) {
        if (!line.trim()) {
          flushTable();
          inTable = false;
          continue;
        }

        const cols = splitColumns(line);
        if (cols && cols.length >= 2) {
          tableBuffer.push(cols);
          continue;
        }

        flushTable();
        inTable = false;
        idx--;
        continue;
      }

      const cols = splitColumns(line);
      if (cols && cols.length >= 2) {
        const next = idx + 1 < lines.length ? (lines[idx + 1] ?? '').toString() : '';
        const nextCols = next.trim() ? splitColumns(next) : null;
        if (nextCols && nextCols.length >= 2) {
          flushText();
          inTable = true;
          tableBuffer = [cols];
          continue;
        }
      }

      textBuffer.push(line);
    }

    if (inTable) flushTable();
    if (inExample) flushExample();
    flushText();

    return parts;
  }

  get questionAnswersBySelectedLevel(): QuestionAnswer[] {
    const list = (this.questionAnswers || []) as any[];
    return list.filter((qa) => this.getQaLevel(qa) === this.selectedLevel) as QuestionAnswer[];
  }

  get filteredQuestionAnswersBySelectedLevel(): QuestionAnswer[] {
    const query = (this.qaSearchQuery ?? '').toString().trim().toLowerCase();

    // When searching, search across ALL levels.
    // When not searching, keep the normal selected-level browsing behavior.
    const base = (query ? (this.questionAnswers || []) : this.questionAnswersBySelectedLevel) as any[];
    if (!query) return base as QuestionAnswer[];
    return base.filter((qa) => this.matchesQaSearch(qa, query)) as QuestionAnswer[];
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

import { Component, OnInit, OnDestroy } from '@angular/core';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { from, of, Subject, forkJoin } from 'rxjs';
import { TechnologyService } from '../../service/technology.service';
import { Technology } from '../../models/Technology';
import { apiEmpty, apiFallback } from '../../util/apiRx';
import { catchError, concatMap, defaultIfEmpty, filter, map, take, takeUntil, finalize } from 'rxjs/operators';
import { readLoginMobile } from '../../util/loginStorage';
import { ADMIN_MOBILE } from '../../util/app-constants';
import { jsPDF } from 'jspdf';

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
  pageSize = 25;
  totalPages = 0;
  private destroy$ = new Subject<void>();

  private readonly currentMobile = readLoginMobile();
  private readonly adminMobile = ADMIN_MOBILE;

  selectedQuestions: any[] = [];
  isGeneratingPdf = false;
  isAdmin = false;

  constructor(private questionAnswerService: QuestionAnswerService,
    private technologyService: TechnologyService,
    private sanitizer: DomSanitizer,
    private router: Router) { }

  canManageQa(qa: any): boolean {
    const current = (this.currentMobile ?? '').toString().trim();
    if (!current) return false;
    if (current === this.adminMobile) return true;

    const owner = this.getQaOwnerMobile(qa);
    console.log('QA Owner:', owner, 'Current User:', current);
    if (!owner) return false;
    return owner === current;
  }

  private getQaOwnerMobile(qa: any): string {
    const candidates = [
      qa?.mobile,
      qa?.userMobile,
      qa?.mobileNo,
      qa?.createdByMobile,
      qa?.createdBy?.mobile,
      qa?.ownerMobile
    ];
    for (const c of candidates) {
      const v = (c ?? '').toString().trim();
      if (v) return v;
    }
    return '';
  }

  ngOnInit(): void {
    this.isAdmin = (this.currentMobile ?? '').toString().trim() === this.adminMobile;
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
    const base = this.isAllMode
      ? (this.questionAnswers || []).filter((qa) => this.getQaLevel(qa) === this.selectedLevel)
      : (this.questionAnswers || []);

    if (!query) return base;

    // Topic mode filtering happens in applyTopicSearchAndRefresh().
    if (!this.isAllMode) return base;

    // In All mode we keep server paging; if the backend supports server-side search,
    // results will already be filtered in the returned page.
    return base;
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

      // Prefer tabs when present.
      if (/\t+/.test(line)) {
        const cols = line.split(/\t+/).map((c) => c.trim());
        return cols.length >= 2 ? cols : null;
      }

      // Common: multiple spaces used to align columns.
      if (/\s{2,}/.test(line.trim())) {
        const cols = line.trim().split(/\s{2,}/).map((c) => c.trim());
        return cols.length >= 2 ? cols : null;
      }

      // Fallback: pipe-separated table (keep it conservative).
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
        // Not enough rows to be a real table; treat as text.
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

      // Example blocks take priority.
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
        // End example block on blank line.
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

        // End of table block; re-process this line as normal text.
        flushTable();
        inTable = false;
        idx--;
        continue;
      }

      // Try to start a table block (require at least 2 consecutive table lines).
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
    this.currentPage = 0;

    if (this.isAllMode) {
      // All mode is server-paged; search must be applied via the API.
      this.loadPage(0);
      return;
    }

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
    const haystack = [this.fixEncoding(qa?.question), this.fixEncoding(qa?.answer), this.fixEncoding(qa?.topic)]
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
      .getPagedQuestionAnswers(page, this.pageSize, this.selectedLevel, this.qaSearchQuery)
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
    } else {
      this.currentPage = page;
      this.updateVisibleSlice(this.getTopicSearchList());
    }

    // Scroll to top of the page to show the new questions
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get paginationItems(): Array<number | 'ellipsis'> {
    const total = Math.max(1, Number(this.totalPages ?? 1));
    const current = Math.min(Math.max(0, Number(this.currentPage ?? 0)), total - 1);

    // Keep it compact so it doesn't stretch on desktop.
    const maxButtons = 7;

    if (total <= maxButtons) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const first = 0;
    const last = total - 1;

    // Window around current page
    const windowSize = 3; // current +/- 1 plus itself
    let start = Math.max(first + 1, current - 1);
    let end = Math.min(last - 1, current + 1);

    // Expand a bit if we're near the edges
    if (current <= first + 2) {
      start = first + 1;
      end = first + windowSize;
    } else if (current >= last - 2) {
      start = last - windowSize;
      end = last - 1;
    }

    const items: Array<number | 'ellipsis'> = [first];

    if (start > first + 1) items.push('ellipsis');
    for (let i = start; i <= end; i++) items.push(i);
    if (end < last - 1) items.push('ellipsis');

    items.push(last);
    return items;
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
    if (!this.canManageQa(qa)) return;
    this.router.navigate(['/interview-qa/editor'], { queryParams: { id: qa.id } });
  }

  onDelete(qa: any): void {
    if (!this.canManageQa(qa)) return;
    this.questionAnswerService
      .deleteUserQAById(qa.id)
      // Many backends return an empty body for DELETE; treat next() as success.
      // On error, don't emit anything so the UI isn't mutated.
      .pipe(apiEmpty('Error deleting QA'), takeUntil(this.destroy$))
      .subscribe(() => {
        // Optimistically remove from current view for instant UI feedback.
        this.questionAnswers = (this.questionAnswers || []).filter((item) => item?.id !== qa.id);

        if (this.isAllMode) {
          // In All mode, data is server-paged; reload the page so counts/pages are consistent.
          const willBeEmpty = (this.questionAnswers?.length ?? 0) === 0;
          const targetPage = willBeEmpty && this.currentPage > 0 ? this.currentPage - 1 : this.currentPage;
          this.loadPage(targetPage);
          return;
        }

        // Topic mode: maintain the cached full list, then recalc paging and slice.
        this.selectedTechAllQAs = (this.selectedTechAllQAs || []).filter((item) => item?.id !== qa.id);
        const list = this.getTopicSearchList();
        this.totalResults = list.length;
        this.totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
        if (this.currentPage >= this.totalPages) {
          this.currentPage = Math.max(0, this.totalPages - 1);
        }
        this.updateVisibleSlice(list);
      });
  }
  isQuestionSelected(qa: any): boolean {
    return this.selectedQuestions.some((q) => q.id === qa.id);
  }

  toggleQuestionSelection(qa: any, event: Event): void {
    event.stopPropagation();
    const index = this.selectedQuestions.findIndex((q) => q.id === qa.id);

    if (index > -1) {
      this.selectedQuestions.splice(index, 1);
    } else {
      this.selectedQuestions.push(qa);
    }
  }

  generatePdf(): void {
    if (!this.isAdmin || this.selectedQuestions.length === 0) {
      return;
    }

    this.isGeneratingPdf = true;

    const allQuestions = this.selectedQuestions.map((qa) => ({
      ...qa,
      technology: this.selectedTechnology !== 'All' ? this.selectedTechnology : (qa.topic || 'General'),
      topic: qa.topic || this.selectedTechnology
    }));

    // Generate PDF immediately since we already have the data
    setTimeout(() => {
      this.buildPdf(allQuestions);
      this.isGeneratingPdf = false;
    }, 100);
  }

  private buildPdf(questions: any[]): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const cardGap = 12;
    const cardPadding = 14;
    const cardTopOffset = 6;
    const footerReserve = 110;
    const sectionSpacing = 10;

    const brand = { r: 29, g: 78, b: 216 };
    const neutral = { r: 15, g: 23, b: 42 };
    const questionColor = { r: 30, g: 64, b: 175 };
    const answerColor = { r: 217, g: 119, b: 6 };

    const lineHeightFor = (size: number) => Math.round(size * 1.4);

    const questionFontSize = 11;
    const answerFontSize = 10;
    const metaFontSize = 9;

    const drawRounded = (x: number, yPos: number, w: number, h: number, radius = 10) => {
      const anyDoc = doc as any;
      if (typeof anyDoc.roundedRect === 'function') {
        anyDoc.roundedRect(x, yPos, w, h, radius, radius, 'FD');
      } else {
        doc.rect(x, yPos, w, h, 'F');
      }
    };

    // Header
    doc.setFillColor(brand.r, brand.g, brand.b);
    doc.rect(0, 0, pageWidth, 86, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('CareerPrepBook.Com', margin, 36);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Interview Questions & Answers', margin, 56);

    y = 108;
    doc.setTextColor(neutral.r, neutral.g, neutral.b);

    // Topic Badge
    const topicText = this.selectedTechnology !== 'All' ? this.selectedTechnology : 'Mixed Topics';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const badgeWidth = doc.getTextWidth(`Topic: ${topicText}`) + 18;
    doc.setFillColor(224, 231, 255);
    doc.setTextColor(30, 64, 175);
    const drawRoundedBadge = (x: number, yPos: number, w: number, h: number, radius = 11) => {
      const anyDoc = doc as any;
      if (typeof anyDoc.roundedRect === 'function') {
        anyDoc.roundedRect(x, yPos, w, h, radius, radius, 'FD');
      } else {
        doc.rect(x, yPos, w, h, 'F');
      }
    };
    drawRoundedBadge(margin, y - 14, badgeWidth, 22, 11);
    doc.text(`Topic: ${topicText}`, margin + 9, y + 1);

    // Stats
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const statsText = `Questions: ${questions.length} | Level: ${this.selectedLevel}`;
    doc.setTextColor(71, 85, 105);
    doc.text(statsText, margin + badgeWidth + 14, y + 1);

    y += 20;

    const wrapLines = (text: string, fontSize: number, font: string, style: 'normal' | 'bold' | 'italic', width = contentWidth) => {
      doc.setFont(font, style);
      doc.setFontSize(fontSize);
      return doc.splitTextToSize(text || '', width) as string[];
    };

    const addLines = (lines: string[], x: number, yPos: number, font: string, style: 'normal' | 'bold' | 'italic', fontSize: number) => {
      doc.setFont(font, style);
      doc.setFontSize(fontSize);
      const lh = lineHeightFor(fontSize);
      lines.forEach(line => {
        doc.text(line, x, yPos);
        yPos += lh;
      });
      return yPos;
    };

    questions.forEach((q, index) => {
      const questionText = this.fixEncoding(q.question) || q.questionText || q.ques || '';
      const answerText = this.fixEncoding(q.answer) || q.ans || '';
      const technology = q.technology || '';
      const topic = q.topic || '';

      const metaLines = wrapLines(`${technology} > ${topic}`, metaFontSize, 'helvetica', 'italic');
      const questionLines = wrapLines(`Q${index + 1}. ${questionText}`, questionFontSize, 'helvetica', 'bold');
      const answerLines = answerText ? wrapLines(`Answer: ${answerText}`, answerFontSize, 'helvetica', 'normal') : [];

      const blockHeight = [
        metaLines.length * lineHeightFor(metaFontSize),
        questionLines.length * lineHeightFor(questionFontSize),
        answerLines.length * lineHeightFor(answerFontSize),
      ].reduce((a, b) => a + b, 0)
        + cardPadding * 2
        + cardTopOffset
        + sectionSpacing * 2;

      if (y + blockHeight > pageHeight - margin - footerReserve) {
        doc.addPage();
        y = margin;
      }

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      drawRounded(margin, y, contentWidth, blockHeight, 12);

      let yCursor = y + cardPadding + cardTopOffset;
      
      // Meta info
      doc.setTextColor(100, 116, 139);
      yCursor = addLines(metaLines, margin + cardPadding, yCursor, 'helvetica', 'italic', metaFontSize);
      
      yCursor += sectionSpacing;
      
      // Question
      doc.setTextColor(questionColor.r, questionColor.g, questionColor.b);
      yCursor = addLines(questionLines, margin + cardPadding, yCursor, 'helvetica', 'bold', questionFontSize);

      // Answer
      if (answerLines.length) {
        yCursor += sectionSpacing;
        doc.setTextColor(answerColor.r, answerColor.g, answerColor.b);
        yCursor = addLines(answerLines, margin + cardPadding, yCursor, 'helvetica', 'normal', answerFontSize);
      }

      y += blockHeight + cardGap;
    });

    // Add footer to all pages
    const addFooter = (pageIndex: number, totalPages: number) => {
      const footerY = pageHeight - 40;
      const line1 = 'Practice more questions, quizzes, and interview prep at CareerPrepBook.Com';
      const line2 = 'Visit https://careerprepbook.com for more resources.';

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, footerY - 16, pageWidth - margin, footerY - 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const maxWidth = contentWidth - 20;
      const line1Wrapped = doc.splitTextToSize(line1, maxWidth) as string[];
      const line2Wrapped = doc.splitTextToSize(line2, maxWidth) as string[];
      const footerLines = [...line1Wrapped, ...line2Wrapped];
      const footerHeight = footerLines.length * 12 + 10;

      const boxY = footerY - footerHeight + 6;
      doc.setFillColor(241, 245, 249);
      drawRounded(margin, boxY, contentWidth, footerHeight, 10);

      let yCursor = boxY + 18;
      footerLines.forEach((line, idx) => {
        doc.setTextColor(idx === 0 ? 30 : 71, idx === 0 ? 64 : 85, idx === 0 ? 175 : 105);
        doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
        const textWidth = doc.getTextWidth(line);
        const x = margin + (contentWidth - textWidth) / 2;
        doc.text(line, x, yCursor);
        yCursor += 12;
      });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const pageLabel = `${pageIndex}/${totalPages}`;
      const pageWidthLabel = doc.getTextWidth(pageLabel);
      doc.text(pageLabel, margin + contentWidth - pageWidthLabel - 10, boxY + footerHeight - 6);
    };

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i += 1) {
      doc.setPage(i);
      addFooter(i, totalPages);

      const pageLabel = `${i}/${totalPages}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      if (i === 1) {
        doc.setTextColor(255, 255, 255);
        const textWidth = doc.getTextWidth(pageLabel);
        doc.text(pageLabel, pageWidth - margin - textWidth, 22);
      } else {
        doc.setTextColor(100, 116, 139);
        const textWidth = doc.getTextWidth(pageLabel);
        doc.text(pageLabel, pageWidth - margin - textWidth, 22);
      }
    }

    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`careerprepbook-qa-${timestamp}.pdf`);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
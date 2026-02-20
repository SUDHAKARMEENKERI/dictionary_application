import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { jsPDF } from 'jspdf';
import { MCQQuestionService } from '../../service/mcqQuestion.service';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { apiFallback } from '../../util/apiRx';
import { readLoginMobile } from '../../util/loginStorage';
import { ADMIN_MOBILE } from '../../util/app-constants';
import { ModalComponent, ModalDetails } from '../modal/modal.component';

type PromoQuestion = {
  question: string;
  code?: string;
  answer?: string;
  correctAnswer?: string;
  options?: string[];
  questionType?: string;
  topic?: string;
};

type QuestionTypeOption = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-admin-promo-pdf',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './admin-promo-pdf.component.html',
  styleUrl: './admin-promo-pdf.component.scss'
})
export class AdminPromoPdfComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly adminMobile = ADMIN_MOBILE;
  private readonly optionLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  questionTypeOptions: QuestionTypeOption[] = [
    { value: 'THEORY', label: 'Theory' },
    { value: 'MCQ', label: 'MCQ (Standard)' },
    { value: 'OUTPUTBASEDMCQ', label: 'Output Based MCQ' },
    { value: 'OUTPUTBASED', label: 'Output Based (Type Answer)' }
  ];

  selectedQuestionType = 'MCQ';
  questionCount = 10;
  isLoading = false;
  lastQuestions: PromoQuestion[] = [];
  selectedTopicLabel: string | null = null;
  selectedTopic = '';
  availableTopics: string[] = [];
  isLoadingTopics = false;

  modalDetails: ModalDetails = {
    isOpen: false,
    message: '',
    status: 'info',
    title: 'Promo PDF Generator'
  };

  constructor(
    private readonly mcqQuestionService: MCQQuestionService,
    private readonly questionAnswerService: QuestionAnswerService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (!this.isAdminUser) {
      this.showModal('Access denied. Admin only.', 'error');
      setTimeout(() => this.router.navigate(['/dashboard']), 1200);
      return;
    }
    this.loadTopics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAdminUser(): boolean {
    const mobile = (readLoginMobile() ?? '').toString().trim();
    return !!mobile && mobile === this.adminMobile;
  }

  onQuestionTypeChange(): void {
    this.selectedTopic = '';
    this.loadTopics();
  }

  updateCount(value: number): void {
    const safe = Math.max(10, Math.min(15, Number(value || 10)));
    this.questionCount = safe;
  }

  generatePdf(): void {
    if (!this.isAdminUser) {
      this.showModal('Access denied. Admin only.', 'error');
      return;
    }

    this.isLoading = true;
    this.lastQuestions = [];
    this.selectedTopicLabel = null;

    this.fetchPromoQuestions()
      .pipe(
        apiFallback<any[]>([], 'Failed to load promo questions'),
        finalize(() => (this.isLoading = false)),
        takeUntil(this.destroy$)
      )
      .subscribe((data: any) => {
        const normalized = this.normalizeQuestions(data);
        if (!normalized.length) {
          this.showModal('No questions found for the selected type.', 'warning');
          return;
        }

        const manualTopic = (this.selectedTopic ?? '').toString().trim();
        const selectedTopic = manualTopic || this.pickRandomTopic(normalized);
        const topicNormalized = selectedTopic.toLowerCase();
        const topicPool = selectedTopic
          ? normalized.filter(q => (q.topic ?? '').toString().trim().toLowerCase() === topicNormalized)
          : normalized;
        const pool = topicPool.length ? topicPool : normalized;
        this.selectedTopicLabel = selectedTopic || 'Mixed';
        const selected = this.pickRandom(pool, this.questionCount);
        this.lastQuestions = selected;
        this.buildPdf(selected);
      });
  }

  private loadTopics(): void {
    this.isLoadingTopics = true;
    this.fetchPromoQuestions()
      .pipe(
        apiFallback<any[]>([], 'Failed to load topics'),
        finalize(() => (this.isLoadingTopics = false)),
        takeUntil(this.destroy$)
      )
      .subscribe((data: any) => {
        const normalized = this.normalizeQuestions(data);
        const topics = Array.from(
          new Set(
            normalized
              .map(q => (q.topic ?? '').toString().trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));
        this.availableTopics = topics;
      });
  }

  private fetchPromoQuestions() {
    if (this.selectedQuestionType === 'THEORY') {
      return this.questionAnswerService.getAllUserQA();
    }
    return this.mcqQuestionService.getAllMcq({ questionType: this.selectedQuestionType });
  }

  private normalizeQuestions(data: any): PromoQuestion[] {
    const list = Array.isArray(data)
      ? data
      : (data?.data ?? data?.result ?? data?.items ?? data?.content ?? []);

    if (!Array.isArray(list)) return [];

    return list
      .map((item: any) => {
        const question = this.firstNonEmpty(
          item?.questionText,
          item?.prompt,
          item?.question,
          item?.ques,
          item?.title
        );
        const code = this.firstNonEmpty(
          item?.code,
          item?.question_code,
          item?.questionCode,
          item?.programCode,
          item?.sourceCode,
          item?.codeText,
          item?.codeSnippet,
          item?.snippet,
          item?.program,
          item?.source,
          item?.body,
          item?.content
        );
        const answer = this.firstNonEmpty(
          item?.answer,
          item?.output,
          item?.expectedOutput,
          item?.expected,
          item?.correctAnswer
        );
        const correctAnswer = this.firstNonEmpty(item?.correctAnswer, item?.correct_answer, item?.correct);

        const optionsRaw = item?.options ?? item?.option ?? item?.choices ?? item?.answers;
        const options = Array.isArray(optionsRaw)
          ? optionsRaw
              .map((o: any) => this.normalizeDisplayText(o))
              .filter((v: string) => v.trim().length > 0)
          : [];

        const questionType = this.firstNonEmpty(item?.questionType, item?.question_type, item?.type);
        const topicCandidate = item?.topic ?? item?.category ?? item?.technology ?? item?.tech ?? item?.subject ?? item?.tag;
        const topic = Array.isArray(topicCandidate)
          ? this.firstNonEmpty(...topicCandidate)
          : this.firstNonEmpty(topicCandidate);

        if (!question) return null;

        return {
          question: this.normalizeDisplayText(question),
          code: this.normalizeDisplayText(code),
          answer: this.normalizeDisplayText(answer),
          correctAnswer: this.normalizeDisplayText(correctAnswer),
          options,
          questionType: questionType || this.selectedQuestionType,
          topic
        } as PromoQuestion;
      })
      .filter(Boolean) as PromoQuestion[];
  }

  private firstNonEmpty(...values: any[]): string {
    for (const v of values) {
      const s = (v ?? '').toString();
      if (s.trim().length > 0) return s;
    }
    return '';
  }

  private normalizeDisplayText(value: unknown): string {
    return (value ?? '')
      .toString()
      .replace(/â€™|â€˜/g, "'")
      .replace(/â€œ|â€/g, '"')
      .replace(/â€“|â€”/g, '-')
      .replace(/â€¦/g, '...')
      .replace(/\r\n/g, '\n')
      .replace(/\n/g, '\n')
      .replace(/\t/g, '\t')
      .replace(/\u00c2\u00a0/g, ' ')
      .replace(/\u00a0/g, ' ')
      .trim();
  }

  private splitQuestionLines(text: string): string[] {
    const normalized = this.normalizeDisplayText(text ?? '').trim();
    if (!normalized) return [];

    if (normalized.includes('\n')) {
      return normalized
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);
    }

    const parts = normalized
      .split(/(?<=;)\s*/)
      .map(part => part.trim())
      .filter(Boolean);

    return parts.length ? parts : [normalized];
  }

  private pickRandom<T>(items: T[], count: number): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(count, copy.length));
  }

  private parseAnswerKeyToIndex(raw: any): number | null {
    const s = (raw ?? '').toString().trim();
    if (!s) return null;

    if (/^[A-Za-z]$/.test(s)) {
      return s.toUpperCase().charCodeAt(0) - 65;
    }

    if (/^\d+$/.test(s)) {
      const n = Number.parseInt(s, 10);
      if (!Number.isNaN(n) && n > 0) return n - 1;
    }

    return null;
  }

  private getCorrectOptionIndex(q: PromoQuestion): number | null {
    const options = q?.options ?? [];
    if (!options.length) return null;

    const keyFromCorrect = this.parseAnswerKeyToIndex(q.correctAnswer);
    if (keyFromCorrect !== null && keyFromCorrect >= 0 && keyFromCorrect < options.length) {
      return keyFromCorrect;
    }

    const keyFromAnswer = this.parseAnswerKeyToIndex(q.answer);
    if (keyFromAnswer !== null && keyFromAnswer >= 0 && keyFromAnswer < options.length) {
      return keyFromAnswer;
    }

    const target = (q.correctAnswer ?? q.answer ?? '').toString().trim().toLowerCase();
    if (!target) return null;
    const textIndex = options.findIndex(o => (o ?? '').toString().trim().toLowerCase() === target);
    return textIndex >= 0 ? textIndex : null;
  }

  private getOptionLabel(index: number): string {
    return this.optionLabels[index] ?? '';
  }

  private getMcqCorrectDisplay(q: PromoQuestion): string {
    const idx = this.getCorrectOptionIndex(q);
    if (idx === null) return q.answer ?? '';
    const label = this.getOptionLabel(idx);
    const text = (q.options?.[idx] ?? '').toString();
    return label ? `${label}. ${text}` : text;
  }

  private pickRandomTopic(questions: PromoQuestion[]): string {
    const topics = Array.from(
      new Set(
        (questions || [])
          .map(q => (q.topic ?? '').toString().trim())
          .filter(Boolean)
      )
    );
    if (!topics.length) return '';
    const idx = Math.floor(Math.random() * topics.length);
    return topics[idx];
  }

  private buildPdf(questions: PromoQuestion[]): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const sectionSpacing = 10;
    const cardGap = 12;
    const cardPadding = 14;
    const cardTopOffset = 6;
    const footerReserve = 110;

    const brand = { r: 29, g: 78, b: 216 };
    const accent = { r: 16, g: 185, b: 129 };
    const neutral = { r: 15, g: 23, b: 42 };
    const questionColor = { r: 30, g: 64, b: 175 };
    const answerColor = { r: 217, g: 119, b: 6 };

    const lineHeightFor = (size: number) => Math.round(size * 1.4);

    const questionFontSize = 11;
    const codeFontSize = 9;
    const optionFontSize = 9;
    const answerFontSize = 10;
    const scenarioFontSize = 9;

    const drawRounded = (x: number, yPos: number, w: number, h: number, radius = 10) => {
      const anyDoc = doc as any;
      if (typeof anyDoc.roundedRect === 'function') {
        anyDoc.roundedRect(x, yPos, w, h, radius, radius, 'FD');
      } else {
        doc.rect(x, yPos, w, h, 'FD');
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
    doc.text('Promo Question Pack', margin, 56);

    y = 108;
    doc.setTextColor(neutral.r, neutral.g, neutral.b);

    const typeLabel = this.questionTypeOptions.find(t => t.value === this.selectedQuestionType)?.label ?? this.selectedQuestionType;
    const topicLabel = this.selectedTopicLabel || 'Mixed';

    // Topic badge
    const badgeText = `Topic: ${topicLabel}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const badgeWidth = doc.getTextWidth(badgeText) + 18;
    doc.setFillColor(224, 231, 255);
    doc.setTextColor(30, 64, 175);
    drawRounded(margin, y - 14, badgeWidth, 22, 11);
    doc.text(badgeText, margin + 9, y + 1);

    // Quick stats
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${typeLabel}`, margin + badgeWidth + 14, y + 1);
    doc.text(`Questions: ${questions.length}`, pageWidth - margin - 120, y + 1);

    y += 20;

    const wrapLines = (text: string, fontSize: number, font: string, style: 'normal' | 'bold' | 'italic', width = contentWidth) => {
      doc.setFont(font, style);
      doc.setFontSize(fontSize);
      return doc.splitTextToSize(text, width) as string[];
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
      const questionParts = this.splitQuestionLines(q.question);
      const questionLines = questionParts.length
        ? questionParts.flatMap((part, partIndex) =>
            wrapLines(`${partIndex === 0 ? `Q${index + 1}. ` : ''}${part}`, questionFontSize, 'helvetica', 'bold')
          )
        : wrapLines(`Q${index + 1}. ${q.question}`, questionFontSize, 'helvetica', 'bold');
      const codeLines = q.code ? wrapLines('Code:', optionFontSize, 'helvetica', 'bold')
        .concat(wrapLines(q.code, codeFontSize, 'courier', 'normal')) : [];
      const optionLines = q.options?.length
        ? wrapLines('Options:', optionFontSize, 'helvetica', 'bold')
            .concat(q.options.flatMap((opt, i) => wrapLines(`${this.getOptionLabel(i)}. ${opt}`, optionFontSize, 'helvetica', 'normal')))
        : [];
      const answerLabel = q.options?.length ? 'Correct Answer:' : 'Answer:';
      const answerText = q.options?.length ? this.getMcqCorrectDisplay(q) : (q.answer ?? '');
      const scenarioMatch = answerText.match(/(^|\n)\s*(scenario|example|examples|use case|use-case)\s*[:\-]\s*/i);
      const scenarioIndex = scenarioMatch?.index ?? -1;
      const mainAnswerText = scenarioIndex >= 0 ? answerText.slice(0, scenarioIndex).trim() : answerText.trim();
      const scenarioTextRaw = scenarioIndex >= 0 ? answerText.slice(scenarioIndex).trim() : '';
      const scenarioLabel = scenarioMatch?.[2] ? scenarioMatch[2].replace(/\s*[-_]/g, ' ').toUpperCase() : 'SCENARIO';
      const scenarioText = scenarioTextRaw.replace(/^(scenario|example|examples|use case|use-case)\s*[:\-]\s*/i, '').trim();

      const answerLines = mainAnswerText
        ? wrapLines(`${answerLabel} ${mainAnswerText}`, answerFontSize, 'helvetica', 'normal')
        : [];
      const scenarioLines = scenarioText
        ? wrapLines(`${scenarioLabel}: ${scenarioText}`, scenarioFontSize, 'helvetica', 'italic')
        : [];
      const scenarioBoxHeight = scenarioLines.length
        ? scenarioLines.length * lineHeightFor(scenarioFontSize) + 10
        : 0;

      const blockHeight = [
        questionLines.length * lineHeightFor(questionFontSize),
        codeLines.length * lineHeightFor(codeFontSize),
        optionLines.length * lineHeightFor(optionFontSize),
        answerLines.length * lineHeightFor(answerFontSize),
      ].reduce((a, b) => a + b, 0)
        + cardPadding * 2
        + cardTopOffset
        + (codeLines.length ? sectionSpacing : 0)
        + (optionLines.length ? sectionSpacing : 0)
        + (answerLines.length ? sectionSpacing : 0)
        + (scenarioLines.length ? sectionSpacing + scenarioBoxHeight : 0);

      if (y + blockHeight > pageHeight - margin - footerReserve) {
        doc.addPage();
        y = margin;
      }

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      drawRounded(margin, y, contentWidth, blockHeight, 12);

      let yCursor = y + cardPadding + cardTopOffset;
      doc.setTextColor(questionColor.r, questionColor.g, questionColor.b);
      yCursor = addLines(questionLines, margin + cardPadding, yCursor, 'helvetica', 'bold', questionFontSize);

      if (codeLines.length) {
        doc.setTextColor(neutral.r, neutral.g, neutral.b);
        yCursor += sectionSpacing;
        yCursor = addLines(codeLines, margin + cardPadding, yCursor, 'courier', 'normal', codeFontSize);
      }

      if (optionLines.length) {
        doc.setTextColor(neutral.r, neutral.g, neutral.b);
        yCursor += sectionSpacing;
        yCursor = addLines(optionLines, margin + cardPadding, yCursor, 'helvetica', 'normal', optionFontSize);
      }

      if (answerLines.length) {
        yCursor += sectionSpacing;
        doc.setTextColor(answerColor.r, answerColor.g, answerColor.b);
        yCursor = addLines(answerLines, margin + cardPadding, yCursor, 'helvetica', 'normal', answerFontSize);
        doc.setTextColor(neutral.r, neutral.g, neutral.b);
      }

      if (scenarioLines.length) {
        yCursor += sectionSpacing;
        doc.setDrawColor(224, 231, 255);
        doc.setFillColor(238, 242, 255);
        drawRounded(margin + cardPadding, yCursor - 4, contentWidth - cardPadding * 2, scenarioBoxHeight, 8);
        doc.setTextColor(71, 85, 105);
        yCursor = addLines(scenarioLines, margin + cardPadding + 6, yCursor + 6, 'helvetica', 'italic', scenarioFontSize);
        doc.setTextColor(neutral.r, neutral.g, neutral.b);
      }

      y += blockHeight + cardGap;
    });

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

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 64, 175);
   //   doc.text('CareerPrepBook', margin + 10, boxY + footerHeight - 6);

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

    const fileSuffix = this.selectedQuestionType.toLowerCase();
    doc.save(`careerprepbook-promo-${fileSuffix}.pdf`);
  }

  private showModal(message: string, status: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.modalDetails = {
      ...this.modalDetails,
      isOpen: true,
      message,
      status
    };
  }
}

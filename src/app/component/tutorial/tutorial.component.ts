import { Component, OnInit } from '@angular/core';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { from, of, Subject, takeUntil } from 'rxjs';
import { Technology } from '../../models/Technology';
import { TechnologyService } from '../../service/technology.service';
import { catchError, concatMap, defaultIfEmpty, filter, map, take } from 'rxjs/operators';

type OutputQuestion = {
  question: string;
  code: string;
  answer: string;
  topic?: string;
  userOutput: string;
  showAnswer: boolean;
  checked: boolean;
  isCorrect: boolean | null;
};

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class TutorialComponent implements OnInit {

  constructor(
    private activeRouter: ActivatedRoute,
    private router: Router,
    private questionAnswerService: QuestionAnswerService,
    private technologyService: TechnologyService
  ) {}

  private destroy$ = new Subject<void>();
  isLoadingQuestions = false;

  // Loaded only to improve topic fallback matching; topic selection UI is on /output-practice
  technologies: Technology[] = [];
  selectedTopic: string = 'All';

  private allQuestionsCache: OutputQuestion[] | null = null;

  private readonly dummyOutputQuestionsByTopic: Record<string, Omit<OutputQuestion, 'userOutput' | 'showAnswer' | 'checked' | 'isCorrect'>[]> = {
    javascript: [
      {
        question: 'What will be the output (type coercion)?',
        code: `console.log(1 + '2' + 3);`,
        answer: '123',
        topic: 'JavaScript',
      },
      {
        question: 'Promise order (microtask vs macrotask).',
        code: `console.log('A');\n\nsetTimeout(() => console.log('B'), 0);\n\nPromise.resolve().then(() => console.log('C'));\n\nconsole.log('D');`,
        answer: `A\nD\nC\nB`,
        topic: 'JavaScript',
      },
    ],
    typescript: [
      {
        question: 'What is the output (union narrowing)?',
        code: `function f(x: string | number) {\n  if (typeof x === 'string') return x.toUpperCase();\n  return x + 1;\n}\n\nconsole.log(f('hi'));\nconsole.log(f(41));`,
        answer: `HI\n42`,
        topic: 'TypeScript',
      },
      {
        question: 'What will be logged (enum values)?',
        code: `enum Role { Admin, User }\nconsole.log(Role.Admin);\nconsole.log(Role[0]);`,
        answer: `0\nAdmin`,
        topic: 'TypeScript',
      },
    ],
    angular: [
      {
        question: 'What will be the output (RxJS map)?',
        code: `import { of } from 'rxjs';\nimport { map } from 'rxjs/operators';\n\nof(1, 2, 3).pipe(map(x => x * 2)).subscribe(v => console.log(v));`,
        answer: `2\n4\n6`,
        topic: 'Angular',
      },
      {
        question: 'What will be printed (async pipe concept check)?',
        code: `// Assume an observable emits 10 then 20\n// With async pipe, template shows latest value\n// What is the last value shown?`,
        answer: '20',
        topic: 'Angular',
      },
    ],
    java: [
      {
        question: 'What will be the output (post-increment)?',
        code: `int x = 10;\nSystem.out.println(x++);\nSystem.out.println(x);`,
        answer: `10\n11`,
        topic: 'Java',
      },
      {
        question: 'What will be printed (string immutability)?',
        code: `String s = "hi";\ns.concat("!");\nSystem.out.println(s);`,
        answer: 'hi',
        topic: 'Java',
      },
    ],
    python: [
      {
        question: 'What is the output (list aliasing)?',
        code: `a = [1, 2]\nb = a\nb.append(3)\nprint(a)`,
        answer: '[1, 2, 3]',
        topic: 'Python',
      },
      {
        question: 'What is the output (default argument pitfall)?',
        code: `def f(x, acc=[]):\n    acc.append(x)\n    return acc\n\nprint(f(1))\nprint(f(2))`,
        answer: `[1]\n[1, 2]`,
        topic: 'Python',
      },
    ],
  };

  private normalizeOutput(text: string): string {
    // Normalizes whitespace/newlines so users can type the same output format in different ways.
    return (text ?? '')
      .toString()
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
  }

  private normalizeOutputQuestions(data: any): OutputQuestion[] {
    if (!Array.isArray(data)) return [];

    const normalized = data
      .map((item: any) => {
        const question = (item?.question ?? item?.ques ?? item?.title ?? '').toString().trim();
        const code = (item?.code ?? item?.snippet ?? item?.program ?? '').toString();
        const answer = (item?.answer ?? item?.output ?? item?.expectedOutput ?? '').toString();
        const topic = (item?.topic ?? item?.technology ?? item?.category ?? item?.tech ?? '').toString().trim();

        if (!question || !code || !answer) return null;

        return {
          question,
          code,
          answer,
          topic: topic || undefined,
          userOutput: '',
          showAnswer: false,
          checked: false,
          isCorrect: null,
        } as OutputQuestion;
      })
      .filter(Boolean) as OutputQuestion[];

    return normalized;
  }

  ngOnInit(): void {
    this.activeRouter.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const topic = (params?.['topic'] ?? '').toString().trim();
      this.selectedTopic = topic ? topic : 'All';

      // When deep-linking or when topic changes, load the appropriate question bank.
      this.loadQuestionsForSelection(this.selectedTopic);
    });

    this.loadTechnologies();
  }

  private loadTechnologies(): void {
    this.technologyService
      .getAllTechnologies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.technologies = data || [];
        },
        error: () => {
          this.technologies = [];
        }
      });
  }

  goToTopicPicker(): void {
    this.router.navigate(['/output-practice']);
  }

  get displayedQuestions(): OutputQuestion[] {
    return this.questions;
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

  private toDummyKey(label: string): string {
    // Our dummy keys are simple words like "javascript", "typescript".
    // Strip separators to match better.
    return this.normalizeKey(label).replace(/-/g, '');
  }

  private buildDummyQuestions(topicLabel: string): OutputQuestion[] {
    const key = this.toDummyKey(topicLabel);
    const raw = this.dummyOutputQuestionsByTopic[key] || [];
    return raw.map((q) => ({
      ...q,
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    }));
  }

  private buildTopicCandidates(label: string): string[] {
    const raw = (label ?? '').toString().trim();
    if (!raw) return [];

    const normalized = this.normalizeKey(raw);
    const candidates: string[] = [raw];
    if (normalized && normalized !== raw) candidates.push(normalized);

    for (const tech of this.technologies || []) {
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

    const seen = new Set<string>();
    return candidates.filter((c) => {
      const v = (c ?? '').toString().trim();
      if (!v) return false;
      if (seen.has(v)) return false;
      seen.add(v);
      return true;
    });
  }

  private loadQuestionsForSelection(topic: string): void {
    const cleaned = (topic ?? '').toString().trim();

    if (!cleaned || cleaned === 'All') {
      this.loadAllOutputQuestions();
      return;
    }

    // Prefer dummy data for testing so topic selection is predictable,
    // even before the DB/service provides output-style questions.
    const dummy = this.buildDummyQuestions(cleaned);
    if (dummy.length > 0) {
      this.questions = dummy;
      this.isLoadingQuestions = false;
      return;
    }

    this.loadTopicOutputQuestionsWithFallback(cleaned);
  }

  private loadAllOutputQuestions(): void {
    if (this.allQuestionsCache && this.allQuestionsCache.length > 0) {
      this.questions = this.allQuestionsCache;
      return;
    }

    // If dummy topics exist, make them available immediately for "All".
    const dummyAll = Object.values(this.dummyOutputQuestionsByTopic)
      .flat()
      .map((q) => ({
        ...q,
        userOutput: '',
        showAnswer: false,
        checked: false,
        isCorrect: null,
      } as OutputQuestion));

    if (dummyAll.length > 0) {
      this.allQuestionsCache = dummyAll;
      this.questions = dummyAll;
      return;
    }

    this.isLoadingQuestions = true;
    this.questionAnswerService
      .getAllMcqQA()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const normalized = this.normalizeOutputQuestions(data);
          if (normalized.length > 0) {
            this.allQuestionsCache = normalized;
            this.questions = normalized;
          }
          this.isLoadingQuestions = false;
        },
        error: (error) => {
          console.error(error);
          this.isLoadingQuestions = false;
        }
      });
  }

  private loadTopicOutputQuestionsWithFallback(topicLabel: string): void {
    this.isLoadingQuestions = true;
    this.questions = [];

    const candidates = this.buildTopicCandidates(topicLabel);

    from(candidates)
      .pipe(
        concatMap((candidate) =>
          this.questionAnswerService.getQAByTopic(candidate).pipe(
            catchError(() => of([] as any[])),
            map((data) => ({ candidate, normalized: this.normalizeOutputQuestions(data) }))
          )
        ),
        filter((r) => r.normalized.length > 0),
        take(1),
        defaultIfEmpty({ candidate: topicLabel, normalized: [] as OutputQuestion[] }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ normalized }) => {
          if (normalized.length > 0) {
            this.questions = normalized;
            this.isLoadingQuestions = false;
            return;
          }

          // Fallback: ensure we have the global bank, then try client-side filter by topic tag.
          const ensureAll = this.allQuestionsCache
            ? of(this.allQuestionsCache)
            : this.questionAnswerService.getAllMcqQA().pipe(
                catchError(() => of([])),
                map((data) => {
                  const all = this.normalizeOutputQuestions(data);
                  if (all.length > 0) this.allQuestionsCache = all;
                  return all;
                })
              );

          ensureAll.pipe(take(1), takeUntil(this.destroy$)).subscribe((all) => {
            const key = this.normalizeKey(topicLabel);
            const filtered = (all || []).filter((q) => this.normalizeKey(q?.topic || '') === key);

            // If even that fails (no topic tags), keep showing the full bank rather than blank.
            this.questions = filtered.length > 0 ? filtered : (all || this.questions);
            this.isLoadingQuestions = false;
          });
        },
        error: (err) => {
          console.error(err);
          this.isLoadingQuestions = false;
        }
      });
  }

  questions: OutputQuestion[] = [
    {
      question: 'What will be the output of the following JavaScript code?',
      code: `let x = 10;
x++;
console.log(x);`,
      answer: '11',
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
    {
      question: 'What is the output?',
      code: `console.log(typeof null);`,
      answer: 'object',
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
    {
      question: 'What will be printed?',
      code: `console.log(1 + '2' + 3);`,
      answer: '123',
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
    {
      question: 'Predict the output (array coercion).',
      code: `console.log([] + []);
console.log([] + {});
console.log({} + []);`,
      answer: `
[object Object]
[object Object]`,
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
    {
      question: 'What will be the output (== vs ===)?',
      code: `console.log(0 == false);
console.log(0 === false);`,
      answer: `true
false`,
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
    {
      question: 'What will be logged (let/var scope)?',
      code: `function test() {
  if (true) {
    var a = 1;
    let b = 2;
  }
  console.log(a);
  console.log(typeof b);
}

test();`,
      answer: `1
undefined`,
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
    {
      question: 'Predict the output (hoisting).',
      code: `console.log(x);
var x = 10;`,
      answer: 'undefined',
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
    {
      question: 'What is the output (NaN check)?',
      code: `console.log(Number.isNaN(NaN));
console.log(isNaN('hello'));`,
      answer: `true
true`,
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
    {
      question: 'What will be output (parseInt behavior)?',
      code: `console.log(parseInt('08'));
console.log(parseInt('08', 10));`,
      answer: `8
8`,
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
    {
      question: 'Predict the output (default sort).',
      code: `console.log([1, 2, 10].sort());`,
      answer: '1,10,2',
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
    {
      question: 'What will be logged (closure)?',
      code: `function make() {
  let count = 0;
  return function () {
    count++;
    return count;
  };
}

const inc = make();
console.log(inc());
console.log(inc());`,
      answer: `1
2`,
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
    {
      question: 'Promise order (microtask vs macrotask).',
      code: `console.log('A');

setTimeout(() => console.log('B'), 0);

Promise.resolve().then(() => console.log('C'));

console.log('D');`,
      answer: `A
D
C
B`,
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
    {
      question: 'What will be printed (object reference)?',
      code: `const a = { x: 1 };
const b = a;
b.x = 2;
console.log(a.x);`,
      answer: '2',
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
    {
      question: 'Predict output (map vs forEach).',
      code: `const arr = [1, 2, 3];
const r1 = arr.map(x => x * 2);
const r2 = arr.forEach(x => x * 2);
console.log(r1);
console.log(r2);`,
      answer: `2,4,6
undefined`,
      userOutput: '',
      showAnswer: false,
      checked: false,
      isCorrect: null,
    },
  ];

  get totalQuestions(): number {
    return this.displayedQuestions.length;
  }

  get attemptedCount(): number {
    return this.displayedQuestions.filter(q => this.normalizeOutput(q.userOutput).length > 0).length;
  }

  get correctCount(): number {
    return this.displayedQuestions.filter(q => q.checked && q.isCorrect === true).length;
  }

  get wrongCount(): number {
    return this.displayedQuestions.filter(q => q.checked && q.isCorrect === false).length;
  }

  get unattemptedCount(): number {
    return Math.max(0, this.totalQuestions - this.attemptedCount);
  }

  toggleAnswer(q: OutputQuestion) {
    q.showAnswer = !q.showAnswer;
  }

  checkAnswer(q: OutputQuestion) {
    const expected = this.normalizeOutput(q.answer);
    const actual = this.normalizeOutput(q.userOutput);
    q.checked = true;
    q.isCorrect = actual.length > 0 && actual === expected;
  }

  resetQuestion(q: OutputQuestion) {
    q.userOutput = '';
    q.checked = false;
    q.isCorrect = null;
    q.showAnswer = false;
  }

  resetAll() {
    this.questions.forEach(q => this.resetQuestion(q));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}

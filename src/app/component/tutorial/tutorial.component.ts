import { Component, OnInit } from '@angular/core';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

type OutputQuestion = {
  question: string;
  code: string;
  answer: string;
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

  constructor(private activeRouter: ActivatedRoute,
    private questionAnswerService: QuestionAnswerService
  ) { }

  private destroy$ = new Subject<void>();
  isLoadingQuestions = false;

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

        if (!question || !code || !answer) return null;

        return {
          question,
          code,
          answer,
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
      console.log(params);
    });

    // Try loading from service, but only use it if it matches an output-based shape.
    this.isLoadingQuestions = true;
    this.questionAnswerService.getAllMcqQA()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const normalized = this.normalizeOutputQuestions(data);
          if (normalized.length > 0) {
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
    return this.questions.length;
  }

  get attemptedCount(): number {
    return this.questions.filter(q => this.normalizeOutput(q.userOutput).length > 0).length;
  }

  get correctCount(): number {
    return this.questions.filter(q => q.checked && q.isCorrect === true).length;
  }

  get wrongCount(): number {
    return this.questions.filter(q => q.checked && q.isCorrect === false).length;
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

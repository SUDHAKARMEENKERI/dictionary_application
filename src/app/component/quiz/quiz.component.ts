import { Component, OnInit } from '@angular/core';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

type QuizQuestion = { question: string; options: string[]; correct: number; topic?: string };
type QuizAttempt = {
  id: string;
  createdAt: string;
  topic?: string;
  planTitle?: string;
  total: number;
  correct: number;
  wrong: number;
  unattempted: number;
  percent: number;
};

type ChatMessage = {
  from: 'bot' | 'user';
  text: string;
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
};

const QUIZ_ATTEMPTS_KEY = 'cpb_quiz_attempts';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class QuizComponent implements OnInit {
  quizStarted = false;
  isLoadingQuestions = false;
  displayQuestions: QuizQuestion[] = [];
  answeredOptions: Array<number | null> = [];
  visited: boolean[] = [];
  correctCount = 0;
  wrongCount = 0;
  unattemptedCount = 0;
  quizPlans = [
    { title: 'Quick Set', description: 'Test yourself with 5 questions', count: 5 },
    { title: 'Challenge Set', description: 'Go deeper with 10 questions', count: 10 },
    { title: 'Ultimate Set', description: 'Full challenge with 15 questions', count: 15 }
  ];
  selectedPlan: any = null;
  careerPrepBookInfo = {
    title: 'CareerPrepBook',
    description: 'Boost your tech career with curated quizzes, interview prep, and learning resources. Join thousands of successful candidates who started here!'
  };

  constructor(private activeRouter: ActivatedRoute,
    private questionAnswerService: QuestionAnswerService
  ) { }
  private destroy$ = new Subject<void>();
  topic = '';

  private normalizeKey(value: string): string {
    return (value || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  private normalizeMcqQuestions(data: any): QuizQuestion[] {
    if (!Array.isArray(data)) return [];

    const normalized = data
      .map((item: any) => {
        const question = (item?.question ?? item?.ques ?? item?.title ?? '').toString().trim();
        const optionsRaw = item?.options ?? item?.option ?? item?.choices ?? item?.answers;
        const options = Array.isArray(optionsRaw) ? optionsRaw.map((o: any) => String(o)) : [];

        const topic = (item?.topic ?? item?.technology ?? item?.category ?? item?.tag ?? item?.subject ?? '').toString().trim();

        let correct: number | undefined;
        if (typeof item?.correct === 'number') correct = item.correct;
        else if (typeof item?.correctIndex === 'number') correct = item.correctIndex;
        else if (typeof item?.answerIndex === 'number') correct = item.answerIndex;
        else if (typeof item?.answer === 'string') correct = options.findIndex(o => o === item.answer);
        else if (typeof item?.answer === 'number') correct = item.answer;
        else if (typeof item?.answer === 'object' && item?.answer !== null && typeof item.answer?.value === 'string') {
          correct = options.findIndex(o => o === item.answer.value);
        }

        if (!question || options.length < 2) return null;

        // If we couldn't infer, default to first option (keeps UI usable)
        if (typeof correct !== 'number' || Number.isNaN(correct) || correct < 0 || correct >= options.length) {
          correct = 0;
        }

        return { question, options, correct, topic: topic || undefined };
      })
      .filter(Boolean) as QuizQuestion[];

    return normalized;
  }

  startQuiz(plan: any) {
    this.selectedPlan = plan;
    this.quizStarted = true;

    // Load only the number of questions for the selected plan.
    const available = this.questionsToShow;
    this.displayQuestions = available.slice(0, plan.count);

    // If the plan asks for more than we have, still show what we have.
    // UI will handle empty state if zero.
    this.currentIndex = 0;
    this.score = 0;
    this.showResult = false;
    this.selectedOption = null;

    this.correctCount = 0;
    this.wrongCount = 0;
    this.unattemptedCount = 0;

    this.answeredOptions = new Array(this.displayQuestions.length).fill(null);
    this.visited = new Array(this.displayQuestions.length).fill(false);
  }

  ngOnInit(): void {
    this.activeRouter.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.topic = (params?.['topic'] ?? '').toString();

      // If user navigates to a different topic while already on the quiz route,
      // reset plan selection so the next run uses the new topic question bank.
      if (this.quizStarted) {
        this.reload();
      }
    });

    // Use hardcoded questions by default, but try to load from service if compatible.
    // The service payload may not match the quiz UI shape, so we normalize it.
    this.isLoadingQuestions = true;
    this.questionAnswerService.getAllMcqQA().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        const normalized = this.normalizeMcqQuestions(data);
        if (normalized.length > 0) {
          this.questions = normalized;
          console.log('Quiz questions loaded from service:', normalized);

          // If user already picked a plan, refresh the sliced questions.
          if (this.quizStarted && this.selectedPlan?.count) {
            const available = this.questionsToShow;
            this.displayQuestions = available.slice(0, this.selectedPlan.count);
          }
        } else {
          console.warn('MCQ service returned unsupported shape; using default quiz questions.');
        }
        this.isLoadingQuestions = false;
      },
      error: (error) => {
        console.error('Error loading questions from service, using default questions', error);
        this.isLoadingQuestions = false;
      }
    });
  }

  questions: QuizQuestion[] = [
      {
        question: 'What is JavaScript?',
        options: [
          'A programming language',
          'A database',
          'An operating system',
          'A browser'
        ],
        correct: 0
      },
      {
        question: 'Which keyword is used to declare a variable in JavaScript?',
        options: ['var', 'int', 'string', 'define'],
        correct: 0
      },
      {
        question: 'Which company developed JavaScript?',
        options: ['Netscape', 'Microsoft', 'Google', 'Apple'],
        correct: 0
      },
      {
        question: 'Which method is used to print in JavaScript?',
        options: ['console.log()', 'print()', 'echo()', 'write()'],
        correct: 0
      },
      {
        question: 'Which symbol is used for single-line comments?',
        options: ['//', '#', '/*', '<!--'],
        correct: 0
      },
      {
        question: 'What does DOM stand for?',
        options: ['Document Object Model', 'Data Object Model', 'Desktop Object Model', 'Document Oriented Model'],
        correct: 0
      },
      {
        question: 'Which array method adds an item to the end?',
        options: ['push()', 'pop()', 'shift()', 'unshift()'],
        correct: 0
      },
      {
        question: 'How do you write a function in JavaScript?',
        options: ['function myFunc() {}', 'def myFunc() {}', 'func myFunc() {}', 'function:myFunc() {}'],
        correct: 0
      },
      {
        question: 'Which operator is used to assign a value?',
        options: ['=', '==', '===', ':='],
        correct: 0
      },
      {
        question: 'Which keyword is used to define a constant?',
        options: ['const', 'constant', 'let', 'var'],
        correct: 0
      },
      {
        question: 'Which method converts JSON to a JavaScript object?',
        options: ['JSON.parse()', 'JSON.stringify()', 'parseJSON()', 'toObject()'],
        correct: 0
      },
      {
        question: 'Which event occurs when a user clicks an HTML element?',
        options: ['onclick', 'onchange', 'onmouseover', 'onload'],
        correct: 0
      },
      {
        question: 'How do you declare an array?',
        options: ['let arr = []', 'let arr = {}', 'let arr = ()', 'let arr = <>'],
        correct: 0
      },
      {
        question: 'Which method removes the last element from an array?',
        options: ['pop()', 'push()', 'shift()', 'splice()'],
        correct: 0
      },
      {
        question: 'Which keyword is used to exit a loop?',
        options: ['break', 'exit', 'stop', 'return'],
        correct: 0
      }
    ];

  currentIndex = 0;
  selectedOption: number | null = null;
  score = 0;
  showResult = false;

  selectOption(index: number) {
    this.selectedOption = index;
    // Mark as attended
    if (this.quizStarted && this.questionsToShow.length > 0) {
      this.answeredOptions[this.currentIndex] = index;
      this.visited[this.currentIndex] = true;
    }
  }

  goToQuestion(index: number) {
    if (!this.quizStarted) return;
    if (index < 0 || index >= this.questionsToShow.length) return;
    this.currentIndex = index;
    this.selectedOption = this.answeredOptions[index];
    this.visited[index] = true;
  }

  get attendedCount(): number {
    return this.answeredOptions.filter(v => v !== null).length;
  }

  get notAttendedCount(): number {
    return Math.max(0, this.questionsToShow.length - this.attendedCount);
  }

  userAnswerText(index: number): string {
    const q = this.questionsToShow[index];
    const ansIndex = this.answeredOptions[index];
    if (!q || ansIndex === null || ansIndex === undefined) return 'Not answered';
    return q.options[ansIndex] ?? 'Not answered';
  }

  correctAnswerText(index: number): string {
    const q = this.questionsToShow[index];
    if (!q) return '';
    return q.options[q.correct] ?? '';
  }

  optionLabel(index: number): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return alphabet[index] ?? `${index + 1}`;
  }

  answerStatus(index: number): 'Correct' | 'Wrong' | 'Unanswered' {
    const q = this.questionsToShow[index];
    const ansIndex = this.answeredOptions[index];
    if (!q || ansIndex === null || ansIndex === undefined) return 'Unanswered';
    return ansIndex === q.correct ? 'Correct' : 'Wrong';
  }

  private computeResultBreakdown() {
    const list = this.questionsToShow;
    const total = list.length;
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    for (let i = 0; i < total; i++) {
      const ans = this.answeredOptions[i];
      if (ans === null || ans === undefined) {
        unattempted++;
        continue;
      }
      if (ans === list[i]?.correct) correct++;
      else wrong++;
    }

    this.correctCount = correct;
    this.wrongCount = wrong;
    this.unattemptedCount = unattempted;
    this.score = correct;
  }

  private persistAttempt(): void {
    const total = this.totalQuestions;
    if (!total) return;

    const attempt: QuizAttempt = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      topic: this.topic || undefined,
      planTitle: this.selectedPlan?.title ?? undefined,
      total,
      correct: this.correctCount,
      wrong: this.wrongCount,
      unattempted: this.unattemptedCount,
      percent: Math.round((this.correctCount / total) * 100),
    };

    const current = this.readAttempts();
    const next = [attempt, ...current].slice(0, 25);
    try {
      localStorage.setItem(QUIZ_ATTEMPTS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors (private mode / quota)
    }
  }

  private readAttempts(): QuizAttempt[] {
    const raw = localStorage.getItem(QUIZ_ATTEMPTS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as QuizAttempt[]) : [];
    } catch {
      return [];
    }
  }

  get totalQuestions(): number {
    return this.questionsToShow.length;
  }

  get correctPercent(): number {
    return this.totalQuestions ? Math.round((this.correctCount / this.totalQuestions) * 100) : 0;
  }

  get wrongPercent(): number {
    return this.totalQuestions ? Math.round((this.wrongCount / this.totalQuestions) * 100) : 0;
  }

  get unattemptedPercent(): number {
    return this.totalQuestions ? Math.max(0, 100 - this.correctPercent - this.wrongPercent) : 0;
  }

  get resultChartStyle(): { [key: string]: string } {
    const c = this.correctPercent;
    const w = this.wrongPercent;
    const cw = Math.min(100, c + w);

    return {
      // Use a more visible neutral for unattempted so the chart doesn't blend into card borders.
      background: `conic-gradient(#16a34a 0 ${c}%, #ef4444 ${c}% ${cw}%, #94a3b8 ${cw}% 100%)`,
    };
  }

  private get topicFilteredQuestions(): QuizQuestion[] {
    const topicKey = this.normalizeKey(this.topic);
    if (!topicKey) return this.questions;

    const filtered = (this.questions || []).filter((q) => {
      const qTopicKey = this.normalizeKey(q?.topic ?? '');
      return qTopicKey && qTopicKey === topicKey;
    });

    // If we don't have topic-tagged questions, fall back to the full bank.
    return filtered.length > 0 ? filtered : this.questions;
  }

  get questionsToShow() {
    const base = this.displayQuestions.length > 0 ? this.displayQuestions : this.topicFilteredQuestions;
    return base;
  }

  // ...existing code...
    nextQuestion() {
      this.selectedOption = null;
      if (this.currentIndex < this.questionsToShow.length - 1) {
        this.currentIndex++;
        this.selectedOption = this.answeredOptions[this.currentIndex];
      } else {
        this.computeResultBreakdown();
        this.persistAttempt();
        this.showResult = true;
        this.generateChatResult();
      }
    }

    chatMessages: ChatMessage[] = [];
    generateChatResult() {
      const total = this.questionsToShow.length;
      if (!total) {
        this.chatMessages = [
          { from: 'bot', text: 'No questions were attempted in this run. Please try another plan.', tone: 'neutral' },
        ];
        return;
      }

      const percent = Math.round((this.score / total) * 100);
      const topicText = (this.topic || '').toString().trim();
      const title = topicText ? `${topicText} Quiz` : 'Quiz';

      let tone: ChatMessage['tone'] = 'neutral';
      let coaching = 'Try a shorter plan and focus on fundamentals.';

      if (percent >= 80) {
        tone = 'success';
        coaching = 'Excellent accuracy—try the bigger plan next.';
      } else if (percent >= 50) {
        tone = 'warning';
        coaching = 'Good progress—review wrong answers and try again.';
      } else {
        tone = 'danger';
        coaching = 'Don’t worry—review the basics and retake this topic.';
      }

      this.chatMessages = [
        { from: 'bot', text: `Nice work finishing the ${title}.`, tone: 'neutral' },
        {
          from: 'bot',
          text: `Score: ${this.score}/${total} (${percent}%). Correct ${this.correctCount}, Wrong ${this.wrongCount}, Unattempted ${this.unattemptedCount}.`,
          tone,
        },
        { from: 'bot', text: coaching, tone },
        { from: 'bot', text: 'Tip: open Interview Q&A for the same topic and practice 10 minutes daily.', tone: 'neutral' },
      ];
    }

  reload() {
    this.showResult = false;
    this.currentIndex = 0;
    this.selectedOption = null;
    this.score = 0;
    this.quizStarted = false;
    this.displayQuestions = [];
    this.selectedPlan = null;
    this.chatMessages = [];
    this.answeredOptions = [];
    this.visited = [];
    this.correctCount = 0;
    this.wrongCount = 0;
    this.unattemptedCount = 0;
  }

  backToPlans() {
    this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}

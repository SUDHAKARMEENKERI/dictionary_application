import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { QaListComponent } from '../qa-list/qa-list.component';
import { TutorialComponent } from '../tutorial/tutorial.component';
import { QuizComponent } from '../quiz/quiz.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { QuestionAnswer, Technology, TechnologyItem } from '../../models/Technology';
import { TechnologyService } from '../../service/technology.service';

@Component({
  selector: 'app-qa-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './qa-page.component.html',
  styleUrl: './qa-page.component.scss',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QaPageComponent implements OnInit {
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

  private applySelectionFromUrl(): void {
    const params = this.activeRouter.snapshot.queryParams;
    this.category = params['category'] || '';
    const urlTopic = params['topic'] || '';

    if (!this.technologies?.length) {
      this.topic = urlTopic;
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

  private loadQuestions(): void {
    if (!this.topic) {
      this.questionAnswers = [];
      return;
    }

    this.isLoadingQuestions = true;
    this.questionAnswerService.getQAByTopic(this.topic)
      .pipe(takeUntil(this.destroy$))
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
    this.router.navigate(['/quiz/play'], { queryParams: { topic: this.topic } });
  }

  onLoadPracticeQuestion() {
    this.router.navigate(['/output-practice/play'], { queryParams: { topic: this.topic } });
  }

}

import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProgrammingQuestionService, ProgrammingQuestion } from '../../service/programming-question.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-programming-questions-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './programming-questions-view.component.html',
  styleUrls: ['./programming-questions-view.component.scss']
})
export class ProgrammingQuestionsViewComponent implements OnInit, OnDestroy {
  searchQuery = '';
  private destroy$ = new Subject<void>();
  questions: ProgrammingQuestion[] = [];
  isLoading = false;

  // Toggle states for hints and answers
  expandedHints: Set<number | string> = new Set();
  expandedAnswers: Set<number | string> = new Set();
  // Track selected technology for each question
  selectedTechnologies: Map<number | string, string> = new Map();

  constructor(
    private programmingQuestionService: ProgrammingQuestionService
  ) {}

  ngOnInit(): void {
    this.loadQuestions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadQuestions(): void {
    this.isLoading = true;
    this.programmingQuestionService.getAllQuestions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          // Only show questions where isAdmin is true
          this.questions = questions.filter(q => q.isAdmin === true);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading programming questions:', error);
          this.isLoading = false;
          // Load mock data as fallback
          this.loadMockData();
        }
      });
  }

  private loadMockData(): void {
    this.questions = [
      {
        title: 'Two Sum',
        difficulty: 'Easy',
        topics: ['Array', 'HashMap'],
        prompt: 'Given an array of integers and a target, return indices of the two numbers such that they add up to the target. Assume exactly one solution and you may not use the same element twice.',
        hints: 'Use a hash map to store numbers you\'ve seen and check for complements.',
        isAdmin: true,
        answers: [
          {
            technology: 'Java',
            answer: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        throw new IllegalArgumentException("No solution");\n    }\n}'
          },
          {
            technology: 'Python',
            answer: 'def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    raise ValueError(\'No solution\')'
          },
          {
            technology: 'JavaScript',
            answer: 'function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    throw new Error(\'No solution\');\n}'
          }
        ]
      }
    ];
  }

  get filteredQuestions(): ProgrammingQuestion[] {
    const q = (this.searchQuery ?? '').toString().trim().toLowerCase();
    const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    
    let filtered = q ? (this.questions || []).filter((item) => {
      const haystack = [
        item.title,
        item.prompt,
        item.difficulty,
        ...(item.topics || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    }) : this.questions;

    // Sort by difficulty
    return filtered.sort((a, b) => {
      const orderA = difficultyOrder[a.difficulty] || 999;
      const orderB = difficultyOrder[b.difficulty] || 999;
      return orderA - orderB;
    });
  }

  trackByTitle = (_: number, q: ProgrammingQuestion) => q.title;

  toggleHint(questionId: number | string | undefined): void {
    if (!questionId) return;
    if (this.expandedHints.has(questionId)) {
      this.expandedHints.delete(questionId);
    } else {
      this.expandedHints.add(questionId);
    }
  }

  toggleAnswer(questionId: number | string | undefined): void {
    if (!questionId) return;
    if (this.expandedAnswers.has(questionId)) {
      this.expandedAnswers.delete(questionId);
    } else {
      this.expandedAnswers.add(questionId);
    }
  }

  isHintExpanded(questionId: number | string | undefined): boolean {
    return questionId ? this.expandedHints.has(questionId) : false;
  }

  isAnswerExpanded(questionId: number | string | undefined): boolean {
    return questionId ? this.expandedAnswers.has(questionId) : false;
  }

  selectTechnology(questionId: number | string, technology: string): void {
    this.selectedTechnologies.set(questionId, technology);
  }

  getSelectedTechnology(questionId: number | string, defaultTech?: string): string {
    return this.selectedTechnologies.get(questionId) || defaultTech || '';
  }

  getAnswerForTechnology(question: ProgrammingQuestion, technology: string): string {
    if (question.answers && question.answers.length > 0) {
      const techAnswer = question.answers.find(a => a.technology === technology);
      return techAnswer?.answer || '';
    }
    // Fallback to legacy single answer field
    return question.answer || '';
  }

  hasMultipleAnswers(question: ProgrammingQuestion): boolean {
    return !!(question.answers && question.answers.length > 0);
  }
}

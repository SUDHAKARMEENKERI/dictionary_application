import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { readLoginMobile } from '../../util/loginStorage';
import { ProgrammingQuestionService, ProgrammingQuestion } from '../../service/programming-question.service';
import { Subject, takeUntil } from 'rxjs';
import { ModalComponent, ModalDetails } from '../modal/modal.component';
import { AdsenseAdComponent } from '../../shared/adsense-ad/adsense-ad.component';

@Component({
  selector: 'app-programming-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AdsenseAdComponent],
  templateUrl: './programming-questions.component.html',
  styleUrls: ['./programming-questions.component.scss'],
})
export class ProgrammingQuestionsComponent implements OnInit {
  searchQuery = '';
  private readonly adminMobile = '9611675325';
  private destroy$ = new Subject<void>();
  questions: ProgrammingQuestion[] = [];
  isLoading = false;
  currentUserMobile: string | null = null;

  // Toggle states for hints and answers
  expandedHints: Set<number | string> = new Set();
  expandedAnswers: Set<number | string> = new Set();
  // Track selected technology for each question
  selectedTechnologies: Map<number | string, string> = new Map();

  // Modal
  modalDetails: ModalDetails = {
    isOpen: false,
    message: '',
    status: 'info',
    title: 'Programming Questions'
  };
  
  // Confirmation modal
  confirmModalDetails: ModalDetails = {
    isOpen: false,
    message: '',
    status: 'warning',
    title: 'Confirm Delete',
    isConfirmation: true,
    confirmText: 'Delete',
    cancelText: 'Cancel'
  };
  questionToDelete: ProgrammingQuestion | null = null;

  constructor(
    private router: Router,
    private programmingQuestionService: ProgrammingQuestionService
  ) {}

  ngOnInit(): void {
    this.currentUserMobile = readLoginMobile();
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
          // Filter questions: show only user's questions unless admin
          if (this.isAdmin) {
            this.questions = questions;
          } else {
            this.questions = questions.filter(q => q.mobile === this.currentUserMobile);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading programming questions:', error);
          this.isLoading = false;
          // Fallback to mock data if API fails
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
        prompt:
          'Given an array of integers and a target, return indices of the two numbers such that they add up to the target. Assume exactly one solution and you may not use the same element twice.',
      },
      {
        title: 'Reverse a String',
        difficulty: 'Easy',
        topics: ['String', 'Two pointers'],
        prompt:
          'Reverse a string in-place (or return a reversed copy). Discuss time/space complexity and Unicode considerations.',
      },
      {
        title: 'Valid Parentheses',
        difficulty: 'Easy',
        topics: ['Stack', 'String'],
        prompt:
          'Given a string containing only (), {}, [], determine if the input string is valid (properly closed and nested).',
      },
      {
        title: 'Merge Two Sorted Lists',
        difficulty: 'Easy',
        topics: ['Linked List', 'Two pointers'],
        prompt:
          'Given two sorted linked lists, merge them into one sorted list and return the head.',
      },
      {
        title: 'Binary Search',
        difficulty: 'Easy',
        topics: ['Binary Search'],
        prompt:
          'Implement binary search on a sorted array. Return the index of the target, or -1 if not found.',
      },
      {
        title: 'Longest Substring Without Repeating Characters',
        difficulty: 'Medium',
        topics: ['Sliding Window', 'HashMap', 'String'],
        prompt:
          'Given a string, find the length of the longest substring without repeating characters. Aim for O(n).',
      },
      {
        title: 'Group Anagrams',
        difficulty: 'Medium',
        topics: ['HashMap', 'String'],
        prompt:
          'Given an array of strings, group the anagrams together. Discuss how you build the grouping key.',
      },
      {
        title: 'Top K Frequent Elements',
        difficulty: 'Medium',
        topics: ['Heap', 'HashMap', 'Bucket Sort'],
        prompt:
          'Given an integer array, return the k most frequent elements. Provide an approach better than O(n log n) if possible.',
      },
      {
        title: 'Merge Intervals',
        difficulty: 'Medium',
        topics: ['Intervals', 'Sorting'],
        prompt:
          'Given an array of intervals, merge all overlapping intervals and return the merged intervals.',
      },
      {
        title: 'Maximum Subarray (Kadane)',
        difficulty: 'Medium',
        topics: ['DP', 'Array'],
        prompt:
          'Find the contiguous subarray with the largest sum and return its sum. Explain Kadane\'s algorithm.',
      },
      {
        title: 'Product of Array Except Self',
        difficulty: 'Medium',
        topics: ['Array', 'Prefix/Suffix'],
        prompt:
          'Return an array output where output[i] is the product of all elements except nums[i], without using division (O(n)).',
      },
      {
        title: 'Validate BST',
        difficulty: 'Medium',
        topics: ['Tree', 'DFS'],
        prompt:
          'Given the root of a binary tree, determine if it is a valid binary search tree.',
      },
      {
        title: 'Level Order Traversal',
        difficulty: 'Medium',
        topics: ['Tree', 'BFS', 'Queue'],
        prompt:
          'Return the level order traversal of a binary tree (nodes level by level).',
      },
      {
        title: 'Detect Cycle in Linked List',
        difficulty: 'Medium',
        topics: ['Linked List', 'Two pointers'],
        prompt:
          'Given a linked list, determine if it has a cycle. Implement Floyd\'s cycle detection.',
      },
      {
        title: 'Longest Palindromic Substring',
        difficulty: 'Hard',
        topics: ['String', 'DP', 'Two pointers'],
        prompt:
          'Given a string, return the longest palindromic substring. Compare expand-around-center vs DP.',
      },
      {
        title: 'Median of Two Sorted Arrays',
        difficulty: 'Hard',
        topics: ['Binary Search', 'Array'],
        prompt:
          'Given two sorted arrays, find the median in O(log(min(n, m))).',
      },
      {
        title: 'LRU Cache',
        difficulty: 'Hard',
        topics: ['Design', 'HashMap', 'Doubly Linked List'],
        prompt:
          'Design and implement an LRU cache with get/put in O(1). Explain the data structures used.',
      },
      {
        title: 'Serialize and Deserialize Binary Tree',
        difficulty: 'Hard',
        topics: ['Tree', 'DFS/BFS', 'Design'],
        prompt:
          'Design an algorithm to serialize a binary tree to a string and deserialize it back.',
      },
      {
        title: 'Word Ladder',
        difficulty: 'Hard',
        topics: ['Graph', 'BFS'],
        prompt:
          'Given two words and a dictionary, find the length of the shortest transformation sequence changing one letter at a time.',
      },
    ];
  }

  get isAdmin(): boolean {
    const currentMobile = readLoginMobile();
    return currentMobile === this.adminMobile;
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

  addQuestion(): void {
    this.router.navigate(['/programming-questions/new']);
  }

  editQuestion(question: ProgrammingQuestion): void {
    if (!question.id) {
      this.showModal('Cannot edit question without ID', 'error');
      return;
    }
    this.router.navigate(['/programming-questions', question.id, 'edit']);
  }

  deleteQuestion(question: ProgrammingQuestion): void {
    if (!question.id) {
      this.showModal('Cannot delete question without ID', 'error');
      return;
    }

    this.questionToDelete = question;
    this.confirmModalDetails.message = `Are you sure you want to delete "${question.title}"?`;
    this.confirmModalDetails.isOpen = true;
  }

  confirmDelete(): void {
    if (!this.questionToDelete || !this.questionToDelete.id) return;

    this.programmingQuestionService.deleteQuestion(this.questionToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showModal('Question deleted successfully!', 'success');
          this.loadQuestions();
          this.questionToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting question:', error);
          this.showModal('Failed to delete question. Please try again.', 'error');
          this.questionToDelete = null;
        }
      });
  }

  showModal(message: string, status: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.modalDetails = {
      isOpen: true,
      message,
      status,
      title: 'Programming Questions'
    };
  }

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

  canEditOrDelete(question: ProgrammingQuestion): boolean {
    // Admin can edit/delete any question
    if (this.isAdmin) {
      return true;
    }
    // User can edit/delete only their own questions
    return question.mobile === this.currentUserMobile;
  }

  canViewAnswer(question: ProgrammingQuestion): boolean {
    // Admin can view all answers
    if (this.isAdmin) {
      return true;
    }
    // User can view answers only for their own questions
    return question.mobile === this.currentUserMobile;
  }
}

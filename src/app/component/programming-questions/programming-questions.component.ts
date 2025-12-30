import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

type ProgrammingQuestion = {
  title: string;
  difficulty: Difficulty;
  topics: string[];
  prompt: string;
};

@Component({
  selector: 'app-programming-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './programming-questions.component.html',
  styleUrls: ['./programming-questions.component.scss'],
})
export class ProgrammingQuestionsComponent {
  searchQuery = '';

  questions: ProgrammingQuestion[] = [
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
        'Find the contiguous subarray with the largest sum and return its sum. Explain Kadane’s algorithm.',
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
        'Given a linked list, determine if it has a cycle. Implement Floyd’s cycle detection.',
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

  get filteredQuestions(): ProgrammingQuestion[] {
    const q = (this.searchQuery ?? '').toString().trim().toLowerCase();
    if (!q) return this.questions;

    return (this.questions || []).filter((item) => {
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
    });
  }

  trackByTitle = (_: number, q: ProgrammingQuestion) => q.title;
}

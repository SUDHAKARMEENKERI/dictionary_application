import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

type FaqItem = {
  q: string;
  a: string;
};

type FaqSection = {
  title: string;
  icon: string;
  items: FaqItem[];
};

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent {
  private openItemId: string | null = null;

  sections: FaqSection[] = [
    {
      title: 'Getting Started',
      icon: 'bi bi-rocket-takeoff',
      items: [
        {
          q: 'What is CareerPrepBook?',
          a: 'CareerPrepBook is a learning app that helps you practice vocabulary, interview Q&A, quizzes, and programming questions in one place.'
        },
        {
          q: 'Do I need an account to use the app?',
          a: 'Some areas (like your Word List and progress) require login so we can save your data. You can still explore public pages like About, Contact, and this FAQ.'
        },
        {
          q: 'Where should I start if I’m new?',
          a: 'Start from Interview Prep to pick a topic. Then try Tutorial for learning and Quiz for practice.'
        }
      ]
    },
    {
      title: 'Account & Login',
      icon: 'bi bi-person-check',
      items: [
        {
          q: 'I forgot my password. What should I do?',
          a: 'Use the Forgot Password page from Login. Follow the prompts to reset your password securely.'
        },
        {
          q: 'Why am I redirected to Login?',
          a: 'Some pages are protected to keep your data safe. If you are logged out or your session expires, the app will ask you to log in again.'
        }
      ]
    },
    {
      title: 'Word List',
      icon: 'bi bi-journal-text',
      items: [
        {
          q: 'How do I add a new word?',
          a: 'Open Word List → Add Word, enter the word and meaning, then submit. Your entry will appear in your list.'
        },
        {
          q: 'How do I edit an existing word?',
          a: 'Open Word List and click Edit for the word you want to update.'
        },
        {
          q: 'Can I export my words?',
          a: 'If export is enabled in your build, you can download your word list for offline use. Look for an export/download option on the Word List page.'
        }
      ]
    },
    {
      title: 'Interview Prep & Practice',
      icon: 'bi bi-lightning-charge',
      items: [
        {
          q: 'Where can I practice interview questions?',
          a: 'Use Interview Q&A to browse curated questions and answers, and use Interview Prep for topic-based learning.'
        },
        {
          q: 'What’s the difference between Tutorial, Quiz, and Output Practice?',
          a: 'Tutorial explains a topic step-by-step, Quiz tests your knowledge with scoring, and Output Practice focuses on predicting program output.'
        },
        {
          q: 'How do I add an Interview Q&A?',
          a: 'Open Interview Q&A → Add Interview Q&A and submit your question and answer.'
        }
      ]
    },
    {
      title: 'Troubleshooting',
      icon: 'bi bi-tools',
      items: [
        {
          q: 'The page is blank after refresh on GitHub Pages. Why?',
          a: 'This usually happens when the deployed app is missing the correct base URL for your repo. Ensure you deploy with base-href and deploy-url set to /dictionary_application/.'
        },
        {
          q: 'I found a bug or have feedback. How do I report it?',
          a: 'Use the Contact page to send details. Include what you were doing and any screenshots if possible.'
        }
      ]
    }
  ];

  trackByIndex = (i: number) => i;

  getItemId(sectionIndex: number, itemIndex: number): string {
    return `faq-${sectionIndex}-${itemIndex}`;
  }

  isOpen(itemId: string): boolean {
    return this.openItemId === itemId;
  }

  toggleItem(itemId: string): void {
    this.openItemId = this.openItemId === itemId ? null : itemId;
  }
}

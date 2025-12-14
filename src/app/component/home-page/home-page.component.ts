import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserSignUpService } from '../../service/user-signup.service';
import { WordListService } from '../../service/word-list.service';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit{

  userName = '';
  totalWords = 0;
  totalUsers = 0;
  userWords = 0;
  announcements = [
    'New feature: Export your word list to PDF!',
  ];
  navLinks = [
    { label: 'Word List', link: '/wordlist', icon: 'bi bi-list-ul' },
    { label: 'Add Word', link: '/addword', icon: 'bi bi-plus-circle' },
    { label: 'Add Question and Answer', link: '/addquestionanswer', icon: 'bi bi-plus-circle' },
    { label: 'Profile', link: '/profile', icon: 'bi bi-person' },
    { label: 'About', link: '/about', icon: 'bi bi-info-circle' },
    { label: 'Contact', link: '/contact', icon: 'bi bi-envelope' },
    { label: 'Settings', link: '/settings', icon: 'bi bi-gear' }
  ];
  recentActivities = [
    'Added new word: "serendipity".',
    'Updated profile information.',
    'Exported word list to Excel.'
  ];

  constructor(private router: Router, private userService: UserSignUpService,
    private wordService: WordListService
  ) {}

  ngOnInit(): void {
    const loginData = localStorage.getItem('login');
    this.userService.getUserDetailsByMobile(loginData ? JSON.parse(loginData).mobile : '').subscribe({
      next: (user) => {
        this.userName = user.firstName + ' ' + user.lastName; // Assuming the user object has a 'name' property
      },
      error: (error) => {
        console.error('Error fetching user details:', error);
      }
    });
    this.userService.getUserCount().subscribe({
      next: (countData) => {
        this.totalUsers = countData.totalUserCount;
      },
      error: (error) => {
        console.error('Error fetching user count:', error);
      }
    });

    this.wordService.getWordCount().subscribe({
      next: (countData) => {
        this.totalWords = countData.totalWordCount;
      },
      error: (error) => {
        console.error('Error fetching word count:', error);
      }
    });

    this.wordService.getWordCountByMobile(localStorage.getItem('login') ? JSON.parse(localStorage.getItem('login')!).mobile : '').subscribe({
      next: (countData) => {
        this.userWords = countData;
      },
      error: (error) => {
        console.error('Error fetching word count:', error);
      }
    });
  }

}

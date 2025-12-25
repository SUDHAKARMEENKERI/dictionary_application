import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  isEditMode = false;
  showSettings = false;
  coverColor = '#667eea';
  editProfileForm!: FormGroup;

  userProfile = {
    firstName: 'Sudhakar',
    lastName: 'Meenkeri',
    email: 'sudhakarmeenkeri@gmail.com',
    phone: '+91 96116 57325',
    joinedDate: 'January 15, 2024',
    lastActive: 'Today at 2:30 PM',
    level: 'Advanced',
    points: 2450,
    bio: 'Passionate learner and contributor. Love sharing knowledge and helping others improve their interview preparation skills.',
    wordsAdded: 234,
    qaContributions: 45,
    helpfulVotes: 1250,
    badges: 12,
    badgesList: [
      { name: 'Quick Learner', icon: 'bi bi-lightning-fill', description: 'Added 50+ words', color: '#667eea' },
      { name: 'Knowledge Sharer', icon: 'bi bi-share-fill', description: 'Created 10+ Q&A pairs', color: '#f093fb' },
      { name: 'Helpful Member', icon: 'bi bi-hand-thumbs-up-fill', description: '100+ helpful votes', color: '#4facfe' },
      { name: 'Consistent', icon: 'bi bi-calendar-check', description: '30-day streak', color: '#43e97b' },
      { name: 'Community Champion', icon: 'bi bi-award-fill', description: 'Top contributor', color: '#fa709a' },
      { name: 'Expert', icon: 'bi bi-star-fill', description: '1000+ points earned', color: '#feca57' },
      { name: 'Mentor', icon: 'bi bi-people-fill', description: 'Helped 50+ users', color: '#48dbfb' },
      { name: 'Certified', icon: 'bi bi-patch-check-fill', description: 'Verified contributor', color: '#00d2d3' },
      { name: 'Trendsetter', icon: 'bi bi-fire', description: 'Trending content', color: '#ff6b6b' },
      { name: 'Dedicated', icon: 'bi bi-heart-fill', description: '100+ hours contributed', color: '#ee5a6f' },
      { name: 'Early Adopter', icon: 'bi bi-rocket-fill', description: 'Early member', color: '#a8edea' },
      { name: 'Elite', icon: 'bi bi-crown-fill', description: 'Top 1% contributor', color: '#fed766' }
    ],
    recentActivities: [
      {
        text: 'Added new word: "Serendipity"',
        timestamp: '2 hours ago',
        icon: 'bi bi-plus-circle'
      },
      {
        text: 'Created Q&A: Angular Interview Questions',
        timestamp: '5 hours ago',
        icon: 'bi bi-chat-dots'
      },
      {
        text: 'Received 50 helpful votes',
        timestamp: '1 day ago',
        icon: 'bi bi-hand-thumbs-up'
      },
      {
        text: 'Earned "Community Champion" badge',
        timestamp: '3 days ago',
        icon: 'bi bi-award'
      },
      {
        text: 'Completed learning milestone: 200 words',
        timestamp: '1 week ago',
        icon: 'bi bi-trophy'
      }
    ]
  };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeEditForm();
  }

  initializeEditForm(): void {
    this.editProfileForm = this.fb.group({
      firstName: [this.userProfile.firstName],
      lastName: [this.userProfile.lastName],
      email: [this.userProfile.email],
      phone: [this.userProfile.phone],
      bio: [this.userProfile.bio]
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.initializeEditForm();
    }
  }

  toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  saveProfile(): void {
    if (this.editProfileForm.valid) {
      const updatedData = this.editProfileForm.value;
      this.userProfile = {
        ...this.userProfile,
        ...updatedData
      };
      this.isEditMode = false;
      alert('Profile updated successfully!');
    }
  }

  saveSettings(): void {
    alert('Settings saved successfully!');
    this.showSettings = false;
  }
}

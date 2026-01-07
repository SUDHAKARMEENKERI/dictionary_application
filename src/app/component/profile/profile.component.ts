import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { UserSignUpService } from '../../service/user-signup.service';
import { readLoginMobile } from '../../util/loginStorage';
import { ModalComponent, ModalDetails } from '../modal/modal.component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  isEditMode = false;
  showSettings = false;
  coverColor = '#667eea';
  editProfileForm!: FormGroup;
  userId: any;
  isLoading = false;
  saveSuccess = false;
  saveError = '';
  openModalDetails: ModalDetails = {
    isOpen: false,
    message: '',
    status: 'info',
    title: 'Profile Update'
  };

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

  constructor(
    private fb: FormBuilder,
    private userService: UserSignUpService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeEditForm();
    this.loadUserProfile();
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

  navigateToChangePassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  loadUserProfile(): void {
    const mobile = readLoginMobile();
    if (!mobile) {
      console.error('No mobile number found in login storage');
      return;
    }

    this.userService.getUserDetailsByMobile(mobile).subscribe({
      next: (response: any) => {
        if (response) {
          this.userId = response.id;
          // Update profile data if available from API
          if (response.firstName) this.userProfile.firstName = response.firstName;
          if (response.lastName) this.userProfile.lastName = response.lastName;
          if (response.email) this.userProfile.email = response.email;
          if (response.mobile) this.userProfile.phone = response.mobile;
          // Refresh form with loaded data
          this.initializeEditForm();
        }
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }

  saveProfile(): void {
    if (this.editProfileForm.valid) {
      this.isLoading = true;
      this.saveSuccess = false;
      this.saveError = '';

      const updatedData = this.editProfileForm.value;
      const userUpdatePayload = {
        id: this.userId,
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        email: updatedData.email,
        mobile: updatedData.phone,
        bio: updatedData.bio
      };

      this.userService.patchUser(userUpdatePayload).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.saveSuccess = true;
          
          // Update local profile data
          this.userProfile = {
            ...this.userProfile,
            ...updatedData
          };
          
          // Update localStorage if needed
          const loginData = localStorage.getItem('login');
          if (loginData) {
            const parsed = JSON.parse(loginData);
            parsed.firstName = updatedData.firstName;
            parsed.lastName = updatedData.lastName;
            localStorage.setItem('login', JSON.stringify(parsed));
          }
          
          this.isEditMode = false;
          
          // Show success modal
          this.openModalDetails = {
            isOpen: true,
            status: 'success',
            title: 'Profile Updated',
            message: 'Your profile has been updated successfully!'
          };
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.saveSuccess = false;
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          this.saveError = error.error?.message || 'Failed to update profile. Please try again.';
          console.error('Error updating profile:', error);
          
          // Show error modal
          this.openModalDetails = {
            isOpen: true,
            status: 'error',
            title: 'Update Failed',
            message: this.saveError
          };
        }
      });
    }
  }

  saveSettings(): void {
    alert('Settings saved successfully!');
    this.showSettings = false;
  }

  logout(): void {
    // Clear localStorage
    localStorage.removeItem('login');
    
    // Show logout modal
    this.openModalDetails = {
      isOpen: true,
      status: 'success',
      title: 'Logged Out',
      message: 'You have been logged out successfully!'
    };

    // Navigate to login page after a short delay
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 1500);
  }
}

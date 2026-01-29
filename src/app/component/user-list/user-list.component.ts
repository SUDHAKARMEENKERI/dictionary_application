import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserDetail, UserSignUpService } from '../../service/user-signup.service';
import { readLoginMobile } from '../../util/loginStorage';
import { ADMIN_MOBILE } from '../../util/app-constants';
import { ModalComponent, ModalDetails } from '../modal/modal.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  users: UserDetail[] = [];
  isLoading = false;
  private readonly adminMobile = ADMIN_MOBILE;
  private destroy$ = new Subject<void>();

  // Modal
  modalDetails: ModalDetails = {
    isOpen: false,
    message: '',
    status: 'info',
    title: 'User List'
  };

  constructor(
    private userService: UserSignUpService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if logged user is admin before loading data
    if (!this.isAdmin) {
      this.showModal('Access Denied. Only admin can view user list.', 'error');
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
      return;
    }

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAdmin(): boolean {
    const currentMobile = readLoginMobile();
    return currentMobile === this.adminMobile;
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.showModal('Failed to load users. Please try again.', 'error');
          this.isLoading = false;
        }
      });
  }

  showModal(message: string, status: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.modalDetails = {
      isOpen: true,
      message,
      status,
      title: 'User List'
    };
  }

  trackByUserId = (_: number, user: UserDetail) => user.id || user.mobile;
}

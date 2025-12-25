import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserSignUpService } from '../../service/user-signup.service';
import { ModalComponent } from '../modal/modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  constructor(private authService: AuthService, private router: Router,
    private userService: UserSignUpService
  ) { }

  showMenu = false;
  userName = 'Sudhakar';

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  // logout() {
  //   // clear session / token
  //   localStorage.clear();
  //   this.showMenu = false;
  //   // redirect to login
  // }

  // userName: string = '';
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.getUserDetailsByMobile();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserDetailsByMobile(): void {
    const loginData = localStorage.getItem('login');
    this.userService.getUserDetailsByMobile(loginData ? JSON.parse(loginData).mobile : '')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.userName = user.firstName; // Assuming the user object has a 'name' property
        },
        error: (error) => {
          console.error('Error fetching user details:', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
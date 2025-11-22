import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserSignUpService } from '../../service/user-signup.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router,
    private userService: UserSignUpService
  ) { }

  userName: string = '';

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
    this.userService.getUserDetailsByMobile(loginData ? JSON.parse(loginData).mobile : '').subscribe({
      next: (user) => {
        this.userName = user.firstName + ' ' + user.lastName; // Assuming the user object has a 'name' property
      },
      error: (error) => {
        console.error('Error fetching user details:', error);
      }
    });
  }
}
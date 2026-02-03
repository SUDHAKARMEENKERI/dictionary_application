import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserSignUpService } from '../../service/user-signup.service';
import { ModalComponent } from '../modal/modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { readLoginMobile } from '../../util/loginStorage';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  constructor(private authService: AuthService, private router: Router,
    private userService: UserSignUpService, private elementRef: ElementRef
  ) { }

  showMenu = false;
  firstName = '';
  lastName = '';

  navLinks: Array<{ label: string; path: string }> = [
    { label: 'Home', path: '/dashboard' },
    // { label: 'FAQ', path: '/faq' },
    // { label: 'Programming', path: '/programming-questions' },
  ];

  secondaryLinks: Array<{ label: string; path: string }> = [
    { label: 'Home', path: '/dashboard' },
    { label: 'Interview Prep', path: '/interview-prep' },
    { label: 'Interview Q&A', path: '/interview-qa' },
    { label: 'Add Interview Q&A', path: '/interview-qa/editor' },
    { label: 'Quiz', path: '/quiz' },
    { label: 'Output Practice', path: '/output-practice' },
    { label: 'My Questions', path: '/my-questions' },
    { label: 'My Progress', path: '/progress' },
    { label: 'Add Programming Q&A ', path: '/programming-questions' },
    { label: 'Show Programming', path: '/programming-qa' },
    { label: 'Add Word', path: '/words/new' },
    { label: 'Word List', path: '/words' },
    // { label: 'Profile', path: '/profile' },
    //{ label: 'Settings', path: '/settings' },
    // { label: 'Help Center', path: '/help-center' },
    // { label: 'FAQ', path: '/faq' },
    // { label: 'About', path: '/about' },
    //{ label: 'Contact', path: '/contact' },
  ];

  adminLinks: Array<{ label: string; path: string }> = [
    { label: 'Image Generator', path: '/qa-image-generator' },
    { label: 'Banner Generator', path: '/promotion-banner' },
    { label: 'Page View Stats', path: '/admin/page-view-stats' },
    { label: 'User Management', path: '/admin/users' },
    { label: 'Promo PDF Generator', path: '/admin/promo-pdf' },
  ];

  trackByPath = (_: number, link: { path: string }) => link.path;

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  closeMenu() {
    this.showMenu = false;
  }

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.getUserDetailsByMobile();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get allLinks(): Array<{ label: string; path: string }> {
    if (this.isAdmin) {
      return [...this.secondaryLinks, ...this.adminLinks];
    }
    return this.secondaryLinks;
  }

  logout(): void {
    this.authService.logout();
    this.firstName = '';
    this.lastName = '';
    this.router.navigate(['/login']);
    this.showMenu = false;
  }

  getUserDetailsByMobile(): void {
    const mobile = readLoginMobile();
    if (!mobile) {
      this.firstName = '';
      this.lastName = '';
      return;
    }
    this.userService.getUserDetailsByMobile(mobile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.firstName = user.firstName ?? '';
          this.lastName = user.lastName ?? '';
        },
        error: (error) => {
          console.error('Error fetching user details:', error);
        }
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.showMenu = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
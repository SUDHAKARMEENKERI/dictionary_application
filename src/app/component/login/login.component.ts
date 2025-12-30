import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserSignUpService } from '../../service/user-signup.service';
import { setMobile } from '../../store/action';
import { Store } from '@ngrx/store';
import { LoaderService } from '../../service/loader.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalComponent, ModalDetails } from '../modal/modal.component';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ModalComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
}) 
export class LoginComponent implements OnDestroy {
  loginForm: FormGroup;
  showPassword = false;
  private destroy$ = new Subject<void>();

  openModalDetails: ModalDetails = {
    isOpen: false,
    message: '',
    status: 'info',
    title: 'Career Preparation App'
  };

  constructor(private fb: FormBuilder, private userService: UserSignUpService,
     private router: Router, private store: Store<{ mobile: string }>,
     private loaderService: LoaderService) {
    this.loginForm = this.fb.group({
      mobile: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit() {
    this.loaderService.show();
    if (!this.loginForm.valid) {
      this.loaderService.hide();
      this.loginForm.markAllAsTouched();
      this.openModalDetails = {
        isOpen: true,
        status: 'error',
        title: 'Career Preparation App',
        message: 'Please enter a valid mobile number and password.'
      };
      return;
    }

    this.userService.userLogin(this.loginForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        if (response?.isLogIn) {
          localStorage.setItem('login', JSON.stringify({
            isLogIn: response.isLogIn,
            mobile: response.mobile,
            firstName: response.firstName,
            lastName: response.lastName
          }));
          this.store.dispatch(setMobile({ mobile: response.mobile }));
          this.loaderService.hide();
          this.router.navigate(['/dashboard']);
          return;
        }

        this.loaderService.hide();
        this.openModalDetails = {
          isOpen: true,
          status: 'error',
          title: 'Career Preparation App',
          message: 'Login failed. Please check your mobile number and password.'
        };
      }, error => {
        this.loaderService.hide();
        console.error('Error logging in user', error);
        this.openModalDetails = {
          isOpen: true,
          status: 'error',
          title: 'Career Preparation App',
          message: 'Login failed. Please try again.'
        };
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}

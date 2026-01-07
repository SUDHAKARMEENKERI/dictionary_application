import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserSignUpService } from '../../service/user-signup.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalComponent, ModalDetails } from '../modal/modal.component';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ModalComponent],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy{
   forgotForm!: FormGroup;
   showPassword = false;
   showConfirmPassword = false;
   isLoading = false;
   private destroy$ = new Subject<void>();

   openModalDetails: ModalDetails = {
     isOpen: false,
     message: '',
     status: 'info',
     title: 'Career Preparation App'
   };

  constructor(private fb: FormBuilder, private userService: UserSignUpService,
    private router: Router
  ) {
    
  }
  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit() {
    if (!this.forgotForm.valid) {
      this.forgotForm.markAllAsTouched();
      this.openModalDetails = {
        isOpen: true,
        status: 'error',
        title: 'Career Preparation App',
        message: 'Please enter a valid mobile number and matching passwords.'
      };
      return;
    }

    this.isLoading = true;
    const mobile = this.forgotForm.value.mobile;
    const newPassword = this.forgotForm.value.password;

    // First, get user details by mobile number
    this.userService.getUserDetailsByMobile(mobile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: any) => {
          if (!user || !user.id) {
            this.isLoading = false;
            this.openModalDetails = {
              isOpen: true,
              status: 'error',
              title: 'User Not Found',
              message: 'No account found with this mobile number.'
            };
            return;
          }

          // Update password using patchUser API
          const passwordUpdate = {
            id: user.id,
            password: newPassword
          };

          this.userService.patchUser(passwordUpdate)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (response) => {
                this.isLoading = false;
                
                // Clear form on success
                this.forgotForm.reset();
                
                // Show success modal
                this.openModalDetails = {
                  isOpen: true,
                  status: 'success',
                  title: 'Password Updated',
                  message: 'Your password has been updated successfully! Redirecting to login...'
                };
                
                // Navigate to login after 2 seconds
                setTimeout(() => {
                  this.router.navigate(['/login']);
                }, 2000);
              },
              error: (error) => {
                this.isLoading = false;
                console.error('Error updating password', error);
                this.openModalDetails = {
                  isOpen: true,
                  status: 'error',
                  title: 'Update Failed',
                  message: (error?.error?.message || error?.message || 'Password reset failed. Please try again.')
                };
              }
            });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error fetching user', error);
          this.openModalDetails = {
            isOpen: true,
            status: 'error',
            title: 'Error',
            message: 'Unable to find user with this mobile number.'
          };
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

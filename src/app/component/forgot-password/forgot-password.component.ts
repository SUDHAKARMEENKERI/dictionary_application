import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserSignUpService } from '../../service/user-signup.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy{
   forgotForm!: FormGroup;
   showPassword = false;
   showConfirmPassword = false;
   private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private userService: UserSignUpService,
    private router: Router
  ) {
    
  }
  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.forgotForm.valid) {
      this.userService.updateUser(this.forgotForm.value).pipe(takeUntil(this.destroy$)).subscribe(response => {
        this.router.navigate(['/login']);
      }, error => {
        console.error('Error updating password', error);
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

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

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
}) 
export class LoginComponent implements OnDestroy {
  loginForm: FormGroup;
  showPassword = false;
  private destroy$ = new Subject<void>();

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
    if (this.loginForm.valid) {
      this.userService.userLogin(this.loginForm.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe((response: any) => {
        if(response.isLogIn){
          localStorage.setItem('login', JSON.stringify({isLogIn: response.isLogIn, mobile: response.mobile, firstName: response.firstName,
            lastName: response.lastName
          }));
          this.store.dispatch(setMobile({ mobile: response.mobile }));
          this.loaderService.hide();
          this.router.navigate(['/dashboard']);
        }
      }, error => {
        this.loaderService.hide();
        console.error('Error logging in user', error);
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}

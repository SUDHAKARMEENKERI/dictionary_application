import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserSignUpService } from '../../service/user-signup.service';
import { Router } from '@angular/router';
import { LoaderService } from '../../service/loader.service';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;

  constructor(private fb: FormBuilder, private userService: UserSignUpService,
    private router: Router, private loaderService: LoaderService
  ) {
   
  }

  ngOnInit(): void {
     this.signupForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      mobile: ['', Validators.required],
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
    this.loaderService.show();
    if (this.signupForm.valid) {
      this.userService.registerUser(this.signupForm.value).subscribe(response => {
        this.router.navigate(['/home']);
        this.loaderService.hide();
      }, error => {
        console.error('Error registering user', error);
        this.loaderService.hide();
      });
    }
  }

}

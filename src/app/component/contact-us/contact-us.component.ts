import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContactService } from '../../service/contact.service';
import { Subject, timer } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { apiEmpty } from '../../util/apiRx';

@Component({
  selector: 'app-contact-us',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit, OnDestroy {
  constructor(private contactService: ContactService) { }
  messageShow: string = '';
  contactForm!: FormGroup;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.contactForm = new FormGroup({
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      message: new FormControl('', Validators.required),
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.contactService
        .saveContactForm(this.contactForm.value)
        .pipe(
          tap(() => {
            this.messageShow = 'Thank you for contacting us! We will get back to you shortly.';
            this.contactForm.reset();
          }),
          apiEmpty('Error submitting contact form'),
          switchMap(() => timer(5000)),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.messageShow = '';
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

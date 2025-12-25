import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContactService } from '../../service/contact.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
      this.contactService.saveContactForm(this.contactForm.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Contact form submitted successfully', response);
          },
          error: (error) => {
            console.error('Error submitting contact form', error);
          }
        });
      // Here you can handle the form submission, e.g., send the data to a server
      this.messageShow = 'Thank you for contacting us! We will get back to you shortly.';
      setTimeout(() => {
        this.messageShow = '';
      }, 5000);
      this.contactForm.reset();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

export type ModalStatus = 'success' | 'error' | 'info' | 'warning';

export interface ModalDetails {
  isOpen: boolean;
  message: string;
  status?: ModalStatus;
  title?: string;
  isConfirmation?: boolean;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-modal',
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent {
  @Input() openModalDetails!: ModalDetails;
  @Output() onConfirm = new EventEmitter<void>();

  get status(): ModalStatus {
    return this.openModalDetails?.status ?? 'info';
  }

  get title(): string {
    return this.openModalDetails?.title ?? 'Career Preparation App';
  }

  get isConfirmation(): boolean {
    return this.openModalDetails?.isConfirmation ?? false;
  }

  get confirmText(): string {
    return this.openModalDetails?.confirmText ?? 'Confirm';
  }

  get cancelText(): string {
    return this.openModalDetails?.cancelText ?? 'Cancel';
  }

  openModal() {
    this.openModalDetails.isOpen = true;
  }

  closeModal() {
    this.openModalDetails.isOpen = false;
  }

  confirm() {
    this.onConfirm.emit();
    this.closeModal();
  }

}

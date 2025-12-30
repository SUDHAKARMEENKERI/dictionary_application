import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type ModalStatus = 'success' | 'error' | 'info';

export interface ModalDetails {
  isOpen: boolean;
  message: string;
  status?: ModalStatus;
  title?: string;
}

@Component({
  selector: 'app-modal',
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent {
  @Input() openModalDetails!: ModalDetails;

  get status(): ModalStatus {
    return this.openModalDetails?.status ?? 'info';
  }

  get title(): string {
    return this.openModalDetails?.title ?? 'Career Preparation App';
  }

  openModal() {
    this.openModalDetails.isOpen = true;
  }

  closeModal() {
    this.openModalDetails.isOpen = false;
  }

}

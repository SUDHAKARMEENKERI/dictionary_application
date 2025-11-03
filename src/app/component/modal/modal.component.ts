import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent {
  @Input() openModalDetails: any;

  openModal() {
    this.openModalDetails.isOpen = true;
  }

  closeModal() {
    this.openModalDetails.isOpen = false;
  }

}

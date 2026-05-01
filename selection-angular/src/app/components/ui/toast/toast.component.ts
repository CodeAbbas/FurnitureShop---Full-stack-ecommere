import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
  @Input() message: string = '';
  @Input() type: ToastType = 'success';

  get bgClass(): string {
    switch (this.type) {
      case 'error': return 'text-bg-danger';
      case 'info':  return 'text-bg-info';
      default:      return 'text-bg-success';
    }
  }
}
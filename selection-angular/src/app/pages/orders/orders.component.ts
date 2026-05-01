import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {

  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);

  orders: Order[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  showSuccessBanner: boolean = false;

  readonly fallbackImage: string =
    'https://picsum.photos/seed/selection/100/100';

  ngOnInit(): void {
    this.showSuccessBanner =
      this.route.snapshot.queryParamMap.get('newOrder') === 'true';

    this.loadOrders();
  }

  // ============================================================
  //  Data fetching
  // ============================================================

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.orderService.getOrders().subscribe({
      next: (response) => {
        this.orders = [...response].reverse();
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  // ============================================================
  //  View helpers
  // ============================================================

  statusBadgeClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pending':    return 'bg-warning text-dark';
      case 'processing': return 'bg-info text-dark';
      case 'shipped':    return 'bg-primary';
      case 'delivered':  return 'bg-success';
      case 'cancelled':  return 'bg-danger';
      default:           return 'bg-secondary';
    }
  }

  totalItems(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getItemImage(item: { image?: string }): string {
    return item.image || this.fallbackImage;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.fallbackImage;
  }
  dismissBanner(): void {
    this.showSuccessBanner = false;
  }
}
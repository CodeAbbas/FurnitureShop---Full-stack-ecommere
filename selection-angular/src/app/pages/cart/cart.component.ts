import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { CartItem } from '../../models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit, OnDestroy {

  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);

  cartItems: CartItem[] = [];
  cartTotal: number = 0;

  readonly fallbackImage: string =
    'https://picsum.photos/seed/selection/200/200';

  private subscription: Subscription = new Subscription();

  ngOnInit(): void {
    this.subscription.add(
      this.cartService.cartItems$.subscribe((items) => {
        this.cartItems = items;
        this.cartTotal = this.cartService.getCartTotal();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // ============================================================
  //  Row actions — delegate to CartService
  // ============================================================

  increaseQuantity(item: CartItem): void {
    this.cartService.updateQuantity(item.product._id ?? '', item.quantity + 1);
  }

  decreaseQuantity(item: CartItem): void {
    this.cartService.updateQuantity(item.product._id ?? '', item.quantity - 1);
  }

  onQuantityInput(item: CartItem, event: Event): void {
    const target = event.target as HTMLInputElement;
    const parsed = parseInt(target.value, 10);

    if (Number.isNaN(parsed) || parsed < 1) {
      target.value = String(item.quantity);
      return;
    }

    this.cartService.updateQuantity(item.product._id ?? '', parsed);
  }

  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.product._id ?? '');
  }

  // ============================================================
  //  View helpers
  // ============================================================

  getItemImage(item: CartItem): string {
    if (item.product.images && item.product.images.length > 0) {
      return item.product.images[0];
    }
    return this.fallbackImage;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.fallbackImage;
  }

  rowSubtotal(item: CartItem): number {
    return (item.product.price ?? 0) * item.quantity;
  }

  // ============================================================
  //  Checkout action
  // ============================================================
  proceedToCheckout(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/checkout']);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/cart' }
      });
    }
  }
}
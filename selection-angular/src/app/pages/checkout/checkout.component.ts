import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { CartItem } from '../../models/cart.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);

  cartItems: CartItem[] = [];
  cartTotal: number = 0;

  checkoutForm!: FormGroup;
  isSubmitting: boolean = false;
  errorMessage: string = '';

  readonly fallbackImage: string =
    'https://picsum.photos/seed/selection/100/100';

  ngOnInit(): void {
    this.cartItems = this.cartService.getCartItems();
    this.cartTotal = this.cartService.getCartTotal();

    if (this.cartItems.length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    this.initCheckoutForm();
  }

  // ============================================================
  //  Reactive Form
  // ============================================================

  private initCheckoutForm(): void {
    this.checkoutForm = this.formBuilder.group({
      fullName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(80)
      ]],
      address: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]],
      cardNumber: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{16}$/)
      ]],
      expiry: ['', [
        Validators.required,
        Validators.pattern(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)
      ]],
      cvv: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{3,4}$/)
      ]]
    });
  }
  isInvalid(controlName: string): boolean {
    const control = this.checkoutForm.controls[controlName];
    return !!control && control.invalid && control.touched;
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
  //  Submit
  // ============================================================

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.orderService.placeOrder(this.cartItems).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.isSubmitting = false;
        this.router.navigate(['/orders'], {
          queryParams: { newOrder: 'true' }
        });
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.isSubmitting = false;
      }
    });
  }
}
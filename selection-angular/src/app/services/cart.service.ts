import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Product } from '../models/product.model';
import { CartItem } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class CartService {

  private readonly STORAGE_KEY: string = 'selection_cart';
  private cartItemsSubject: BehaviorSubject<CartItem[]>;
  public cartItems$: Observable<CartItem[]>;
  public cartCount$: Observable<number>;

  constructor() {
    const initial = this.loadFromStorage();
    this.cartItemsSubject = new BehaviorSubject<CartItem[]>(initial);

    this.cartItems$ = this.cartItemsSubject.asObservable();
    this.cartCount$ = this.cartItems$.pipe(
      map((items) => items.reduce((sum, item) => sum + item.quantity, 0))
    );
  }

  // ============================================================
  //  Public API — mutators
  // ============================================================


  addToCart(product: Product, quantity: number = 1): boolean {
    const stock = product.inStock ?? 0;
    
    if (stock <= 0) {
      return false;
    }

    const items = this.snapshot();
    const existing = items.find((item) => item.product._id === product._id);

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      if (newQuantity > stock) {
        existing.quantity = stock;
      } else {
        existing.quantity = newQuantity;
      }
    } else {
      const safeQuantity = Math.min(quantity, stock);
      items.push({ product: product, quantity: safeQuantity });
    }

    this.commit(items);
    return true;
  }

  removeFromCart(productId: string): void {
    const items = this.snapshot().filter(
      (item) => item.product._id !== productId
    );
    this.commit(items);
  }


  updateQuantity(productId: string, quantity: number): void {
    if (quantity < 1) {
      this.removeFromCart(productId);
      return;
    }

    const items = this.snapshot();
    const target = items.find((item) => item.product._id === productId);
    if (!target) {
      return;
    }

    const stock = target.product.inStock ?? 0;
    target.quantity = Math.min(quantity, stock);
    this.commit(items);
  }

  clearCart(): void {
    this.commit([]);
  }

  // ============================================================
  //  Public API — selectors
  // ============================================================

  getCartTotal(): number {
    return this.snapshot().reduce(
      (sum, item) => sum + ((item.product.price ?? 0) * item.quantity),
      0
    );
  }

  getCartItems(): CartItem[] {
    return this.snapshot();
  }

  // ============================================================
  //  Private helpers
  // ============================================================

  private snapshot(): CartItem[] {
    return [...this.cartItemsSubject.value];
  }

  private commit(items: CartItem[]): void {
    this.cartItemsSubject.next(items);
    this.saveToStorage(items);
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('[CartService] Corrupt cart in localStorage, resetting.');
      localStorage.removeItem(this.STORAGE_KEY);
      return [];
    }
  }

  private saveToStorage(items: CartItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('[CartService] Failed to persist cart:', err);
    }
  }
}
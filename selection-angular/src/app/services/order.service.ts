import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, throwError, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { CartItem } from '../models/cart.model';
import { Order } from '../models/order.model';

export interface OrderResponse {
  message: string;
  order_id: string;
  totalAmount: number;
}
@Injectable({ providedIn: 'root' })
export class OrderService {

  apiBaseUrl: string = 'http://127.0.0.1:5000/api/v1.0';

  constructor(private http: HttpClient) { }

  // ============================================================
  //  Public API
  // ============================================================


  placeOrder(cartItems: CartItem[]): Observable<OrderResponse> {
    if (!cartItems || cartItems.length === 0) {
      return throwError(() => new Error(
        'Cannot place an order — your cart is empty.'
      ));
    }

    const syncRequests = cartItems.map((item) => this.syncCartItem(item));

    return forkJoin(syncRequests).pipe(
      switchMap(() => this.processCheckout()),
      catchError(this.handleError)
    );
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(
      this.apiBaseUrl + '/user/orders'
    ).pipe(catchError(this.handleError));
  }

  // ============================================================
  //  Private helpers
  // ============================================================

  private syncCartItem(item: CartItem): Observable<any> {
    const payload = {
      product_id: item.product._id,
      quantity: item.quantity
    };

    return this.http.post<any>(
      this.apiBaseUrl + '/user/cart/items',
      payload
    );
  }

  private processCheckout(): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(
      this.apiBaseUrl + '/user/checkout',
      {}
    );
  }

  // ============================================================
  // ProductService pattern
  // ============================================================

  private handleError(error: HttpErrorResponse | Error) {
    let message = 'An unknown error occurred while placing your order.';

    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        message = 'Network error: ' + error.error.message;
      } else if (error.status === 0) {
        message = 'Cannot reach the SelectionDB API. Is the Flask server running on port 5000?';
      } else if (error.status === 400) {
        message = error.error?.error ?? 'Your cart could not be processed. Please review and try again.';
      } else if (error.status === 401) {
        message = 'Your session has expired. Please log in again to complete your order.';
      } else if (error.status === 404) {
        message = error.error?.error ?? 'One or more products in your cart are no longer available.';
      } else if (error.status >= 500) {
        message = 'The server encountered an internal error while processing your order.';
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    console.error('[OrderService] error:', error);
    return throwError(() => new Error(message));
  }
}
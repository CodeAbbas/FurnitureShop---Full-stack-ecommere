import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  isMenuCollapsed: boolean = true;
  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }


  get username(): string | null {
    return this.authService.getUsername();
  }
  private cartService = inject(CartService);

  cartCount$: Observable<number> = this.cartService.cartCount$;


  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { CatalogComponent } from './pages/catalog/catalog.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CartComponent } from './pages/cart/cart.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // 1. Home / Default
  { path: '', component: CatalogComponent },
  
  // 2. Dynamic Routes
  { path: 'product/:id', component: ProductDetailComponent },
  
  // 3. The Cart
  { path: 'cart', component: CartComponent }, 

  // 4. Checkout
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component')
      .then(m => m.CheckoutComponent),
    canActivate: [authGuard]
  },
  // 5. Orders
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders.component')
      .then(m => m.OrdersComponent),
    canActivate: [authGuard]
  },
  // 6. Admin Dashboard
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component')
      .then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard]
  },
  
  //7. Auth Routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  { path: '**', redirectTo: '' }
];
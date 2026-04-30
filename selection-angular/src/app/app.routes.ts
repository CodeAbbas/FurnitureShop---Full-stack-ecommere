import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  // Authentication Routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Temporary fallback: redirect the base URL to login until we build the Home page
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Wildcard route for 404s (we can build a proper 404 page later)
  { path: '**', redirectTo: '/login' }
];
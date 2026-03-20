import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Catalog} from './pages/catalog/catalog';
import jsonData from './assets/products.json';

@Component({
  selector: 'app-root',
  imports: [Catalog, RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App{
  protected readonly title = 'Selection Furniture';
  
}
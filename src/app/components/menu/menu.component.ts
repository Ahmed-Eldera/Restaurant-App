import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Dish } from '../../models/dish.model';
import { CartService } from '../../services/cart.service';
import { DishService } from '../../services/dish.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent implements OnInit, OnDestroy {
  dishes$: Observable<Dish[]> = of([]);
  dishes: Dish[] = [];
  categories: string[] = [];
  filteredDishes: Dish[] = [];
  selectedCategory = 'all';
  searchTerm = '';
  showToast = false;
  toastMessage = '';
  isAdmin = false;

  private destroy$ = new Subject<void>();

  constructor(
    private dishService: DishService,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isAdmin = user?.isAdmin ?? false;
    });

    this.dishService
      .getAllDishes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dishes: Dish[]) => {
          console.log('[DEBUG] Dishes received from Firestore:', dishes);
          this.dishes = dishes;
          this.extractCategories();
          this.filterDishes();
        },
        error: (err) => {
          console.error('[ERROR] Failed to fetch dishes:', err);
        },
      });
  }

  extractCategories(): void {
    const uniqueCategories = new Set<string>();
    this.dishes.forEach((dish) => {
      if (dish.category) uniqueCategories.add(dish.category);
    });
    this.categories = Array.from(uniqueCategories);
  }

  filterDishes(): void {
    this.filteredDishes = this.dishes.filter((dish) => {
      const matchesCategory =
        this.selectedCategory === 'all' || dish.category === this.selectedCategory;
      const matchesSearch =
        this.searchTerm === '' ||
        dish.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dish.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.filterDishes();
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.filterDishes();
  }

  addToCart(dish: Dish): void {
    if (this.isAdmin) return;

    this.cartService.addToCart(dish);
    this.toastMessage = `${dish.name} added to cart!`;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 2000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

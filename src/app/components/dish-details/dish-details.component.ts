import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { switchMap, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

import { Dish } from '../../models/dish.model';
import { DishService } from '../../services/dish.service';

@Component({
  selector: 'app-dish-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dish-details.component.html',
  styleUrls: ['./dish-details.component.css']
})
export class DishDetailsComponent implements OnInit, OnDestroy {
  dish: Dish | null = null;
  loading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private dishService: DishService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const id = params.get('id');
          if (!id) return of(null);
          return this.dishService.getDishById(id);
        })
      )
      .subscribe(dish => {
        this.dish = dish;
        this.loading = false;
        console.log('[DishDetails] Loaded dish:', dish);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  currentUser$: Observable<User | null>;
  isLoggedIn$: Observable<boolean>;
  isAdmin$: Observable<boolean>;
  cartItemCount$: Observable<number>;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$.pipe(
      map(user => user ?? null) // treat undefined as null for display logic
    );

    this.isLoggedIn$ = this.authService.currentUser$.pipe(
      map(user => !!user)
    );

    this.isAdmin$ = this.authService.currentUser$.pipe(
      map(user => !!user?.isAdmin)
    );

    this.cartItemCount$ = this.authService.currentUser$.pipe(
      switchMap(user => {
        if (user && !user.isAdmin) {
          return this.cartService.getCartItems().pipe(
            map(items => items.reduce((total, item) => total + item.quantity, 0))
          );
        }
        return of(0);
      })
    );
  }

  ngOnInit(): void {}

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}

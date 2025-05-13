import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cart-item.model';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems$!: Observable<CartItem[]>;
  address: string = '';
  phone: string = '';

  constructor(
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.cartItems$ = this.cartService.getCartItems();
  }

  removeFromCart(dishId: string): void {
    this.cartService.removeFromCart(dishId);
  }

  decreaseQuantity(dishId: string): void {
    this.cartService.decreaseQuantity(dishId);
  }

  increaseQuantity(dishId: string): void {
    this.cartService.increaseQuantity(dishId);
  }

  getTotalPrice(cartItems: CartItem[]): number {
    return cartItems.reduce((total, item) => total + item.dish.price * item.quantity, 0);
  }

  checkout(): void {
    this.cartService.checkout(this.address, this.phone);
    this.address = '';
    this.phone = '';
  }
}

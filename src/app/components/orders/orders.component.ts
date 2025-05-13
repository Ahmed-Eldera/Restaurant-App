import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';

type OrderStatus = 'pending' | 'cancelled' | 'processing' | 'completed';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  isAdmin = false;
  userId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(user => {
          this.userId = user?.uid || null;
          this.isAdmin = user?.isAdmin ?? false;

          if (!this.userId) return [];

          return this.isAdmin
            ? this.orderService.getAllOrders()
            : this.orderService.getOrdersByUser(this.userId);
        })
      )
      .subscribe(orders => {
        this.orders = orders;
      });
  }

  getStatusBadgeClass(status: OrderStatus): string {
    switch (status) {
      case 'pending': return 'badge bg-warning';
      case 'processing': return 'badge bg-info';
      case 'completed': return 'badge bg-success';
      case 'cancelled': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus): void {
    if (this.isAdmin) {
      this.orderService.updateOrderStatus(orderId, newStatus).subscribe(() => {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          order.status = newStatus;
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import { Dish } from './dish.model';

export interface CartItem {
  id?: string;
  dish: Dish;
  quantity: number;
}

import type { CartItem } from "./cart-item.model";

export interface Order {
  id?: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: Date;
  address?: string;
  phone?: string;
}

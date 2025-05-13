export interface Dish {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
  featured: boolean;
}

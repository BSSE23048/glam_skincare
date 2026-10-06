import type { Customer, CartLine, Order, Product, Review } from "../types";
// Implement behind server-validated endpoints in Phase 2. Never trust browser totals or stock.
export interface CatalogRepository {
  list(): Promise<Product[]>;
  get(slug: string): Promise<Product | null>;
}
export interface OrderRepository {
  create(input: {
    customer: Customer;
    items: CartLine[];
    payment: "cod" | "bank";
    receipt?: File;
    idempotencyKey: string;
  }): Promise<Order>;
  listMine(): Promise<Order[]>;
  getMine(id: string): Promise<Order | null>;
}
export interface AuthRepository {
  signIn(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
}
export interface ReviewRepository {
  listPublished(productId: string): Promise<Review[]>;
}
export interface SubscriptionRepository {
  subscribe(email: string, consent: boolean): Promise<void>;
}

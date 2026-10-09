export interface Variant {
  id: string;
  name: string;
  color: string;
  image: string;
  stock: number;
  sku: string;
  active?: boolean;
  priceOverride?: number;
  lowStockThreshold?: number;
}
export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  category: string;
  price: number;
  compareAt?: number;
  images: string[];
  variants: Variant[];
  material: string;
  care: string;
  reviews: Review[];
}
export interface Review {
  id: string;
  author: string;
  rating: number;
  body: string;
  verifiedPurchase: boolean;
  publishedAt: string;
}
export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}
export interface Customer {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  apartment: string;
  area: string;
  city: string;
  province: string;
  postalCode: string;
  instructions: string;
}
export interface Order {
  id: string;
  createdAt: string;
  items: CartLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  payment: "cod" | "manual_online_payment";
  status: "pending" | "payment_verification" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "payment_rejected";
  customer?: Customer;
  rejectionReason?: string;
}
export interface Discount {
  code: string;
  kind: "percentage" | "fixed";
  value: number;
  minimum: number;
  enabled: boolean;
}

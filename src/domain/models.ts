import type { Timestamp } from 'firebase/firestore';
import type { Customer, Product } from '../types';

export const orderStatuses = ['pending', 'payment_verification', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'payment_rejected'] as const;
export type OrderStatus = typeof orderStatuses[number];
export type PaymentMethod = 'cod' | 'manual_online_payment';
export type PaymentStatus = 'cod_pending' | 'awaiting_verification' | 'verified' | 'rejected';

export interface ProductCost {
  productId: string;
  costPrice: number;
  packagingCost?: number;
  handlingCost?: number;
  updatedAt?: Timestamp;
}

export interface StoreProduct extends Product {
  active: boolean;
  featured: boolean;
  lowStockThreshold: number;
  benefits: string[];
  usage: string;
  costPrice?: number;
  packagingCost?: number;
  handlingCost?: number;
  updatedAt?: Timestamp;
}

export interface SkuRecord {
  id: string;
  sku?: string;
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  image: string;
  price: number;
  stock: number;
  active: boolean;
  lowStockThreshold: number;
  costPrice?: number;
  updatedAt?: Timestamp;
}

export interface OrderItem {
  sku: string;
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  image: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  costPriceSnapshot?: number;
  lineCost?: number;
}

export interface ShopOrder {
  id: string;
  orderNumber: string;
  userId: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  inventoryReserved: boolean;
  verifiedAt: Timestamp | null;
  verifiedBy: string;
  rejectionReason?: string;
  trackingNumber: string;
  history: OrderEvent[];
  totalCost?: number;
  grossProfit?: number;
  adminNotes?: string;
}

export interface OrderEvent {
  status: OrderStatus;
  at: Timestamp;
  actor: string;
  message: string;
}

export interface Profile {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  defaultShipping?: Customer;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CustomerSummary {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt?: Timestamp | string;
}

export interface SavedAddress extends Customer {
  id: string;
  label: string;
}

export interface StoreSettings {
  name: string;
  tagline: string;
  whatsapp: string;
  instagram: string;
  siteUrl: string;
  currency: string;
  locale: string;
  preview: boolean;
  provisional: boolean;
  shipping: {
    fee: number;
    freeAbove: number;
    confirmed: boolean;
    estimatedDays: string;
  };
  bank: {
    name: string;
    accountTitle: string;
    accountNumber: string;
    instructions: string;
    enabled: boolean;
    wallet: string;
  };
  receiptBackend?: 'none';
  returnsPolicy: string;
  supportEmail: string;
}

export interface SiteContent {
  announcement: string;
  heroEyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroDescription: string;
  faqs: { question: string; answer: string }[];
}

export interface ModeratedReview {
  id: string;
  productId: string;
  orderId: string;
  userId: string;
  author: string;
  rating: number;
  body: string;
  status: 'pending' | 'approved' | 'hidden';
  verifiedPurchase: boolean;
  createdAt: Timestamp;
}

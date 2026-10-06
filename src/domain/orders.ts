import type { OrderStatus, PaymentStatus } from './models';
import { buildWhatsAppUrl, whatsappMessages } from '../config/business';

export const statusLabel = (status: string) => status.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());

export const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  payment_verification: ['confirmed', 'payment_rejected', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  payment_rejected: ['payment_verification', 'confirmed', 'cancelled'],
};

export function canTransition(current: OrderStatus, next: OrderStatus) {
  return nextStatuses[current]?.includes(next) ?? false;
}

export function transitionPayment(current: PaymentStatus, next: OrderStatus): PaymentStatus {
  if (next === 'confirmed') return 'verified';
  if (next === 'payment_rejected') return 'rejected';
  return current;
}

export function customerWhatsApp(phone: string, name: string, orderNumber: string) {
  const message = whatsappMessages.adminContactCustomer(name, orderNumber);
  return buildWhatsAppUrl(message, phone);
}


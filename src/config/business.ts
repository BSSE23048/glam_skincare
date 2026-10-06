import type { StoreSettings } from '../domain/models';

export interface PaymentMethodConfig {
  id: string;
  name: string;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
  iban?: string;
  instructions: string;
  enabled: boolean;
}

export const business: StoreSettings & {
  whatsappFormatted: string;
  paymentMethods: PaymentMethodConfig[];
} = {
  name: "Glam Skincare",
  tagline: "Glow. Care. Confidence.",
  whatsapp: "923224729343",
  whatsappFormatted: "+92 322 4729343",
  instagram: "Glamskincarepk",
  currency: "PKR",
  locale: "en-PK",
  siteUrl: import.meta.env.VITE_SITE_URL || "",
  preview: false,
  provisional: true,
  shipping: {
    fee: 200,
    freeAbove: 2500,
    confirmed: false,
    estimatedDays: "3–5 working days after order confirmation",
  },
  bank: {
    name: "Meezan Bank (Placeholder)",
    accountTitle: "Glam Skincare Store (Placeholder)",
    accountNumber: "0101-0102030405-01 (Placeholder)",
    instructions: "Please send payment via your online bank app, Easypaisa, or JazzCash, then send your payment screenshot to Glam Skincare on WhatsApp.",
    enabled: true,
    wallet: "Easypaisa / JazzCash: 0322 4729343 (Placeholder)",
  },
  paymentMethods: [
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      bankName: "Meezan Bank (Placeholder)",
      accountTitle: "Glam Skincare Store (Placeholder)",
      accountNumber: "0101-0102030405-01 (Placeholder)",
      iban: "PK00MEZN000101010203040501 (Placeholder)",
      instructions: "Transfer the exact order amount to the bank account above.",
      enabled: true,
    },
    {
      id: "easypaisa",
      name: "Easypaisa",
      bankName: "Easypaisa Account",
      accountTitle: "Glam Skincare (Placeholder)",
      accountNumber: "0322 4729343 (Placeholder)",
      instructions: "Send exact payment to Easypaisa account number.",
      enabled: true,
    },
    {
      id: "jazzcash",
      name: "JazzCash",
      bankName: "JazzCash Account",
      accountTitle: "Glam Skincare (Placeholder)",
      accountNumber: "0322 4729343 (Placeholder)",
      instructions: "Send exact payment to JazzCash account number.",
      enabled: true,
    },
  ],
  receiptBackend: 'none',
  returnsPolicy: 'Temporary policy: contact us within 7 days of delivery regarding an unused item in its original packaging. Opened hygiene products are not eligible for change-of-mind returns. For damaged or incorrect items, contact us promptly with photos on WhatsApp.',
  supportEmail: 'support@glamskincare.pk',
};

/**
 * Cleanly normalizes phone numbers into standard wa.me format (e.g. 923224729343).
 */
export function normalizeWhatsAppNumber(phone: string = business.whatsapp): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `92${digits.slice(1)}`;
  if (digits.startsWith('3')) digits = `92${digits}`;
  return digits || '923224729343';
}

/**
 * Builds standard WhatsApp deep links with optional pre-filled messages.
 */
export function buildWhatsAppUrl(message?: string, number: string = business.whatsapp): string {
  const cleanNumber = normalizeWhatsAppNumber(number);
  if (!message) {
    return `https://wa.me/${cleanNumber}`;
  }
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export const whatsappUrl = (
  message = "Hi Glam Skincare! 🤍 I need help with an order.",
  number = business.whatsapp,
) => buildWhatsAppUrl(message, number);

/**
 * Contextual WhatsApp message generators
 */
export const whatsappMessages = {
  generalSupport: () => "Hi Glam Skincare! 🤍 I have a question.",
  productQuestion: (productName: string) =>
    `Hi Glam Skincare! 🤍 I have a question about ${productName}.`,
  orderSupport: (orderNumber: string) =>
    `Hi Glam Skincare! 🤍 I need help regarding my order #${orderNumber}.`,
  paymentVerification: (orderNumber: string, amount: string, customerName: string) =>
    `Hi Glam Skincare! 🤍\n\nI have placed an online payment order.\n\nOrder Number: #${orderNumber}\nOrder Amount: ${amount}\nName: ${customerName}\n\nI am sending my payment screenshot here for verification.\n\nPlease confirm my payment and process my order.\n\nThank you!`,
  adminContactCustomer: (customerName: string, orderNumber: string) =>
    `Hi ${customerName.trim().split(/\s+/)[0]},\n\nThis is Glam Skincare regarding your order #${orderNumber}.\n\nWe are contacting you regarding your payment/order verification.`,
};

export const money = (value: number) =>
  new Intl.NumberFormat(business.locale, {
    style: "currency",
    currency: business.currency,
    maximumFractionDigits: 0,
  }).format(value);


import type { Product } from "../types";
export const products: Product[] = [
  {
    id: "bye-bye-makeup",
    slug: "bye-bye-makeup",
    name: "Bye-Bye Makeup",
    subtitle: "The reusable makeup-removal pad",
    category: "Cleansing essentials",
    description:
      "Meet the softer side of taking it all off. Our plush microfiber pad pairs with warm water to lift away makeup and make your end-of-day ritual feel a little more effortless. Rinse, wash, and reach for it again.",
    price: 850,
    compareAt: 1100,
    images: [
      "/images/pink-ritual.jpeg",
      "/images/pink-pad.jpeg",
      "/images/white-pad.jpeg",
      "/images/glam-packaging.jpeg",
      "/images/glam-care.jpeg",
    ],
    variants: [
      {
        id: "blush",
        name: "Blush Pink",
        color: "#e8abae",
        image: "/images/pink-pad.jpeg",
        stock: 20,
        sku: "GLAM-BBM-PNK",
      },
      {
        id: "ivory",
        name: "Soft White",
        color: "#f4f0e8",
        image: "/images/white-pad.jpeg",
        stock: 20,
        sku: "GLAM-BBM-WHT",
      },
    ],
    material: "100% Polyester Microfiber",
    care: "Machine wash cold. Do not use fabric softener or bleach. Hang to dry.",
    reviews: [],
  },
];
export const getProduct = (id: string) =>
  products.find((p) => p.id === id || p.slug === id);
export const faqs = [
  {
    question: "Do I really only need water?",
    answer:
      "The packaging recommends saturating the microfiber pad with warm water, then gently sweeping in circular motions. Makeup formulas vary, so repeat gently as needed and avoid scrubbing.",
  },
  {
    question: "How do I wash my pad?",
    answer:
      "Rinse with soap after use. Machine wash cold, without fabric softener or bleach, and hang to dry. Always let the pad dry fully before storing it.",
  },
  {
    question: "Can I use it around my eyes?",
    answer:
      "As directed on the packaging, hold the wet pad briefly over a closed eyelid before wiping heavier makeup away. Use a light touch and stop if you feel irritation.",
  },
  {
    question: "Which colours can I choose?",
    answer:
      "Choose Blush Pink or Soft White. Both use 100% polyester microfiber. Availability will be confirmed when the store opens.",
  },
  {
    question: "Do you deliver across Pakistan?",
    answer:
      "Yes! We deliver nationwide across Pakistan within 3 to 5 working days using trusted logistics partners. Free shipping is available on orders over PKR 3,000.",
  },
  {
    question: "What is your returns policy?",
    answer:
      "We offer a hassle-free 7-day exchange policy for unopened items in original packaging. Please contact Glam Skincare on WhatsApp (+92 322 4729343) for instant assistance.",
  },
];
export const steps = [
  {
    title: "Saturate",
    text: "A little warm water. Soak your pad until it is fully wet.",
    icon: "water",
  },
  {
    title: "Sweep",
    text: "Gently sweep over your face in soft, circular motions.",
    icon: "sweep",
  },
  {
    title: "Refresh",
    text: "For heavier eye makeup, hold briefly before wiping.",
    icon: "refresh",
  },
  {
    title: "Wash",
    text: "Rinse, wash, and hang to dry. Ready for your next ritual.",
    icon: "wash",
  },
];

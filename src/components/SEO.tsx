import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { business } from "../config/business";
import { getProduct } from "../data/catalog";
export function SEO() {
  const { pathname } = useLocation();
  useEffect(() => {
    const p = pathname.startsWith("/product/")
      ? getProduct(pathname.split("/").at(-1) || "")
      : undefined;
    const titles: Record<string, string> = {
      "/": "Glow. Care. Confidence.",
      "/shop": "The collection",
      "/how-it-works": "Your softer ritual",
      "/about": "Our story",
      "/faq": "Your questions, answered",
      "/contact": "Let’s talk",
      "/cart": "Your bag",
      "/checkout": "Checkout preview",
      "/login": "Sign in",
      "/register": "Create an account",
      "/account": "Your account",
      "/account/orders": "Your order previews",
      "/shipping": "Shipping & returns",
      "/privacy": "Privacy information",
      "/terms": "Store terms",
    };
    const title = `${p?.name || titles[pathname] || "A little space for you"} | Glam Skincare`;
    const description =
      p?.description ||
      "Thoughtfully simple essentials for a softer everyday. Discover Glam Skincare and the Bye-Bye Makeup reusable microfiber pad.";
    document.title = title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", title);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", description);
    document
      .querySelector('meta[property="og:image"]')
      ?.setAttribute(
        "content",
        `${business.siteUrl}${p?.images[0] || "/images/glam-packaging.jpeg"}`,
      );
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content =
      business.preview ||
      /account|checkout|cart|login|register|order-success/.test(pathname)
        ? "noindex,nofollow"
        : "index,follow";
    document.head.append(robots);
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    if (business.siteUrl) {
      canonical.href = `${business.siteUrl}${pathname}`;
      document.head.append(canonical);
    }
    const structured = document.createElement("script");
    structured.type = "application/ld+json";
    structured.textContent = JSON.stringify(
      p
        ? {
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: p.description,
            image: p.images.map((i) => `${business.siteUrl}${i}`),
            brand: { "@type": "Brand", name: business.name },
            material: p.material,
          }
        : {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: business.name,
            ...(business.siteUrl ? { url: business.siteUrl } : {}),
            sameAs: [`https://www.instagram.com/${business.instagram}/`],
          },
    );
    document.head.append(structured);
    return () => {
      robots.remove();
      canonical.remove();
      structured.remove();
    };
  }, [pathname]);
  return null;
}

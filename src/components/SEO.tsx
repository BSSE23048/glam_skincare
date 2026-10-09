import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { business } from "../config/business";
import { useCatalog } from "../contexts/SiteContext";

export function SEO() {
  const { pathname } = useLocation();
  const { getProduct } = useCatalog();

  useEffect(() => {
    const slug = pathname.startsWith("/product/") ? pathname.split("/").at(-1) || "" : "";
    const product = slug ? getProduct(slug) : undefined;

    const titles: Record<string, string> = {
      "/": "Glam Skincare — Reusable Microfiber Makeup Remover Pad in Pakistan",
      "/shop": "The Glam Collection — Reusable Microfiber Skincare Essentials | Pakistan",
      "/how-it-works": "How It Works — The Bye-Bye Makeup Pad Ritual | Glam Skincare",
      "/about": "Our Story — Glow. Care. Confidence. | Glam Skincare Pakistan",
      "/faq": "Frequently Asked Questions — Chemical-Free Makeup Removal | Glam Skincare",
      "/contact": "Contact Us — WhatsApp Support | Glam Skincare Pakistan",
      "/cart": "Your Shopping Bag | Glam Skincare",
      "/checkout": "Secure Checkout | Glam Skincare",
      "/login": "Sign In | Glam Skincare Account",
      "/register": "Create an Account | Glam Skincare",
      "/account": "Customer Dashboard | Glam Skincare",
      "/account/orders": "Order History | Glam Skincare",
      "/admin": "Store Administration | Glam Skincare",
      "/shipping": "Shipping & Delivery Policy | Glam Skincare Pakistan",
      "/privacy": "Privacy Policy | Glam Skincare",
      "/terms": "Terms of Service | Glam Skincare",
    };

    const descriptions: Record<string, string> = {
      "/": "Discover Glam Skincare's Bye-Bye Makeup reusable microfiber pad. Effortless, chemical-free makeup removal with just warm water. Designed for gentle daily care in Pakistan.",
      "/shop": "Explore our collection of premium reusable face cleansing pads and makeup removal essentials. Sustainable, washable, and gentle on sensitive skin.",
      "/how-it-works": "Learn how to use your reusable microfiber makeup remover pad with warm water for effortless, waterproof makeup removal and simple daily care.",
      "/about": "Glam Skincare brings simple, effective skincare essentials to Pakistan. Made for a softer, more sustainable evening ritual.",
      "/faq": "Got questions about washable makeup remover pads, care instructions, or delivery in Pakistan? Find all answers here.",
      "/contact": "Get in touch with Glam Skincare directly on WhatsApp at +92 322 4729343 for order status, care tips, or customer support.",
    };

    const pageTitle = product
      ? `${product.name} — Reusable Microfiber Makeup Remover Pad | Glam Skincare Pakistan`
      : titles[pathname] || "Glam Skincare — Glow. Care. Confidence.";

    const pageDescription = product
      ? `${product.description} Available in ${product.variants.map((v) => v.name).join(" and ")}. Washable, reusable, and chemical-free makeup removal in Pakistan.`
      : descriptions[pathname] ||
        "Glam Skincare delivers premium reusable microfiber makeup remover pads and simple skincare essentials across Pakistan. Just add warm water.";

    const origin = business.siteUrl || window.location.origin;
    const currentUrl = `${origin}${pathname}`;
    const defaultImage = `${origin}/images/pink-ritual.jpeg`;
    const pageImage = product ? `${origin}${product.images[0]}` : defaultImage;

    // Document title
    document.title = pageTitle;

    // Meta description
    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", pageDescription);

    // Robots meta tag
    const isPrivate = /admin|account|checkout|cart|login|register|order-success/.test(pathname);
    let metaRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.name = "robots";
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute("content", isPrivate ? "noindex, nofollow" : "index, follow, max-image-preview:large");

    // Canonical link
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", currentUrl);

    // OpenGraph meta tags
    const setOgMeta = (property: string, content: string) => {
      let ogTag = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (!ogTag) {
        ogTag = document.createElement("meta");
        ogTag.setAttribute("property", property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute("content", content);
    };

    setOgMeta("og:site_name", business.name);
    setOgMeta("og:title", pageTitle);
    setOgMeta("og:description", pageDescription);
    setOgMeta("og:url", currentUrl);
    setOgMeta("og:image", pageImage);
    setOgMeta("og:type", product ? "product" : "website");
    setOgMeta("og:locale", business.locale);

    // Twitter card meta tags
    const setTwitterMeta = (name: string, content: string) => {
      let twitterTag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!twitterTag) {
        twitterTag = document.createElement("meta");
        twitterTag.setAttribute("name", name);
        document.head.appendChild(twitterTag);
      }
      twitterTag.setAttribute("content", content);
    };

    setTwitterMeta("twitter:card", "summary_large_image");
    setTwitterMeta("twitter:title", pageTitle);
    setTwitterMeta("twitter:description", pageDescription);
    setTwitterMeta("twitter:image", pageImage);

    // Structured Data (JSON-LD)
    const existingScripts = document.querySelectorAll('script[data-seo="jsonld"]');
    existingScripts.forEach((s) => s.remove());

    const schemas: object[] = [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: business.name,
        url: origin,
        logo: `${origin}/images/glam-packaging.jpeg`,
        sameAs: [`https://www.instagram.com/${business.instagram}/`],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: business.whatsappFormatted,
          contactType: "customer service",
          areaServed: "PK",
          availableLanguage: ["English", "Urdu"],
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: business.name,
        url: origin,
        potentialAction: {
          "@type": "SearchAction",
          target: `${origin}/shop?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ];

    if (product) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.images.map((img) => `${origin}${img}`),
        brand: { "@type": "Brand", name: business.name },
        material: product.material,
        sku: product.variants[0]?.sku || product.id,
        offers: {
          "@type": "Offer",
          url: currentUrl,
          priceCurrency: business.currency,
          price: product.price,
          itemCondition: "https://schema.org/NewCondition",
          availability: product.variants.some((v) => v.stock > 0)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: business.name,
          },
        },
      });
    }

    if (pathname === "/faq" || pathname === "/how-it-works") {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Do I really only need water to remove makeup?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes! Saturate the microfiber pad with warm water, hold briefly over your skin or eyes, and sweep gently in circular motions. The ultra-fine fibers lift makeup, oil, and impurities without harsh chemicals.",
            },
          },
          {
            "@type": "Question",
            name: "How do I wash and care for my Glam Skincare pad?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Rinse with facial cleanser or soap immediately after use. Machine wash cold on gentle cycle, avoid bleach or fabric softener, and hang to dry completely.",
            },
          },
          {
            "@type": "Question",
            name: "Does Glam Skincare deliver across Pakistan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, we ship to all major cities and towns in Pakistan via reliable local courier services. Standard delivery takes 3 to 5 working days with Cash on Delivery and online payment options.",
            },
          },
        ],
      });
    }

    // Append JSON-LD script tags
    schemas.forEach((schemaObj) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo", "jsonld");
      script.textContent = JSON.stringify(schemaObj);
      document.head.appendChild(script);
    });

    return () => {
      const addedScripts = document.querySelectorAll('script[data-seo="jsonld"]');
      addedScripts.forEach((s) => s.remove());
    };
  }, [pathname]);

  return null;
}

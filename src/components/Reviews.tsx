import { Star, BadgeCheck } from "lucide-react";
import type { Review } from "../types";
import { Eyebrow } from "./ui";

/** Only approved, published reviews belong in this input. Empty is the honest default. */
export function Reviews({ reviews }: { reviews: Review[] }) {
  if (!reviews.length)
    return (
      <section id="reviews" className="container reviews-preview section">
        <Eyebrow>REAL SKIN. HONEST STORIES.</Eyebrow>
        <h2>
          Be part of <em>the beginning.</em>
        </h2>
        <p>
          No customer reviews yet. After launch, customers will be able to share
          their experience. Verified purchases will be clearly identified.
        </p>
        <span className="quiet-badge">
          <BadgeCheck size={15} />
          No made-up stars. Just real experiences.
        </span>
      </section>
    );
  const average =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return (
    <section id="reviews" className="container section">
      <Eyebrow>REAL SKIN. HONEST STORIES.</Eyebrow>
      <h2>
        Your everyday <em>experiences.</em>
      </h2>
      <p className="review-average">
        <Star size={18} />
        {average.toFixed(1)} out of 5 · {reviews.length}{" "}
        {reviews.length === 1 ? "review" : "reviews"}
      </p>
      <div className="review-grid">
        {reviews.map((review) => (
          <article className="customer-review" key={review.id}>
            <div
              aria-label={`${review.rating} out of 5 stars`}
              className="rating-stars"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={15}
                  fill={i < review.rating ? "currentColor" : "none"}
                />
              ))}
            </div>
            <p>{review.body}</p>
            <strong>{review.author}</strong>
            {review.verifiedPurchase && (
              <span className="verified-review">
                <BadgeCheck size={14} />
                Verified purchase
              </span>
            )}
            <time dateTime={review.publishedAt}>
              {new Date(review.publishedAt).toLocaleDateString("en-PK")}
            </time>
          </article>
        ))}
      </div>
    </section>
  );
}

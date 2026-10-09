import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Instagram,
  Leaf,
  MessageCircle,
  Heart,
} from "lucide-react";
import {
  Accordion,
  Empty,
  Eyebrow,
  PageHeading,
  Reveal,
  RitualSteps,
  WhatsAppLink,
} from "../components/ui";
import { faqs } from "../data/catalog";
import { business } from "../config/business";
export function Ritual() {
  return (
    <>
      <section className="container page-space">
        <PageHeading
          eyebrow="A FEW MINUTES. ALL YOURS."
          title="The art of taking it off."
        >
          No long routine. No complicated steps. Just a little warm water and a
          softer end to your day.
        </PageHeading>
        <div className="ritual-hero">
          <img
            src="/images/white-ritual.jpeg"
            alt="White makeup-removal pad ready for a cleansing routine"
          />
          <div>
            <Eyebrow>MAKE A MOMENT OF IT</Eyebrow>
            <h2>
              Take a breath.
              <br />
              <em>Take the day off.</em>
            </h2>
            <p>
              Your Glam pad pairs with warm water to help lift makeup away. Use
              gentle movements and let the soft microfiber do its work.
            </p>
            <Link className="button" to="/product/bye-bye-makeup">
              Meet your new ritual
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
        <RitualSteps />
        <div className="care-callout">
          <Heart size={30} strokeWidth={1} />
          <div>
            <h2>A little care goes both ways.</h2>
            <p>
              Rinse with soap after use. Machine wash cold. Skip fabric softener
              and bleach. Hang to dry completely before storing.
            </p>
            <p className="fine-print">
              Made from 100% polyester microfiber. Follow the care instructions
              on your packaging.
            </p>
          </div>
        </div>
      </section>
      <section className="container section faq-preview">
        <div>
          <Eyebrow>RITUAL NOTES</Eyebrow>
          <h2>
            Keep it <em>gentle.</em>
          </h2>
          <p>
            Everyone’s routine is different. Avoid scrubbing, and stop use if
            irritation occurs.
          </p>
        </div>
        <Accordion items={faqs.slice(0, 3)} />
      </section>
    </>
  );
}
export function About() {
  return (
    <>
      <section className="container page-space">
        <PageHeading
          eyebrow="GLOW. CARE. CONFIDENCE."
          title="A little less. A little lovelier."
        >
          Everyday care, thoughtfully simplified.
        </PageHeading>
        <div className="about-layout">
          <img
            src="/images/glam-packaging.jpeg"
            alt="Glam Skincare Bye-Bye Makeup packaging"
          />
          <Reveal>
            <Eyebrow>HELLO, WE’RE GLAM SKINCARE</Eyebrow>
            <h2>
              Care that fits
              <br />
              <em>into real life.</em>
            </h2>
            <p>
              There’s something lovely about a routine that asks for less. Less
              time at the sink. Fewer things to reach for. A moment to come back
              to yourself.
            </p>
            <p>
              That’s where our collection begins: with Bye-Bye Makeup, a soft,
              reusable microfiber pad and a beautifully simple ritual.
            </p>
            <p>
              Glam Skincare is about making those small moments feel good.
              Thoughtful essentials. Honest details. Care you can make your own.
            </p>
            <Link to="/shop" className="text-link">
              Find your everyday essential
              <ArrowUpRight size={17} />
            </Link>
          </Reveal>
        </div>
        <div className="values-grid">
          {[
            [
              Heart,
              "Care, without complication.",
              "Everyday essentials that make room for a gentler routine.",
            ],
            [
              Leaf,
              "A more thoughtful choice.",
              "Wash, dry, and reuse. A simple alternative to single-use makeup wipes.",
            ],
            [
              MessageCircle,
              "An honest conversation.",
              "Clear information, real product photographs, and a team you can reach.",
            ],
          ].map(([Icon, title, text]) => {
            const I = Icon as typeof Heart;
            return (
              <div key={String(title)}>
                <I size={28} strokeWidth={1} />
                <h3>{String(title)}</h3>
                <p>{String(text)}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
export function FAQ() {
  const [query, setQuery] = useState("");
  const items = faqs.filter((f) =>
    `${f.question} ${f.answer}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="container narrow page-space">
      <PageHeading eyebrow="A LITTLE CLARITY" title="Glad you asked.">
        From your first sweep to your next wash. Here’s what you need to know.
      </PageHeading>
      <input
        className="faq-search"
        aria-label="Search frequently asked questions"
        placeholder="What would you like to know?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {items.length ? (
        <Accordion items={items} />
      ) : (
        <p role="status">
          No answers match that search. Try “wash”, “water” or “delivery”.
        </p>
      )}
      <div className="contact-callout">
        <h2>Still on your mind?</h2>
        <p>We’re a message away.</p>
        <WhatsAppLink />
      </div>
    </section>
  );
}
export function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section className="container page-space">
      <PageHeading eyebrow="LET’S TALK" title="A little help. A human touch.">
        A product question, a care tip, or just a hello. We’d love to hear from
        you.
      </PageHeading>
      <div className="contact-layout">
        <div className="contact-info">
          <MessageCircle size={32} strokeWidth={1} />
          <h2>
            Good conversations
            <br />
            start with <em>hello.</em>
          </h2>
          <p>
            For product and order questions, reach Glam Skincare directly on
            WhatsApp.
          </p>
          <WhatsAppLink />
          <div className="social-contact">
            <Instagram size={23} />
            <h3>Find your softer scroll.</h3>
            <a
              className="text-link"
              href={`https://www.instagram.com/${business.instagram}/`}
              target="_blank"
              rel="noreferrer"
            >
              @{business.instagram}
              <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
        <form
          className="contact-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <h2>Leave a little note.</h2>
          <p>
            The message form opens at launch. For now, WhatsApp is the best way
            to reach us.
          </p>
          <label className="field">
            Your name
            <input name="name" required autoComplete="name" />
          </label>
          <label className="field">
            Email address
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="field">
            What’s on your mind?
            <select name="topic">
              <option>Product question</option>
              <option>Order help</option>
              <option>Care instructions</option>
              <option>Something else</option>
            </select>
          </label>
          <label className="field">
            Your message
            <textarea name="message" required rows={5} maxLength={2000} />
          </label>
          <button className="button" type="submit">
            Send Message
            <ArrowRight size={17} />
          </button>
          {sent && (
            <p role="status" className="form-success">
              Thank you for contacting Glam Skincare! Your message has been received. We will respond promptly.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

export function Policy() {
  const { pathname } = useLocation();
  const content =
    pathname === "/privacy"
      ? {
          title: "Your privacy matters.",
          eyebrow: "PRIVACY POLICY · GLAM SKINCARE",
          paragraphs: [
            "At Glam Skincare, we are committed to protecting your personal privacy. We collect customer contact and delivery details strictly to process and deliver your skincare orders, verify payments, and provide customer support in Pakistan.",
            "All authentication credentials, passwords, and user account records are protected using 256-bit SSL encryption and secure cloud infrastructure. We never sell, rent, or trade your personal data to third parties.",
            "If you have any questions regarding your account data or privacy rights, please contact our support team on WhatsApp (+92 322 4729343) or via email at glamskincarepk@gmail.com.",
          ],
        }
      : pathname === "/terms"
        ? {
            title: "Store terms & conditions.",
            eyebrow: "TERMS OF SERVICE · GLAM SKINCARE",
            paragraphs: [
              "Welcome to Glam Skincare. By placing an order on our e-commerce platform, you agree to these terms of service. All prices are listed in Pakistani Rupees (PKR) and include applicable taxes.",
              "We support Cash on Delivery (COD) and Manual Online Payments (Bank Transfer, Easypaisa, JazzCash). Orders placed via Manual Online Payment require sending a payment screenshot to our WhatsApp support team for verification prior to order confirmation.",
              "Order fulfillment is subject to stock availability. In the rare event of a stock adjustment, our customer service team will contact you directly to offer an alternative or immediate refund.",
            ],
          }
        : {
            title: "Care, all the way to your door.",
            eyebrow: "SHIPPING & RETURNS · GLAM SKINCARE",
            paragraphs: [
              "We deliver nationwide across Pakistan within 3 to 5 working days using trusted logistics partners (TCS, Trax, and Leopards Courier).",
              "Standard shipping fee is PKR 200 per order. Enjoy complimentary free delivery on all orders over PKR 3,000.",
              "We offer a 7-day exchange policy for unused, unopened products in their original packaging. If you receive a damaged or incorrect item, please reach out to us on WhatsApp (+92 322 4729343) within 48 hours for an instant replacement.",
            ],
          };
  return (
    <section className="container narrow page-space">
      <PageHeading eyebrow={content.eyebrow} title={content.title} />
      <div className="policy-copy">
        {content.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <WhatsAppLink />
    </section>
  );
}
export function NotFound() {
  return (
    <section className="container page-space">
      <Eyebrow>404 · A LITTLE DETOUR</Eyebrow>
      <h1>Page not found.</h1>
      <Empty
        title="Let’s find your glow again."
        text="This page seems to have slipped away. Your next favourite is still right here."
        action="Back to the essentials"
      />
    </section>
  );
}

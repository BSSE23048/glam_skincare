import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Droplets,
  Leaf,
  RefreshCw,
  Heart,
  Sparkles,
  Instagram,
} from "lucide-react";
import {
  Accordion,
  Eyebrow,
  Reveal,
  RitualSteps,
  ProductCard,
} from "../components/ui";
import { faqs, products } from "../data/catalog";
import { business } from "../config/business";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <Reveal>
            <Eyebrow>LESS EFFORT. MORE YOU.</Eyebrow>
            <h1>
              Goodbye makeup.
              <br />
              Hello, <em>soft skin.</em>
            </h1>
            <p>
              A little warm water. One beautifully soft pad.
              <br className="desktop-break" /> Meet the everyday essential that
              makes taking
              <br className="desktop-break" /> it all off feel like a little act
              of self-care.
            </p>
            <div className="hero-actions">
              <Link className="button" to="/product/bye-bye-makeup">
                Meet Bye-Bye Makeup
                <ArrowUpRight size={18} />
              </Link>
              <Link className="text-link" to="/how-it-works">
                Discover the ritual
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-note">
              <span className="mini-swatch">
                <img src="/images/white-pad.jpeg" alt="" />
              </span>
              <span>
                Just water. Just gentle.
                <br />
                <strong>Your new evening ritual.</strong>
              </span>
            </div>
          </Reveal>
          <span className="hero-bottom-note">GLOW. CARE. CONFIDENCE.</span>
        </div>
        <div className="hero-image">
          <img
            src="/images/pink-ritual.jpeg"
            alt="Glam’s pink microfiber makeup-removal pad on a sunlit cream vanity with flowers"
            fetchPriority="high"
          />
          <span className="hero-stamp">
            a softer
            <br />
            <em>kind of clean</em>
            <Sparkles size={18} />
          </span>
          <div className="image-caption">
            <span>YOUR SKIN’S NEW BEST FRIEND</span>
            <span>01 / THE ESSENTIAL</span>
          </div>
        </div>
      </section>
      <section className="benefit-strip" aria-label="Product benefits">
        {[
          [RefreshCw, "Made to reuse"],
          [Heart, "A gentle touch"],
          [Droplets, "Just add water"],
          [Sparkles, "Easy to wash"],
          [Leaf, "Less single-use waste"],
        ].map(([Icon, label]) => {
          const I = Icon as typeof Heart;
          return (
            <div key={String(label)}>
              <I size={19} strokeWidth={1.4} />
              <span>{String(label)}</span>
            </div>
          );
        })}
      </section>
      <section className="container section featured">
        <Reveal className="featured-intro">
          <Eyebrow>SMALL ESSENTIAL. LOVELY DIFFERENCE.</Eyebrow>
          <h2>
            Meet your skin’s
            <br />
            new <em>best friend.</em>
          </h2>
          <p>
            For the full-glam days. The barely-there days. And every evening in
            between.
          </p>
          <p>
            Our reusable microfiber pad brings a softer, simpler step to your
            routine. No complicated ritual. Just a little water and a moment for
            yourself.
          </p>
          <Link className="text-link" to="/shop">
            Explore the collection
            <ArrowUpRight size={17} />
          </Link>
          <div className="intro-note">
            <Leaf size={25} strokeWidth={1} />
            <span>
              A little less disposable.
              <br />A little more intentional.
            </span>
          </div>
        </Reveal>
        <Reveal className="featured-card">
          <ProductCard product={products[0]} />
          <p className="fine-print">
            Two soft shades. One simple ritual. Prices shown are a preview.
          </p>
        </Reveal>
      </section>
      <section className="ritual-section section">
        <div className="container">
          <div className="section-heading">
            <div>
              <Eyebrow>YOUR WIND-DOWN, REIMAGINED</Eyebrow>
              <h2>
                Four little steps.
                <br />
                <em>One fresh feeling.</em>
              </h2>
            </div>
            <Link to="/how-it-works" className="text-link">
              Get to know the ritual
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <RitualSteps />
        </div>
      </section>
      <section className="editorial">
        <div className="editorial-image">
          <img
            src="/images/white-ritual.jpeg"
            alt="Soft white Clean Sponge pad beside towels and greenery"
            loading="lazy"
          />
          <span>LESS, BUT LOVELIER.</span>
        </div>
        <Reveal className="editorial-copy">
          <Eyebrow>SOFT ON SKIN. SIMPLE BY DESIGN.</Eyebrow>
          <h2>
            Your evening.
            <br />A little <em>lighter.</em>
          </h2>
          <p>
            Wash the day away, without adding more to it. Plush microfiber, warm
            water, and a few gentle sweeps. A simple moment that belongs to you.
          </p>
          <div className="editorial-details">
            <div>
              <span>01</span>
              <p>
                <strong>The softer touch</strong>Soft microfiber meets a gentle,
                unhurried routine.
              </p>
            </div>
            <div>
              <span>02</span>
              <p>
                <strong>Water is all you add</strong>No additional makeup
                remover needed for the pad’s routine.
              </p>
            </div>
            <div>
              <span>03</span>
              <p>
                <strong>Ready to go again</strong>Care for it, let it dry, and
                make it part of your everyday.
              </p>
            </div>
          </div>
          <Link to="/product/bye-bye-makeup" className="text-link">
            Make room for a little care
            <ArrowUpRight size={17} />
          </Link>
        </Reveal>
      </section>
      <section className="container section sustainability">
        <Reveal>
          <Leaf size={32} strokeWidth={1} />
          <Eyebrow>A SMALL SWITCH. A THOUGHTFUL START.</Eyebrow>
          <h2>
            Keep the ritual.
            <br />
            <em>Rethink the throwaway.</em>
          </h2>
          <p>
            Reach for something you can wash and use again. Swapping disposable
            makeup wipes for a reusable pad is a simple place to begin. No big
            promises. Just a more considered everyday choice.
          </p>
          <Link to="/about" className="text-link">
            The thought behind Glam
            <ArrowUpRight size={17} />
          </Link>
        </Reveal>
      </section>
      <section className="demonstration container">
        <div>
          <Eyebrow>LET’S TAKE THE DAY OFF</Eyebrow>
          <h2>
            See the texture.
            <br />
            <em>Love the simplicity.</em>
          </h2>
          <p>
            A closer look at the real thing. Soft fibers, a familiar shape, and
            a place in your evening routine.
          </p>
          <Link to="/how-it-works" className="button secondary">
            Your step-by-step guide
            <ArrowRight size={17} />
          </Link>
        </div>
        <Link to="/product/bye-bye-makeup" className="demo-photo">
          <img
            src="/images/pink-pad.jpeg"
            alt="Close-up of pink microfiber texture and black edge"
            loading="lazy"
          />
          <span>
            THE DETAILS MAKE THE DIFFERENCE
            <ArrowUpRight size={19} />
          </span>
        </Link>
      </section>
      <section className="container section reviews-preview">
        <Eyebrow>REAL ROUTINES. REAL VOICES.</Eyebrow>
        <h2>
          Your story <em>belongs here.</em>
        </h2>
        <p>
          Good things start with an honest conversation. Customer reviews will
          appear here after launch, with verified purchases clearly marked.
        </p>
        <span className="quiet-badge">A new ritual. A new community.</span>
      </section>
      <section className="faq-preview container section">
        <div>
          <Eyebrow>A LITTLE CLARITY</Eyebrow>
          <h2>
            Glad you <em>asked.</em>
          </h2>
          <p>
            Everything you’d like to know before making it part of your routine.
          </p>
          <Link className="text-link" to="/faq">
            All your questions, answered
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <Accordion items={faqs.slice(0, 4)} />
      </section>
      <section className="social-section container section">
        <div className="section-heading">
          <div>
            <Eyebrow>THE EVERYDAY, WITH A LITTLE GLAM</Eyebrow>
            <h2>
              A softer corner <em>of your feed.</em>
            </h2>
          </div>
          <a
            className="text-link"
            href={`https://www.instagram.com/${business.instagram}/`}
            target="_blank"
            rel="noreferrer"
          >
            <Instagram size={18} />@{business.instagram}
            <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="social-grid">
          {[
            ["glam-packaging", "Glam Bye-Bye Makeup in its branded pouch"],
            ["pink-ritual", "Blush pink makeup pad in warm sunlight"],
            ["white-ritual", "White microfiber pad with a vase of greenery"],
            ["pink-pad", "The pink pad and its soft microfiber texture"],
          ].map(([name, alt]) => (
            <a
              key={name}
              href={`https://www.instagram.com/${business.instagram}/`}
              target="_blank"
              rel="noreferrer"
            >
              <img src={`/images/${name}.jpeg`} alt={alt} loading="lazy" />
              <Instagram size={21} />
            </a>
          ))}
        </div>
        <p className="fine-print">
          A look at our essentials. Follow along on Instagram.
        </p>
      </section>
    </>
  );
}

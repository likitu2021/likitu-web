import { useState } from "react";

import "./assets/styles/site.css";

import { isSupabaseConfigured, supabase } from "./lib/supabase";
import likituLogo from "./assets/likitu-logo.svg";
import atelierLoop from "./assets/media/atelier-loop.mp4";
import heroImage from "./assets/media/editorial-hero.jpg";
import portraitImage from "./assets/media/editorial-portrait.jpg";
import founderImage from "./assets/media/founder-liyema.jpg";
import bagMarigold from "./assets/media/bag-marigold-front.jpg";
import bagSculpted from "./assets/media/bag-sculpted-noir.jpg";
import bagNude from "./assets/media/bag-sculpted-nude.jpg";
import topOcean from "./assets/media/top-ocean.jpg";
import skirtSpectrum from "./assets/media/skirt-spectrum.jpg";

const services = [
  ["Custom Crochet Garments", "Made-to-measure crochet pieces shaped around your measurements, brief, and occasion."],
  ["Crochet Fashion Pieces", "Signature handcrafted tops, skirts, bags, and styling pieces for everyday elegance."],
  ["Makeup Services", "Soft, polished makeup looks designed to enhance your natural features."],
  ["Event Makeup", "Refined beauty preparation for weddings, celebrations, graduations, and formal moments."],
  ["Photoshoot Makeup", "Camera-ready beauty for editorial shoots, campaigns, portraits, and creative projects."],
  ["Consultation Appointments", "Personal guidance for custom orders, styling direction, sizing, and beauty bookings."],
];

const collections = [
  { title: "Marigold Carryall", type: "Crochet bag", image: bagMarigold },
  { title: "Sculpted Noir", type: "Statement shoulder bag", image: bagSculpted },
  { title: "Nude Atelier", type: "Soft neutral accessory", image: bagNude },
  { title: "Ocean Wrap", type: "Handmade crochet top", image: topOcean },
  { title: "Spectrum Fringe", type: "Custom skirt piece", image: skirtSpectrum },
];

const processSteps = ["Consultation", "Design Discussion", "Creation", "Approval", "Delivery"];

const testimonials = [
  ["Every detail felt personal. The piece looked delicate, but it carried so much confidence.", "A custom garment client"],
  ["My makeup was soft, clean, and elevated. I still looked like myself, just beautifully finished.", "Event makeup booking"],
  ["The consultation made ordering feel calm and considered. I knew exactly what would happen next.", "Crochet inquiry client"],
];

function App() {
  const [formStatus, setFormStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const whatsappNumber = "27000000000";
  const whatsappText = encodeURIComponent(
    "Hello Likitu, I would like to submit an inquiry for a crochet or beauty consultation."
  );

  const handleInquirySubmit = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const references = data.getAll("reference").filter((file) => file?.name);
    const referenceNames = references.map((file) => file.name);
    const referenceText = referenceNames.length
      ? referenceNames.join(", ")
      : "I will share references in the chat";

    const inquiry = {
      full_name: data.get("fullName")?.toString().trim() || "",
      email: data.get("email")?.toString().trim() || "",
      whatsapp_number: data.get("phone")?.toString().trim() || "",
      inquiry_type: data.get("inquiryType")?.toString() || "",
      garment_or_service: data.get("garmentType")?.toString() || "",
      preferred_sizing: data.get("size")?.toString() || "",
      event_or_needed_by: data.get("neededBy")?.toString() || "",
      inspiration_references: referenceNames,
      design_description: data.get("details")?.toString().trim() || "",
    };

    const message = [
      "Hello Likitu, I would like to make an inquiry.",
      "",
      `Full name: ${inquiry.full_name || "-"}`,
      `Email: ${inquiry.email || "-"}`,
      `WhatsApp number: ${inquiry.whatsapp_number || "-"}`,
      `Inquiry type: ${inquiry.inquiry_type || "-"}`,
      `Garment or service: ${inquiry.garment_or_service || "-"}`,
      `Preferred sizing: ${inquiry.preferred_sizing || "-"}`,
      `Event or needed by: ${inquiry.event_or_needed_by || "-"}`,
      `Inspiration references: ${referenceText}`,
      "",
      "Design or booking details:",
      inquiry.design_description || "-",
    ].join("\n");

    if (!isSupabaseConfigured) {
      setFormStatus("Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }

    setIsSubmitting(true);
    setFormStatus("Sending your inquiry...");

    const { error } = await supabase.from("inquiries").insert([inquiry]);

    setIsSubmitting(false);

    if (error) {
      setFormStatus("Your inquiry could not be sent. Please check the database setup and try again.");
      return;
    }

    setFormStatus("Inquiry sent. Continue the conversation on WhatsApp.");
    form.reset();
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="site-shell">
      <header className="site-header" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Likitu home">
          <img src={likituLogo} alt="Likitu" />
        </a>
        <nav className="site-nav">
          <a href="#collections">Collections</a>
          <a href="#services">Services</a>
          <a href="#inquiry">Inquiry</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__media" aria-hidden="true">
            <img src={heroImage} alt="" />
          </div>
          <div className="hero__content reveal">
            <p className="eyebrow">Gqeberha atelier · Crochet & beauty consultation</p>
            <h1 id="hero-title">Crochet garments elegantly made to suit your unique style.</h1>
            <p>
              Handcrafted crochet fashion and beauty experiences designed with care and intention.
            </p>
            <div className="hero__actions">
              <a className="button button--dark" href="#collections">View Collection</a>
              <a className="button button--light" href="#inquiry">Book Consultation</a>
            </div>
          </div>
        </section>

        <section className="intro-strip" aria-label="Brand qualities">
          <span>Handcrafted</span>
          <span>Personally curated</span>
          <span>Beauty led</span>
          <span>Worldwide delivery</span>
        </section>

        <section className="about section-grid" id="about" aria-labelledby="about-title">
          <div className="section-kicker reveal">
            <span>About the founder</span>
          </div>
          <div className="about__copy reveal">
            <h2 id="about-title">Founded by Liyema Kabi in Gqeberha, South Africa.</h2>
            <p>
              Likitu Fashion & Beauty is a Black-owned crochet and beauty brand focused on
              creating handcrafted crochet garments and beauty experiences that help women and
              clients feel confident, beautiful, and seen.
            </p>
            <p>
              The business was inspired by the desire to create garments personally curated with
              love while continuing a passion for beauty and helping women feel confident and happy
              within themselves.
            </p>
          </div>
          <figure className="about__portrait reveal">
            <img src={founderImage} alt="Liyema Kabi, founder of Likitu Fashion & Beauty" />
            <figcaption>Liyema Kabi · Founder</figcaption>
          </figure>
        </section>

        <section className="services" id="services" aria-labelledby="services-title">
          <div className="section-heading reveal">
            <p className="eyebrow">Services</p>
            <h2 id="services-title">Consultation-led fashion and beauty work.</h2>
          </div>
          <div className="service-grid">
            {services.map(([title, text], index) => (
              <article className="service-card reveal" key={title} style={{ "--delay": `${index * 70}ms` }}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="collections" id="collections" aria-labelledby="collections-title">
          <div className="collections__head reveal">
            <p className="eyebrow">Featured collections</p>
            <h2 id="collections-title">Crochet pieces presented with atelier restraint.</h2>
          </div>
          <div className="collection-grid">
            {collections.map((item, index) => (
              <article className="collection-card reveal" key={item.title} data-featured={index === 0}>
                <img src={item.image} alt={`${item.title} by Likitu`} />
                <div>
                  <span>{item.type}</span>
                  <h3>{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="atelier-panel" aria-label="Atelier motion">
          <video src={atelierLoop} autoPlay muted loop playsInline />
          <div className="atelier-panel__copy reveal">
            <p className="eyebrow">Made slowly</p>
            <h2>Every request begins as a conversation.</h2>
          </div>
        </section>

        <section className="inquiry section-grid" id="inquiry" aria-labelledby="inquiry-title">
          <div className="section-kicker reveal">
            <span>Consultation & order inquiry</span>
          </div>
          <div className="inquiry__content reveal">
            <h2 id="inquiry-title">Share the garment, beauty service, or moment you are preparing for.</h2>
            <p>
              This is not a checkout. Submit your request, then continue the fitting, design, and
              booking conversation directly through WhatsApp.
            </p>
            <form className="inquiry-form" onSubmit={handleInquirySubmit}>
              <div className="form-grid">
                <label>
                  Full name
                  <input name="fullName" type="text" required />
                </label>
                <label>
                  Email address
                  <input name="email" type="email" required />
                </label>
                <label>
                  WhatsApp number
                  <input name="phone" type="tel" placeholder="+27XXXXXXXXX or 0XXXXXXXXX" pattern="(\+27|0)[0-9]{9}" required />
                </label>
                <label>
                  Inquiry type
                  <select name="inquiryType" required defaultValue="">
                    <option value="" disabled>Select one</option>
                    <option>Custom Crochet Garment</option>
                    <option>Makeup Service</option>
                  </select>
                </label>
                <label>
                  Garment or service
                  <select name="garmentType" required defaultValue="">
                    <option value="" disabled>Select one</option>
                    <option>Crochet skirt</option>
                    <option>Crochet top</option>
                    <option>Crochet dress</option>
                    <option>Crochet shorts</option>
                    <option>Crochet pants</option>
                    <option>Crochet two-piece set</option>
                    <option>Crochet beach cover-up</option>
                    <option>Crochet bikini or swim set</option>
                    <option>Crochet cardigan</option>
                    <option>Crochet bucket hat</option>
                    <option>Crochet headscarf</option>
                    <option>Crochet bag</option>
                    <option>Event makeup</option>
                    <option>Photoshoot makeup</option>
                    <option>Soft glam makeup</option>
                    <option>Bridal makeup</option>
                    <option>Other custom request</option>
                  </select>
                </label>
                <label>
                  Preferred sizing
                  <select name="size" required defaultValue="">
                    <option value="" disabled>Select one</option>
                    <option>XS</option>
                    <option>Small</option>
                    <option>Medium</option>
                    <option>Large</option>
                    <option>XL</option>
                    <option>Custom Measurements</option>
                    <option>Not Applicable</option>
                  </select>
                </label>
                <label>
                  Event or needed by
                  <input name="neededBy" type="date" />
                </label>
                <label className="form-grid__wide file-field">
                  Inspiration reference
                  <input name="reference" type="file" accept="image/*" />
                </label>
                <label className="form-grid__wide">
                  Describe your desired design or booking
                  <textarea name="details" rows="5" required />
                </label>
              </div>
              <button className="button button--dark" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending inquiry" : "Send inquiry"}</button>
              {formStatus && <p className="form-status" role="status">{formStatus}</p>}
            </form>
          </div>
        </section>

        <section className="process" id="process" aria-labelledby="process-title">
          <div className="section-heading reveal">
            <p className="eyebrow">Process</p>
            <h2 id="process-title">A clear path from first inquiry to final delivery.</h2>
          </div>
          <ol className="process-line">
            {processSteps.map((step, index) => (
              <li className="reveal" key={step} style={{ "--delay": `${index * 80}ms` }}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="testimonials" id="testimonials" aria-labelledby="testimonials-title">
          <div className="section-heading reveal">
            <p className="eyebrow">Client notes</p>
            <h2 id="testimonials-title">Quiet confidence, beautifully held.</h2>
          </div>
          <div className="testimonial-grid">
            {testimonials.map(([quote, person]) => (
              <figure className="testimonial reveal" key={quote}>
                <blockquote>{quote}</blockquote>
                <figcaption>{person}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="delivery section-grid" id="delivery" aria-labelledby="delivery-title">
          <div className="section-kicker reveal">
            <span>Worldwide delivery</span>
          </div>
          <div className="delivery__copy reveal">
            <h2 id="delivery-title">Handmade pieces prepared with care, wherever they are going.</h2>
            <p>
              Likitu offers worldwide delivery for handcrafted crochet pieces. Production timelines
              are discussed during consultation, with direct communication for measurements,
              approvals, packaging, and delivery details.
            </p>
          </div>
          <img src={portraitImage} alt="Editorial portrait wearing Likitu crochet styling" className="delivery__image reveal" />
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <div className="contact__inner reveal">
            <p className="eyebrow">Contact</p>
            <h2 id="contact-title">Begin with a calm, considered inquiry.</h2>
            <div className="contact-links">
              <a href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`} target="_blank" rel="noreferrer">WhatsApp</a>
              <a href="https://instagram.com/likitu" target="_blank" rel="noreferrer">Instagram</a>
              <a href="mailto:hello@likitu.com">Email inquiry</a>
              <a href="#inquiry">Booking request</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

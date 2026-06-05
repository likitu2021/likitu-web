import { useCallback, useEffect, useMemo, useState } from "react";

import "./assets/styles/site.css";

import { isSupabaseConfigured, supabase } from "./lib/supabase";
import likituLogo from "./assets/likitu-logo.svg";
import heroImage from "./assets/media/editorial-hero.jpg";
import portraitImage from "./assets/media/editorial-portrait.jpg";
import founderImage from "./assets/media/founder-liyema.jpg";
import bagMarigold from "./assets/media/bag-marigold-front.jpg";
import bagSculpted from "./assets/media/bag-sculpted-noir.jpg";
import bagPetit from "./assets/media/bag-petit-bucket.jpg";
import topOcean from "./assets/media/top-ocean.jpg";
import skirtSpectrum from "./assets/media/skirt-spectrum.jpg";

const services = [
  ["Crocheting", "Custom crochet garments and fashion pieces shaped around your sizing, colour direction, and occasion."],
  ["Makeup", "Soft, polished beauty services for events, photoshoots, bridal moments, and personal bookings."],
];

const heroSlides = [heroImage, portraitImage, founderImage];

const collections = [
  {
    id: "marigold-carryall",
    title: "Marigold Carryall",
    type: "Crochet bag",
    image: bagMarigold,
    description: "A sculptural handmade carryall with floral detail and soft structure.",
    variants: ["Marigold floral", "Plain marigold", "Side-carry silhouette"],
  },
  {
    id: "sculpted-shoulder-bag",
    title: "Sculpted Shoulder Bag",
    type: "Statement shoulder bag",
    image: bagSculpted,
    description: "One refined shoulder bag silhouette available in noir, nude, and vermilion colourways.",
    variants: ["Noir", "Nude", "Vermilion"],
  },
  {
    id: "petit-bucket",
    title: "Petit Bucket",
    type: "Compact crochet bag",
    image: bagPetit,
    description: "A compact bucket form for delicate everyday carrying.",
    variants: ["Neutral bucket"],
  },
  {
    id: "ribbon-wrap-top",
    title: "Ribbon Wrap Top",
    type: "Crochet top",
    image: topOcean,
    description: "A custom wrap top available in ocean, lime, and made-to-order colour directions.",
    variants: ["Ocean", "Lime", "Custom colour"],
  },
  {
    id: "spectrum-fringe",
    title: "Spectrum Fringe",
    type: "Custom skirt piece",
    image: skirtSpectrum,
    description: "A colourful fringe skirt designed for movement and occasion styling.",
    variants: ["Spectrum fringe"],
  },
];

function getProductById(productId) {
  return collections.find((item) => item.id === productId) || null;
}

const processSteps = ["Consultation", "Design Discussion", "Creation", "Approval", "Delivery"];

const testimonials = [
  ["Every detail felt personal. The piece looked delicate, but it carried so much confidence.", "A custom garment client"],
  ["My makeup was soft, clean, and elevated. I still looked like myself, just beautifully finished.", "Event makeup booking"],
  ["The consultation made ordering feel calm and considered. I knew exactly what would happen next.", "Crochet inquiry client"],
];

const adminTabs = ["Overview", "Inquiries", "Collections", "Makeup", "Content", "Settings"];

const initialAdminCollections = [
  { id: "marigold", title: "Marigold Carryall", price: "From R650", description: "Sculptural crochet bag with floral detail.", status: "Published" },
  { id: "ocean", title: "Ocean Wrap", price: "From R480", description: "Handmade wrap top for custom colourways.", status: "Draft" },
];

const initialContent = {
  aboutTitle: "Founded by Liyema Kabi in Gqeberha, South Africa.",
  aboutBody: "Likitu Fashion & Beauty creates handcrafted crochet garments and beauty experiences with care, confidence, and intention.",
  whatsapp: "+27000000000",
  instagram: "@likitu",
  email: "hello@likitu.com",
};

const emptyCollection = { title: "", price: "", description: "", status: "Draft" };

function formatDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(value));
}

function getInquiryCounts(inquiries) {
  return inquiries.reduce(
    (counts, inquiry) => {
      counts.total += 1;
      if (inquiry.inquiry_type === "Makeup Service") counts.makeup += 1;
      if (inquiry.inquiry_type === "Custom Crochet Garment") counts.custom += 1;
      return counts;
    },
    { total: 0, custom: 0, makeup: 0 }
  );
}

async function submitInquiryToSupabase(inquiry) {
  if (!isSupabaseConfigured) {
    return { error: { message: "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." } };
  }

  return supabase.from("inquiries").insert([inquiry]);
}

function AdminApp() {
  const [session, setSession] = useState(null);
  const [authStatus, setAuthStatus] = useState(isSupabaseConfigured ? "Checking secure access..." : "Supabase is not configured.");
  const [authError, setAuthError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [inquiries, setInquiries] = useState([]);
  const [dataStatus, setDataStatus] = useState("No inquiries loaded yet.");
  const [collectionsDraft, setCollectionsDraft] = useState(initialAdminCollections);
  const [newCollection, setNewCollection] = useState(emptyCollection);
  const [contentDraft, setContentDraft] = useState(initialContent);

  const counts = useMemo(() => getInquiryCounts(inquiries), [inquiries]);
  const recentInquiries = inquiries.slice(0, 5);
  const makeupBookings = inquiries.filter((inquiry) => inquiry.inquiry_type === "Makeup Service");

  const loadInquiries = useCallback(async () => {
    setDataStatus("Loading inquiries...");
    const { data, error } = await supabase
      .from("inquiries")
      .select("id, full_name, email, whatsapp_number, inquiry_type, garment_or_service, preferred_sizing, event_or_needed_by, inspiration_references, design_description, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setDataStatus(`Could not load inquiries: ${error.message}`);
      return;
    }

    setInquiries(data || []);
    setDataStatus(data?.length ? "Inquiries loaded." : "No inquiries yet.");
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthStatus(data.session ? "Signed in" : "Please sign in to continue.");
      if (data.session) loadInquiries();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthStatus(nextSession ? "Signed in" : "Please sign in to continue.");
      if (nextSession) loadInquiries();
    });

    return () => listener.subscription.unsubscribe();
  }, [loadInquiries]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError("");
    setIsSigningIn(true);

    const data = new FormData(event.currentTarget);
    const email = data.get("email")?.toString().trim() || "";
    const password = data.get("password")?.toString() || "";
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setIsSigningIn(false);
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setInquiries([]);
    setActiveTab("Overview");
  };

  const handleCollectionSubmit = (event) => {
    event.preventDefault();
    const collection = {
      ...newCollection,
      id: `${newCollection.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
    };
    setCollectionsDraft((current) => [collection, ...current]);
    setNewCollection(emptyCollection);
  };

  const updateCollection = (id, field, value) => {
    setCollectionsDraft((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const deleteCollection = (id) => {
    setCollectionsDraft((current) => current.filter((item) => item.id !== id));
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="admin-login-shell">
        <section className="admin-login-card">
          <p className="admin-kicker">Likitu Admin</p>
          <h1>Supabase needs to be configured first.</h1>
          <p>Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project `.env` file.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="admin-login-shell">
        <section className="admin-login-card">
          <p className="admin-kicker">Likitu Admin</p>
          <h1>Owner sign in</h1>
          <p>{authStatus}</p>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <label>
              Email address
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            <button className="admin-button admin-button--dark" type="submit" disabled={isSigningIn}>
              {isSigningIn ? "Signing in" : "Sign in"}
            </button>
            {authError && <p className="admin-error" role="alert">{authError}</p>}
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-logo" href="/admin" aria-label="Likitu admin home">
          <img src={likituLogo} alt="Likitu" />
        </a>
        <nav className="admin-nav" aria-label="Admin sections">
          {adminTabs.map((tab) => (
            <button className={activeTab === tab ? "is-active" : ""} type="button" key={tab} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </nav>
        <button className="admin-button" type="button" onClick={handleLogout}>Sign out</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-kicker">Dashboard</p>
            <h1>{activeTab}</h1>
          </div>
          <button className="admin-button" type="button" onClick={loadInquiries}>Refresh inquiries</button>
        </header>

        {activeTab === "Overview" && (
          <section className="admin-panel-stack">
            <div className="admin-stat-grid">
              <article><span>Total inquiries</span><strong>{counts.total}</strong></article>
              <article><span>Custom design requests</span><strong>{counts.custom}</strong></article>
              <article><span>Makeup bookings</span><strong>{counts.makeup}</strong></article>
              <article><span>Collections drafted</span><strong>{collectionsDraft.length}</strong></article>
            </div>
            <AdminInquiryList title="Recent inquiries" inquiries={recentInquiries} emptyText={dataStatus} />
          </section>
        )}

        {activeTab === "Inquiries" && <AdminInquiryList title="All submitted inquiries" inquiries={inquiries} emptyText={dataStatus} />}

        {activeTab === "Collections" && (
          <section className="admin-panel-stack">
            <AdminCollectionForm newCollection={newCollection} setNewCollection={setNewCollection} onSubmit={handleCollectionSubmit} />
            <div className="admin-card-list">
              {collectionsDraft.map((item) => (
                <article className="admin-edit-card" key={item.id}>
                  <input value={item.title} onChange={(event) => updateCollection(item.id, "title", event.target.value)} aria-label="Collection title" />
                  <input value={item.price} onChange={(event) => updateCollection(item.id, "price", event.target.value)} aria-label="Collection price" />
                  <textarea value={item.description} onChange={(event) => updateCollection(item.id, "description", event.target.value)} aria-label="Collection description" />
                  <select value={item.status} onChange={(event) => updateCollection(item.id, "status", event.target.value)} aria-label="Collection status">
                    <option>Draft</option>
                    <option>Published</option>
                  </select>
                  <button className="admin-button" type="button" onClick={() => deleteCollection(item.id)}>Delete</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Makeup" && <AdminInquiryList title="Makeup booking requests" inquiries={makeupBookings} emptyText="No makeup bookings yet." />}

        {activeTab === "Content" && (
          <section className="admin-form-panel">
            <label>
              About page heading
              <input value={contentDraft.aboutTitle} onChange={(event) => setContentDraft({ ...contentDraft, aboutTitle: event.target.value })} />
            </label>
            <label>
              About page story
              <textarea rows="5" value={contentDraft.aboutBody} onChange={(event) => setContentDraft({ ...contentDraft, aboutBody: event.target.value })} />
            </label>
            <label>
              Upload new photos
              <input type="file" accept="image/*" multiple />
            </label>
            <p className="admin-note">This screen is ready for content editing. Add a Supabase content table/storage bucket to persist these changes.</p>
          </section>
        )}

        {activeTab === "Settings" && (
          <section className="admin-form-panel">
            <label>
              WhatsApp number
              <input value={contentDraft.whatsapp} onChange={(event) => setContentDraft({ ...contentDraft, whatsapp: event.target.value })} />
            </label>
            <label>
              Instagram handle
              <input value={contentDraft.instagram} onChange={(event) => setContentDraft({ ...contentDraft, instagram: event.target.value })} />
            </label>
            <label>
              Email inquiry address
              <input type="email" value={contentDraft.email} onChange={(event) => setContentDraft({ ...contentDraft, email: event.target.value })} />
            </label>
            <p className="admin-note">Contact settings are editable here and can be connected to a `site_settings` table next.</p>
          </section>
        )}
      </main>
    </div>
  );
}

function AdminInquiryList({ title, inquiries, emptyText }) {
  return (
    <section className="admin-table-panel">
      <div className="admin-panel-head">
        <h2>{title}</h2>
        <span>{inquiries.length} records</span>
      </div>
      {inquiries.length === 0 ? (
        <p className="admin-note">{emptyText}</p>
      ) : (
        <div className="admin-inquiry-list">
          {inquiries.map((inquiry) => (
            <article className="admin-inquiry-card" key={inquiry.id}>
              <div>
                <h3>{inquiry.full_name}</h3>
                <p>{inquiry.inquiry_type} · {inquiry.garment_or_service}</p>
              </div>
              <dl>
                <div><dt>Email</dt><dd>{inquiry.email}</dd></div>
                <div><dt>WhatsApp</dt><dd>{inquiry.whatsapp_number}</dd></div>
                <div><dt>Size</dt><dd>{inquiry.preferred_sizing}</dd></div>
                <div><dt>Needed by</dt><dd>{formatDate(inquiry.event_or_needed_by)}</dd></div>
                <div><dt>Submitted</dt><dd>{formatDate(inquiry.created_at)}</dd></div>
              </dl>
              <p>{inquiry.design_description}</p>
              {inquiry.inspiration_references?.length > 0 && <span className="admin-tag">{inquiry.inspiration_references.join(", ")}</span>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function AdminCollectionForm({ newCollection, setNewCollection, onSubmit }) {
  return (
    <form className="admin-form-panel" onSubmit={onSubmit}>
      <div className="admin-panel-head">
        <h2>Add crochet collection</h2>
        <span>Draft CMS</span>
      </div>
      <label>
        Title
        <input value={newCollection.title} onChange={(event) => setNewCollection({ ...newCollection, title: event.target.value })} required />
      </label>
      <label>
        Price
        <input value={newCollection.price} onChange={(event) => setNewCollection({ ...newCollection, price: event.target.value })} placeholder="From R650" />
      </label>
      <label>
        Description
        <textarea rows="4" value={newCollection.description} onChange={(event) => setNewCollection({ ...newCollection, description: event.target.value })} required />
      </label>
      <label>
        Upload image
        <input type="file" accept="image/*" />
      </label>
      <button className="admin-button admin-button--dark" type="submit">Add collection</button>
    </form>
  );
}

function ProductInquiryPage({ product }) {
  const [formStatus, setFormStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!product) {
    return (
      <main className="product-page product-page--missing">
        <a className="product-back-link" href="/">Back to home</a>
        <h1>Product not found.</h1>
      </main>
    );
  }

  const handleProductInquiry = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const references = data.getAll("reference").filter((file) => file?.name);
    const referenceNames = references.map((file) => file.name);

    const inquiry = {
      full_name: data.get("fullName")?.toString().trim() || "",
      email: data.get("email")?.toString().trim() || "",
      whatsapp_number: data.get("phone")?.toString().trim() || "",
      inquiry_type: "Custom Crochet Garment",
      garment_or_service: product.title,
      preferred_sizing: data.get("size")?.toString() || "",
      event_or_needed_by: data.get("neededBy")?.toString() || "",
      inspiration_references: referenceNames,
      design_description: data.get("details")?.toString().trim() || `Product inquiry for ${product.title}`,
    };

    setIsSubmitting(true);
    setFormStatus("Sending your product inquiry...");
    const { error } = await submitInquiryToSupabase(inquiry);
    setIsSubmitting(false);

    if (error) {
      setFormStatus(`Could not send inquiry: ${error.message}`);
      return;
    }

    setFormStatus("Product inquiry sent. We will continue with you directly.");
    form.reset();
  };

  return (
    <main className="product-page">
      <a className="product-back-link" href="/">Back to home</a>
      <section className="product-detail">
        <figure>
          <img src={product.image} alt={`${product.title} by Likitu`} />
        </figure>
        <div className="product-detail__content">
          <p className="eyebrow">{product.type}</p>
          <h1>{product.title}</h1>
          <p>{product.description}</p>
          <form className="inquiry-form product-inquiry-form" onSubmit={handleProductInquiry}>
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
                Notes for this product
                <textarea name="details" rows="5" placeholder="Colour, fit, measurements, styling notes..." />
              </label>
            </div>
            <button className="button button--dark" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending inquiry" : "Inquire about this piece"}</button>
            {formStatus && <p className="form-status" role="status">{formStatus}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}

function PublicSite() {
  const [formStatus, setFormStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

    setIsSubmitting(true);
    setFormStatus("Sending your inquiry...");

    const { error } = await submitInquiryToSupabase(inquiry);

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
        <div className="mobile-brand-row">
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
          >
            <span />
            <span />
          </button>
          <a className="brand" href="#top" aria-label="Likitu home" onClick={() => setIsMobileMenuOpen(false)}>
            <img src={likituLogo} alt="Likitu" />
          </a>
        </div>
        <nav className="site-nav">
          <a href="#about">About</a>
          <a href="#collections">Collections</a>
          <a href="#inquiry">Inquire</a>
        </nav>
        <div className={`mobile-menu ${isMobileMenuOpen ? "is-open" : ""}`}>
          <a href="#about" onClick={() => setIsMobileMenuOpen(false)}>About</a>
          <a href="#collections" onClick={() => setIsMobileMenuOpen(false)}>Collections</a>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__media" aria-hidden="true">
            {heroSlides.map((slide, index) => (
              <img src={slide} alt="" className="hero__slide" key={slide} style={{ "--slide-index": index }} />
            ))}
          </div>
          <div className="hero__content reveal">
            <p className="eyebrow">Gqeberha · Crochet & beauty consultation</p>
            <h1 id="hero-title">Crochet garments elegantly made to suit your unique style.</h1>
            <p>
              Handcrafted crochet fashion and beauty experiences designed with care and intention.
            </p>
            <div className="hero__actions">
              <a className="button button--dark" href="#inquiry">Inquire</a>
              <a className="button button--light" href="#collections">View Collection</a>
            </div>
          </div>
        </section>

        <section className="intro-strip" aria-label="Brand qualities">
          <div className="intro-strip__track">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="intro-strip__group" aria-hidden={index > 0} key={index}>
                <span>Handcrafted</span>
                <span>Personally curated</span>
                <span>Beauty led</span>
                <span>Nationwide delivery</span>
              </div>
            ))}
          </div>
        </section>

        <section className="product-carousel" aria-labelledby="product-carousel-title">
          <div className="product-carousel__head reveal">
            <p className="eyebrow">Browse handmade pieces and inquire from the product page.</p>
            <h2 id="product-carousel-title">Selected pieces</h2>
          </div>
          <div className="product-carousel__rail" aria-label="Product carousel">
            {[...collections, ...collections].map((item, index) => (
              <a className="product-tile" href={`/products/${item.id}`} key={`${item.id}-${index}`}>
                <img src={item.image} alt={`${item.title} by Likitu`} />
                <span>{item.type}</span>
                <h3>{item.title}</h3>
                {item.variants?.length > 1 && <p>{item.variants.length} colourways</p>}
              </a>
            ))}
          </div>
        </section>

        <section className="about section-grid" id="about" aria-labelledby="about-title">
          <div className="section-kicker reveal">
            <span>Founded by Liyema Kabi in Gqeberha, South Africa.</span>
          </div>
          <div className="about__copy reveal">
            <h2 id="about-title">About the founder</h2>
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
            <p className="eyebrow">Consultation-led fashion and beauty work.</p>
            <h2 id="services-title">Services</h2>
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



        <section className="process" id="process" aria-labelledby="process-title">
          <div className="section-heading reveal">
            <p className="eyebrow">A clear path from first inquiry to final delivery.</p>
            <h2 id="process-title">Process</h2>
          </div>
          <ol className="process-line">
            {processSteps.map((step, index) => {
              const details = [
                "Share your garment or beauty request with contact details and references.",
                "Confirm the silhouette, colour direction, sizing, date, and service needs.",
                "Your crochet piece or beauty booking is prepared with direct communication.",
                "Review the final direction, fit notes, and any last adjustments before handover.",
                "Receive your piece or service details with nationwide delivery where needed.",
              ];

              return (
                <li className="reveal" key={step} style={{ "--delay": `${index * 80}ms` }}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step}</strong>
                  <p>{details[index]}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="testimonials" id="testimonials" aria-labelledby="testimonials-title">
          <div className="section-heading reveal">
            <p className="eyebrow">Quiet confidence, beautifully held.</p>
            <h2 id="testimonials-title">Testimonials</h2>
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
            <span>Nationwide delivery</span>
          </div>
          <div className="delivery__copy reveal">
            <h2 id="delivery-title">Handmade pieces prepared with care, wherever they are going.</h2>
            <p>
              Likitu offers nationwide delivery for handcrafted crochet pieces. Production timelines
              are discussed during consultation, with direct communication for measurements,
              approvals, packaging, and delivery details.
            </p>
          </div>
          <img src={portraitImage} alt="Editorial portrait wearing Likitu crochet styling" className="delivery__image reveal" />
        </section>

        <section className="collections" id="collections" aria-labelledby="collections-title">
          <div className="collections__head reveal">
            <p className="eyebrow">Crochet pieces presented with atelier restraint.</p>
            <h2 id="collections-title">Featured collections</h2>
          </div>
          <div className="collection-grid">
            {collections.map((item, index) => (
              <a className="collection-card reveal" href={`/products/${item.id}`} key={item.title} data-featured={index === 0}>
                <img src={item.image} alt={`${item.title} by Likitu`} />
                <div>
                  <span>{item.type}</span>
                  <h3>{item.title}</h3>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="inquiry section-grid" id="inquiry" aria-labelledby="inquiry-title">
          <div className="section-kicker reveal">
            <span className="eyebrow inquiry__subtitle">SHARE THE GARMENT, BEAUTY SERVICE, OR MOMENT YOU ARE PREPARING FOR.</span>
            <h2 id="inquiry-title">Inquiries</h2>
          </div>
          <div className="inquiry__content reveal">
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

        {/* Contact section removed per request */}

        <footer className="site-footer">
          <div className="site-footer__brand">
            <p>Handcrafted crochet and beauty consultations from Gqeberha, South Africa.</p>
          </div>
          <div className="site-footer__links">
            <a href="https://instagram.com/likitu" target="_blank" rel="noreferrer" aria-label="Likitu on Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" />
              </svg>
              Instagram
            </a>
            <a href="#inquiry">Inquire</a>
            <a href="#collections">Collections</a>
          </div>
          <div className="site-footer__meta">
            <span>© {new Date().getFullYear()} Likitu Fashion & Beauty</span>
            <span>Designed by Speelman Studios</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function App() {
  const { pathname } = window.location;
  const isAdminRoute = pathname.startsWith("/admin");
  const productMatch = pathname.match(/^\/products\/([^/]+)$/);

  if (isAdminRoute) return <AdminApp />;
  if (productMatch) return <ProductInquiryPage product={getProductById(productMatch[1])} />;
  return <PublicSite />;
}

export default App;

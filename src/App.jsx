import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./assets/styles/site.css";

import { isSupabaseConfigured, supabase } from "./lib/supabase";
import likituLogo from "./assets/likitu-logo.svg";
import likituLogoWhite from "./assets/likitu-logo-white.svg";
import likituIcon from "./assets/likitu-icon.svg";
import heroImage from "./assets/media/editorial-hero.jpg";
import portraitImage from "./assets/media/editorial-portrait.jpg";
import founderImage from "./assets/media/founder-liyema.jpg";
import bagMarigold from "./assets/media/bag-marigold-front.jpg";
import bagSculpted from "./assets/media/bag-sculpted-noir.jpg";
import bagPetit from "./assets/media/bag-petit-bucket.jpg";
import topOcean from "./assets/media/top-ocean.jpg";
import skirtSpectrum from "./assets/media/skirt-spectrum.jpg";

import AdminCollections from "./components/AdminCollections";
import { fetchAdminProducts, fetchProductBySlugOrId, fetchPublicProducts } from "./lib/products";
import { resolveProductCardImage } from "./lib/productUtils";


const services = [
  ["Crocheting", "Custom crochet garments and fashion pieces shaped around your sizing, colour direction, and occasion."],
  ["Makeup", "Soft, polished beauty services for events, photoshoots, bridal moments, and personal bookings."],
];

const heroSlides = [heroImage, portraitImage, founderImage];

function preventOrphan(text) {
  return text.replace(/\s+([^\s]+)$/, "\u00A0$1");
}

// Client-side product data is now fetched from Supabase.
// Kept imports above for static fallback images/hero sections.

const FALLBACK_PRODUCT_IMAGES = {
  "marigold-carryall": bagMarigold,
  "sculpted-shoulder-bag": bagSculpted,
  "petit-bucket": bagPetit,
  "ribbon-wrap-top": topOcean,
  "spectrum-fringe": skirtSpectrum,
};

function getPublicProductCardImage(product) {
  return resolveProductCardImage(product, FALLBACK_PRODUCT_IMAGES);
}



const processSteps = ["Consultation", "Design Discussion", "Creation", "Approval", "Delivery"];

const testimonials = [
  ["Every detail felt personal. The piece looked delicate, but it carried so much confidence.", "A custom garment client"],
  ["My makeup was soft, clean, and elevated. I still looked like myself, just beautifully finished.", "Event makeup booking"],
  ["The consultation made ordering feel calm and considered. I knew exactly what would happen next.", "Crochet inquiry client"],
];

const adminTabs = ["Overview", "Inquiries", "Collections", "Makeup", "Content", "Settings"];

const initialContent = {
  aboutTitle: "Founded by Liyema Kabi in Gqeberha, South Africa.",
  aboutBody: "Likitu Fashion & Beauty creates handcrafted crochet garments and beauty experiences with care, confidence, and intention.",
  whatsapp: "+27000000000",
  instagram: "@likitu",
  email: "hello@likitu.com",
};

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
  const [productCount, setProductCount] = useState(0);
  const [contentDraft, setContentDraft] = useState(initialContent);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);

  const counts = useMemo(() => getInquiryCounts(inquiries), [inquiries]);
  const recentInquiries = inquiries.slice(0, 5);
  const makeupBookings = inquiries.filter((inquiry) => inquiry.inquiry_type === "Makeup Service");

  const loadInquiries = useCallback(async () => {
    setDataStatus("Loading inquiries...");
    setIsLoadingInquiries(true);
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .select("id, full_name, whatsapp_number, inquiry_type, garment_or_service, preferred_sizing, event_or_needed_by, inspiration_references, design_description, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setDataStatus(`Could not load inquiries: ${error.message}`);
        return;
      }

      setInquiries(data || []);
      setDataStatus(data?.length ? "Inquiries loaded." : "No inquiries yet.");
    } finally {
      setIsLoadingInquiries(false);
    }
  }, []);

  const loadProductCount = useCallback(async () => {
    try {
      const products = await fetchAdminProducts();
      setProductCount(products.length);
    } catch {
      setProductCount(0);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthStatus(data.session ? "Signed in" : "Please sign in to continue.");
      if (data.session) {
        loadInquiries();
        loadProductCount();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthStatus(nextSession ? "Signed in" : "Please sign in to continue.");
      if (nextSession) {
        loadInquiries();
        loadProductCount();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadInquiries, loadProductCount]);

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
            <button
              className={activeTab === tab ? "is-active" : ""}
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
            >
              <span className="admin-nav__icon" aria-hidden="true">
                {tab === "Overview" && (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 11.5L12 4l8 7.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M9.5 21v-7.2c0-.66.54-1.2 1.2-1.2h2.6c.66 0 1.2.54 1.2 1.2V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
                {tab === "Inquiries" && (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 14.5V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M8 10h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M6 19h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M10 19c0 1.1-.9 2-2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M14 19c0 1.1.9 2 2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
                {tab === "Collections" && (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 8l8-4 8 4-8 4-8-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M4 8v8l8 4 8-4V8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M12 12v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
                {tab === "Makeup" && (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3h6l1 6H8l1-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M7 9l-1 12h12l-1-12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M9.5 13h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M10 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
                {tab === "Content" && (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M8 7h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M8 11h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
                {tab === "Settings" && (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.02.02-1.6 2.77-.03-.01a1.8 1.8 0 0 0-2.02.6 1.8 1.8 0 0 0-.33 2.02v.03H8.3v-.03a1.8 1.8 0 0 0-.33-2.02 1.8 1.8 0 0 0-2.02-.6l-.03.01-1.6-2.77.02-.02A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.76-1.2H2.8V9.2h.04A1.8 1.8 0 0 0 4.6 8a1.8 1.8 0 0 0-.36-1.98l-.02-.02 1.6-2.77.03.01a1.8 1.8 0 0 0 2.02-.6A1.8 1.8 0 0 0 8.3 1.6V1.57h7.4V1.6c0 .75.28 1.45.78 1.98.5.53 1.2.8 1.95.8.23 0 .46-.03.67-.1l.03-.01 1.6 2.77-.02.02A1.8 1.8 0 0 0 19.4 8c.76.35 1.3 1.08 1.32 1.98v.04h.04v4.6h-.04v.04c-.02.9-.56 1.63-1.32 1.98Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round"/>
                  </svg>
                )}
              </span>
              <span className="admin-nav__label">{tab}</span>
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
          <button
            className={`admin-refresh-button${isLoadingInquiries ? " is-loading" : ""}`}
            type="button"
            onClick={loadInquiries}
            aria-label="Refresh inquiries"
            title="Refresh inquiries"
            disabled={isLoadingInquiries}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M21 12a9 9 0 1 1-2.64-6.36"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M21 3v6h-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.5 10.5h5.2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0"
              />
            </svg>
          </button>
        </header>

        {activeTab === "Overview" && (
          <section className="admin-panel-stack">
            <div className="admin-stat-grid">
              <article><span>Total inquiries</span><strong>{counts.total}</strong></article>
              <article><span>Custom design requests</span><strong>{counts.custom}</strong></article>
              <article><span>Makeup bookings</span><strong>{counts.makeup}</strong></article>
              <article><span>Products</span><strong>{productCount}</strong></article>
            </div>
            <AdminInquiryList title="Recent inquiries" inquiries={recentInquiries} emptyText={dataStatus} />
          </section>
        )}

        {activeTab === "Inquiries" && <AdminInquiryList title="All submitted inquiries" inquiries={inquiries} emptyText={dataStatus} />}

        {activeTab === "Collections" && <AdminCollections />}

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
                <div><dt>WhatsApp</dt><dd>{inquiry.whatsapp_number}</dd></div>
                <div><dt>Size</dt><dd>{inquiry.preferred_sizing}</dd></div>
                <div><dt>Needed by</dt><dd>{formatDate(inquiry.event_or_needed_by)}</dd></div>
                <div><dt>Submitted</dt><dd>{formatDate(inquiry.created_at)}</dd></div>
              </dl>
              <p>{inquiry.design_description}</p>
              {inquiry.inspiration_references?.length > 0 && (
                <div className="admin-inspiration-gallery">
                  <h4>Inspiration Images</h4>
                  <div className="admin-inspiration-links">
                    {inquiry.inspiration_references.map((url, idx) => (
                      <a href={url} target="_blank" rel="noopener noreferrer" key={idx} className="admin-link">
                        View Image {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ProductInquiryPage({ slugOrId }) {
  const [product, setProduct] = useState(null);
  const [productStatus, setProductStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFading, setIsLoadingFading] = useState(false);

  useEffect(() => {
    let active = true;
    let fadeTimeoutId;

    async function loadProduct() {
      setIsLoading(true);
      setIsLoadingFading(false);
      setProductStatus("");

      try {
        const row = await fetchProductBySlugOrId(slugOrId);
        if (!active) return;

        setProduct(row);
        setProductStatus(row ? "Product loaded." : "Product not found.");
      } catch (error) {
        if (!active) return;

        setProduct(null);
        setProductStatus(`Could not load product: ${error.message}`);
      } finally {
        if (!active) return;

        // Smooth transition: fade overlay out, then unmount it.
        setIsLoadingFading(true);
        fadeTimeoutId = window.setTimeout(() => {
          if (!active) return;
          setIsLoading(false);
        }, 240);
      }
    }

    loadProduct();

    return () => {
      active = false;
      if (fadeTimeoutId) window.clearTimeout(fadeTimeoutId);
    };
  }, [slugOrId]);

  const [formStatus, setFormStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <main
        className={`product-loading-overlay${isLoadingFading ? " is-fading" : ""}`}
        role="status"
        aria-live="polite"
      >
        <div className="product-loading-icon-wrap" aria-hidden="true">
          <img className="product-loading-icon" src={likituIcon} alt="" />
        </div>
      </main>
    );
  }

  const BackToLinkIcon = () => (
    // Arrow with stem (returns "back" direction clearly)
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 19 3 12l7-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12h18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );

  if (!product) {
    return (
      <main className="product-page product-page--missing">
        <a className="product-back-link" href="/" aria-label="Back to home">
          <BackToLinkIcon />
        </a>
        <h1>{productStatus || "Product not found."}</h1>
      </main>
    );
  }

  const handleProductInquiry = async (event) => {

    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const references = data.getAll("reference").filter((file) => file && file.name && file.size > 0);

    setIsSubmitting(true);
    setFormStatus("Uploading inspiration images...");

    const uploadedUrls = [];
    try {
      for (const file of references) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("inspiration")
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("inspiration")
          .getPublicUrl(fileName);
        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
        }
      }
    } catch (uploadErr) {
      setIsSubmitting(false);
      setFormStatus(uploadErr.message);
      return;
    }

    const inquiry = {
      full_name: data.get("fullName")?.toString().trim() || "",
      whatsapp_number: data.get("phone")?.toString().trim() || "",
      inquiry_type: "Custom Crochet Garment",
      garment_or_service: product.title,
      preferred_sizing: data.get("size")?.toString() || "Not Applicable",
      event_or_needed_by: data.get("neededBy")?.toString() || "",
      inspiration_references: uploadedUrls,
      design_description: data.get("details")?.toString().trim() || `Product inquiry for ${product.title}`,
    };

    setFormStatus("Sending your product inquiry...");
    const { error } = await submitInquiryToSupabase(inquiry);
    setIsSubmitting(false);

    if (error) {
      setFormStatus(`Could not send inquiry: ${error.message}`);
      return;
    }

    setFormStatus("Product inquiry sent successfully. Thank you!");
    form.reset();
  };

  return (
    <main className="product-page">
      <a className="product-back-link" href="/" aria-label="Back to home">
        <BackToLinkIcon />
      </a>
      <section className="product-detail">
        <figure>
          <img src={getPublicProductCardImage(product)} alt={`${product.title} by Likitu`} />
        </figure>
        <div className="product-detail__content">
          <p className="eyebrow">{product.type}</p>
          <h1>{product.title}</h1>
          {product.price && <p className="product-detail__price">{product.price}</p>}
          <p>{product.description}</p>
          {product.available_colors?.length > 0 && (
            <p className="product-detail__meta">Available colors: {product.available_colors.join(", ")}</p>
          )}
          {product.available_sizing?.length > 0 && (
            <p className="product-detail__meta">Available sizing: {product.available_sizing.join(", ")}</p>
          )}

          <form className="inquiry-form product-inquiry-form" onSubmit={handleProductInquiry}>
            <div className="form-grid">
              <label>
                Full name
                <input name="fullName" type="text" required />
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
                Needed by
                <input name="neededBy" type="date" />
              </label>
              <label className="form-grid__wide file-field">
                Inspiration images
                <input name="reference" type="file" accept="image/*" />
              </label>
              <label className="form-grid__wide">
                Describe your desired design or booking
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

const crochetGarmentOptions = [
  "Crochet skirt",
  "Crochet top",
  "Crochet dress",
  "Crochet shorts",
  "Crochet pants",
  "Crochet two-piece set",
  "Crochet beach cover-up",
  "Crochet bikini or swim set",
  "Crochet cardigan",
  "Crochet bucket hat",
  "Crochet headscarf",
  "Crochet bag",
  "Other custom request",
];

const makeupServiceOptions = [
  "Event makeup",
  "Photoshoot makeup",
  "Soft glam makeup",
  "Bridal makeup",
  "Other custom request",
];

function PublicSite() {
  const [formStatus, setFormStatus] = useState("");
  const [inquiryType, setInquiryType] = useState("");
  const [garmentType, setGarmentType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const carouselRef = useRef(null);
  const isPausedRef = useRef(false);
  const isUserInteractingRef = useRef(false);
  const railOneThirdRef = useRef(0);
  const scrollEndTimeoutRef = useRef(null);

  const [whatsappBottom, setWhatsappBottom] = useState(24);
  const [showMobileBackToTop, setShowMobileBackToTop] = useState(false);

  const [products, setProducts] = useState([]);
  const [productsStatus, setProductsStatus] = useState("");


  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector(".site-footer");
      if (!footer) return;

      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (footerRect.top < windowHeight) {
        const overlappedHeight = windowHeight - footerRect.top;
        const isMobile = window.innerWidth <= 620;
        const defaultBottom = isMobile ? 16 : 24;
        setWhatsappBottom(defaultBottom + overlappedHeight);
      } else {
        const isMobile = window.innerWidth <= 620;
        const defaultBottom = isMobile ? 16 : 24;
        setWhatsappBottom(defaultBottom);
      }

      const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const isAtBottom = window.innerHeight + scrollTop >= scrollHeight - 250;
      setShowMobileBackToTop(isAtBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const loadProducts = useCallback(async () => {
    const publicProducts = await fetchPublicProducts();
    setProducts(publicProducts);
    // No blocking “Loading products…” UI; just set an appropriate end state.
    setProductsStatus(publicProducts.length ? "" : "No published products.");
  }, []);

  useEffect(() => {
    // Data fetch on mount — intentional async load from Supabase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [loadProducts]);

  // Set initial scroll to the middle copy so user can scroll left
  useEffect(() => {
    const rail = carouselRef.current;
    if (!rail || products.length === 0) return;
    requestAnimationFrame(() => {
      rail.scrollLeft = rail.scrollWidth / 3;
    });
  }, [products.length]);


  // Auto-scroll via requestAnimationFrame (only pauses on hover/focus/drag).
  // Must re-run after the carousel rail exists (after products load/render).
  useEffect(() => {
    const rail = carouselRef.current;
    if (!rail) return undefined;

    let frameId;
    const SPEED = 0.7; // px per frame

    const tick = () => {
      if (!isPausedRef.current && !isUserInteractingRef.current) {
        const oneThird = railOneThirdRef.current || (rail.scrollWidth / 3);
        railOneThirdRef.current = oneThird;

        rail.scrollLeft += SPEED;
        // Seamless loop: jump back when past 2nd copy
        if (rail.scrollLeft >= oneThird * 2) {
          rail.scrollLeft -= oneThird;
        }
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [products.length]);

  const clampRailLoop = useCallback(() => {
    const rail = carouselRef.current;
    if (!rail) return;

    const oneThird = railOneThirdRef.current || (rail.scrollWidth / 3);
    railOneThirdRef.current = oneThird;

    // Fix only at the end of user interaction to avoid jitter.
    if (rail.scrollLeft < oneThird * 0.08) {
      rail.scrollLeft += oneThird;
    } else if (rail.scrollLeft > oneThird * 2.92) {
      rail.scrollLeft -= oneThird;
    }
  }, []);





  const handleInquirySubmit = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const references = data.getAll("reference").filter((file) => file && file.name && file.size > 0);

    setIsSubmitting(true);
    setFormStatus("Uploading inspiration images...");

    const uploadedUrls = [];
    try {
      for (const file of references) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("inspiration")
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("inspiration")
          .getPublicUrl(fileName);
        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
        }
      }
    } catch (uploadErr) {
      setIsSubmitting(false);
      setFormStatus(uploadErr.message);
      return;
    }

    const inquiry = {
      full_name: data.get("fullName")?.toString().trim() || "",
      whatsapp_number: data.get("phone")?.toString().trim() || "",
      inquiry_type: data.get("inquiryType")?.toString() || "",
      garment_or_service: data.get("garmentType")?.toString() || "",
      preferred_sizing: data.get("size")?.toString() || "Not Applicable",
      event_or_needed_by: data.get("neededBy")?.toString() || "",
      inspiration_references: uploadedUrls,
      design_description: data.get("details")?.toString().trim() || "",
    };

    setFormStatus("Sending your inquiry...");
    const { error } = await submitInquiryToSupabase(inquiry);
    setIsSubmitting(false);

    if (error) {
      console.error("Inquiry submission error:", error);
      setFormStatus(`Your inquiry could not be sent: ${error.message}. Please check the database setup and try again.`);
      return;
    }

    setFormStatus("Inquiry sent successfully. Thank you!");
    setInquiryType("");
    setGarmentType("");
    form.reset();
  };

  const handleCarouselInteractionStart = () => {
    isPausedRef.current = true;
    isUserInteractingRef.current = true;
    if (scrollEndTimeoutRef.current) {
      window.clearTimeout(scrollEndTimeoutRef.current);
      scrollEndTimeoutRef.current = null;
    }
  };

  const handleCarouselInteractionEnd = () => {
    // Always resume quickly; if user continues dragging, start will re-pause.
    isPausedRef.current = false;
    isUserInteractingRef.current = false;

    if (scrollEndTimeoutRef.current) {
      window.clearTimeout(scrollEndTimeoutRef.current);
      scrollEndTimeoutRef.current = null;
    }
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
          <a href="#services">Services</a>
          <a href="#collections">Collections</a>
          <a href="#testimonials">Reviews</a>
          <a href="#inquiry">Inquire</a>
        </nav>
        <div className={`mobile-menu ${isMobileMenuOpen ? "is-open" : ""}`}>
          <a href="#about" onClick={() => setIsMobileMenuOpen(false)}>About</a>
          <a href="#services" onClick={() => setIsMobileMenuOpen(false)}>Services</a>
          <a href="#collections" onClick={() => setIsMobileMenuOpen(false)}>Collections</a>
          <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)}>Reviews</a>
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
            <h1 id="hero-title">
              Crochet garments<br />
              elegantly made<br />
              to suit your<br />
              unique style.
            </h1>
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

        <section
          className="product-carousel"
          aria-labelledby="product-carousel-title"
          onMouseEnter={handleCarouselInteractionStart}
          onMouseLeave={handleCarouselInteractionEnd}
        >
          <div className="product-carousel__head reveal">
            <p className="eyebrow">Browse handmade pieces and inquire from the product page.</p>
            <h2 id="product-carousel-title">Selected pieces</h2>
          </div>
          <div
            ref={carouselRef}
            className="product-carousel__rail"
            aria-label="Product carousel"
            onScroll={() => {
              if (scrollEndTimeoutRef.current) window.clearTimeout(scrollEndTimeoutRef.current);
              scrollEndTimeoutRef.current = window.setTimeout(() => {
                if (isPausedRef.current || isUserInteractingRef.current) return;
                clampRailLoop();
              }, 140);
            }}
            onPointerDown={handleCarouselInteractionStart}
            onPointerUp={handleCarouselInteractionEnd}
            onPointerCancel={handleCarouselInteractionEnd}
            onTouchStart={handleCarouselInteractionStart}
            onTouchEnd={handleCarouselInteractionEnd}
          >
            {products.length === 0 ? (
              <p className="admin-note product-carousel__empty">{productsStatus}</p>
            ) : (
              [...products, ...products, ...products].map((item, index) => (
                <a
                  className="product-tile"
                  href={item.slug ? `/products/${item.slug}` : `/products/${item.id}`}
                  key={`${item.id}-${index}`}
                >
                  <img src={getPublicProductCardImage(item)} alt={`${item.title} by Likitu`} />
                  <span>{item.type}</span>
                  <h3>{item.title}</h3>
                </a>
              ))
            )}
          </div>
        </section>

        <section className="about section-grid" id="about" aria-labelledby="about-title">
          <div className="section-kicker reveal">
            <span>Founded by Liyema Kabi in Gqeberha, South Africa.</span>
          </div>
          <div className="about__copy reveal">
            <h2 id="about-title">About Her</h2>
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
            {products.length === 0 ? (
              <p className="admin-note">{productsStatus}</p>
            ) : (
              products
                .filter((p) => p.status === "Published")
                .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || 0)
                .map((item) => (
                  <a
                    className="collection-card reveal"
                    href={item.slug ? `/products/${item.slug}` : `/products/${item.id}`}
                    key={item.id}
                    data-featured={item.is_featured}
                  >
                    <img src={getPublicProductCardImage(item)} alt={`${item.title} by Likitu`} />
                    <div>
                      <span>{item.type}</span>
                      <h3>{item.title}</h3>
                    </div>
                  </a>
                ))
            )}
          </div>

        </section>

        <section className="inquiry section-grid" id="inquiry" aria-labelledby="inquiry-title">
          <div className="section-kicker reveal">
            <span className="eyebrow inquiry__subtitle">SHARE THE GARMENT, BEAUTY SERVICE, OR MOMENT YOU ARE PREPARING FOR.</span>
            <h2 id="inquiry-title">Inquiries</h2>
          </div>
          <div className="inquiry__content reveal">
            <p>
              Submit your request, you will be contacted through Whatsapp for further communication about your inquiry.
            </p>
            <form className="inquiry-form" onSubmit={handleInquirySubmit}>
              <div className="form-grid">
                <label>
                  Full name
                  <input name="fullName" type="text" required />
                </label>
                <label>
                  WhatsApp number
                  <input name="phone" type="tel" placeholder="+27XXXXXXXXX or 0XXXXXXXXX" pattern="(\+27|0)[0-9]{9}" required />
                </label>
                <label>
                  Inquiry type
                  <select
                    name="inquiryType"
                    required
                    value={inquiryType}
                    onChange={(e) => {
                      setInquiryType(e.target.value);
                      setGarmentType("");
                    }}
                  >
                    <option value="" disabled>Select one</option>
                    <option value="Custom Crochet Garment">Custom Crochet Garment</option>
                    <option value="Makeup Service">Makeup Service</option>
                  </select>
                </label>
                <label>
                  Garment or service
                  <select
                    name="garmentType"
                    required
                    value={garmentType}
                    onChange={(e) => setGarmentType(e.target.value)}
                  >
                    <option value="" disabled>
                      {inquiryType ? "Select one" : "Select inquiry type first"}
                    </option>
                    {inquiryType === "Custom Crochet Garment" && crochetGarmentOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {inquiryType === "Makeup Service" && makeupServiceOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>
                {inquiryType === "Custom Crochet Garment" && (
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
                )}
                <label>
                  Needed by
                  <input name="neededBy" type="date" />
                </label>
                <label className="form-grid__wide file-field">
                  Inspiration Images
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

        <div className={`mobile-back-to-top ${showMobileBackToTop ? "is-visible" : ""}`}>
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            Back to top
          </a>
        </div>

        <footer className="site-footer">
          <div className="site-footer__brand">
            <img src={likituLogoWhite} alt="Likitu logo" />
            <p>{preventOrphan("Handcrafted crochet pieces and beauty consultations, designed and made in Gqeberha.")}</p>
            <div className="site-footer__social">
              <a href="https://instagram.com/likitu" target="_blank" rel="noreferrer" aria-label="Likitu on Instagram">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.684.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              </a>
              <a href="https://facebook.com/likitu" target="_blank" rel="noreferrer" aria-label="Likitu on Facebook">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="https://wa.me/27814375659" target="_blank" rel="noreferrer noopener" aria-label="Chat with Likitu on WhatsApp">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.007a9.863 9.863 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
            <a href="#" className="site-footer__back-to-top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to top</a>
          </div>
          <div className="site-footer__meta">
            <a href="tel:+27814375659">+27 81 437 5659</a>
            <a href="mailto:likitu.cb@gmail.com">likitu.cb@gmail.com</a>
            <span>© {new Date().getFullYear()} Likitu Fashion & Beauty</span>
          </div>
        </footer>
      </main>
      <a
        className="whatsapp-float"
        style={{ bottom: `${whatsappBottom}px` }}
        href="https://wa.me/27814375659"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Inquire on WhatsApp"
        title="Inquire on WhatsApp"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="#fff" d="M20.52 3.48A11.83 11.83 0 0012 0C5.37 0 .1 5.37.1 12a11.9 11.9 0 001.6 6.07L0 24l6.23-1.62A11.9 11.9 0 0012 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.2-3.48-8.52zM12 22.12a10.06 10.06 0 01-5.25-1.44l-.38-.23-3.7.96.99-3.6-.25-.37A10.04 10.04 0 011.88 12 10.12 10.12 0 0112 1.88 10.12 10.12 0 0122.12 12 10.04 10.04 0 0112 22.12z" />
          <path fill="#fff" d="M17.03 13.57c-.26-.13-1.53-.75-1.77-.84-.24-.09-.42-.13-.6.13-.18.26-.7.84-.86 1.01-.16.17-.32.19-.59.06-.26-.13-1.1-.41-2.1-1.3-.78-.69-1.3-1.53-1.45-1.79-.15-.26-.02-.4.11-.53.11-.11.26-.29.39-.44.13-.15.17-.26.26-.43.09-.17.05-.31-.02-.44-.07-.13-.6-1.44-.82-1.98-.22-.52-.45-.45-.6-.46-.16-.01-.34-.01-.52-.01-.18 0-.46.07-.7.32-.24.24-.9.88-.9 2.15 0 1.28.92 2.52 1.05 2.69.12.17 1.82 2.78 4.42 3.9.62.27 1.1.43 1.48.55.62.2 1.18.17 1.62.1.49-.08 1.53-.62 1.75-1.22.22-.6.22-1.12.16-1.22-.06-.1-.22-.16-.48-.29z" />
        </svg>
      </a>
    </div>
  );
}

function App() {
  const { pathname } = window.location;
  const isAdminRoute = pathname.startsWith("/admin");
  const isProductRoute = pathname.startsWith("/products/");

  if (isAdminRoute) return <AdminApp />;
  if (isProductRoute) {
    const slugOrId = pathname.replace(/^\/products\//, "");
    return <ProductInquiryPage slugOrId={slugOrId} />;
  }
  return <PublicSite />;
}


export default App;

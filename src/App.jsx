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

const FALLBACK_PRODUCTS = [
  {
    id: "marigold-carryall",
    slug: "marigold-carryall",
    title: "Marigold Carryall",
    type: "Crochet bag",
    description: "A sculptural handmade carryall with floral detail and soft structure.",
    price: "From R650",
    status: "Published",
    is_featured: true,
    available_sizing: ["One size"],
    available_colors: ["Marigold floral", "Plain marigold"],
  },
  {
    id: "sculpted-shoulder-bag",
    slug: "sculpted-shoulder-bag",
    title: "Sculpted Shoulder Bag",
    type: "Statement shoulder bag",
    description: "A refined shoulder bag silhouette available in noir, nude, and vermilion colourways.",
    price: "From R620",
    status: "Published",
    is_featured: true,
    available_sizing: ["One size"],
    available_colors: ["Noir", "Nude", "Vermilion"],
  },
  {
    id: "petit-bucket",
    slug: "petit-bucket",
    title: "Petit Bucket",
    type: "Compact crochet bag",
    description: "A compact bucket form for delicate everyday carrying.",
    price: "From R480",
    status: "Published",
    is_featured: false,
    available_sizing: ["One size"],
    available_colors: ["Neutral"],
  },
  {
    id: "ribbon-wrap-top",
    slug: "ribbon-wrap-top",
    title: "Ribbon Wrap Top",
    type: "Crochet top",
    description: "A custom wrap top available in ocean, lime, and made-to-order colour directions.",
    price: "From R540",
    status: "Published",
    is_featured: false,
    available_sizing: ["XS", "Small", "Medium", "Large", "XL", "Custom Measurements"],
    available_colors: ["Ocean", "Lime", "Custom colour"],
  },
  {
    id: "spectrum-fringe",
    slug: "spectrum-fringe",
    title: "Spectrum Fringe",
    type: "Custom skirt piece",
    description: "A colourful fringe skirt designed for movement and occasion styling.",
    price: "From R700",
    status: "Published",
    is_featured: false,
    available_sizing: ["XS", "Small", "Medium", "Large", "XL", "Custom Measurements"],
    available_colors: ["Spectrum fringe"],
  },
];

function getFallbackProduct(slugOrId) {
  return FALLBACK_PRODUCTS.find((product) => product.slug === slugOrId || product.id === slugOrId) || null;
}

function getPublicProductCardImage(product) {
  return resolveProductCardImage(product, FALLBACK_PRODUCT_IMAGES);
}

function BackToLinkIcon() {
  return (
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
}



const processSteps = ["Consultation", "Design Discussion", "Creation", "Approval", "Delivery"];

const testimonials = [
  ["Every detail felt personal. The piece looked delicate, but it carried so much confidence.", "A custom garment client"],
  ["My makeup was soft, clean, and elevated. I still looked like myself, just beautifully finished.", "Event makeup booking"],
  ["The consultation made ordering feel calm and considered. I knew exactly what would happen next.", "Crochet inquiry client"],
];

const adminTabs = ["Overview", "Inquiries", "Products", "Settings"];

const inquirySections = [
  { id: "general", label: "General", emptyText: "No general requests yet." },
  { id: "makeup", label: "Makeup", emptyText: "No makeup requests yet." },
  { id: "existing", label: "Existing products", emptyText: "No existing product requests yet." },
];

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

function isExistingProductInquiry(inquiry, productTitles) {
  return productTitles.has((inquiry.garment_or_service || "").trim().toLowerCase());
}

function getInquirySectionItems(inquiries, productTitles) {
  return {
    makeup: inquiries.filter((inquiry) => inquiry.inquiry_type === "Makeup Service"),
    existing: inquiries.filter((inquiry) => isExistingProductInquiry(inquiry, productTitles)),
    general: inquiries.filter(
      (inquiry) => inquiry.inquiry_type !== "Makeup Service" && !isExistingProductInquiry(inquiry, productTitles)
    ),
  };
}

function AdminTabIcon({ tab }) {
  const common = {
    viewBox: "0 0 24 24",
    width: "20",
    height: "20",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true",
  };

  if (tab === "Overview") {
    return (
      <svg {...common}>
        <path d="M4 13.5h6.5V20H4v-6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M13.5 4H20v16h-6.5V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M4 4h6.5v6.5H4V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }

  if (tab === "Inquiries") {
    return (
      <svg {...common}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-5 4V5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8 8h8M8 11h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (tab === "Products") {
    return (
      <svg {...common}>
        <path d="M12 4v2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 6.2c1.15 0 2 .72 2 1.7 0 1.22-1.02 1.56-2 2.1l-5.6 3.1c-.9.5-.54 1.9.49 1.9h10.22c1.03 0 1.39-1.4.49-1.9L12 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 19h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19 12a7.1 7.1 0 0 0-.12-1.3l2-1.45-2-3.46-2.36.95a7.4 7.4 0 0 0-2.24-1.3L14 3h-4l-.28 2.44a7.4 7.4 0 0 0-2.24 1.3l-2.36-.95-2 3.46 2 1.45A7.1 7.1 0 0 0 5 12c0 .44.04.88.12 1.3l-2 1.45 2 3.46 2.36-.95a7.4 7.4 0 0 0 2.24 1.3L10 21h4l.28-2.44a7.4 7.4 0 0 0 2.24-1.3l2.36.95 2-3.46-2-1.45c.08-.42.12-.86.12-1.3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
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
  const [productTitles, setProductTitles] = useState(
    () => new Set(FALLBACK_PRODUCTS.map((product) => product.title.trim().toLowerCase()))
  );
  const [activeInquirySection, setActiveInquirySection] = useState("general");
  const [activeSettingsPanel, setActiveSettingsPanel] = useState("contact");
  const [contentDraft, setContentDraft] = useState(initialContent);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);

  const counts = useMemo(() => getInquiryCounts(inquiries), [inquiries]);
  const recentInquiries = inquiries.slice(0, 5);
  const inquirySectionItems = useMemo(
    () => getInquirySectionItems(inquiries, productTitles),
    [inquiries, productTitles]
  );

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
      setProductTitles(new Set(products.map((product) => (product.title || "").trim().toLowerCase()).filter(Boolean)));
    } catch {
      setProductCount(0);
      setProductTitles(new Set(FALLBACK_PRODUCTS.map((product) => product.title.trim().toLowerCase())));
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
        <nav
          className="admin-nav"
          aria-label="Admin sections"
          style={{ "--active-index": adminTabs.indexOf(activeTab), "--dock-count": adminTabs.length }}
        >
          {adminTabs.map((tab) => (
            <button
              className={activeTab === tab ? "is-active" : ""}
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
            >
              <span className="admin-nav__icon" aria-hidden="true">
                <AdminTabIcon tab={tab} />
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

        <div className="admin-view-panel" key={activeTab}>
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

          {activeTab === "Inquiries" && (
            <AdminInquirySections
              sections={inquirySections}
              groupedInquiries={inquirySectionItems}
              activeSection={activeInquirySection}
              setActiveSection={setActiveInquirySection}
              dataStatus={dataStatus}
            />
          )}

          {activeTab === "Products" && <AdminCollections />}

          {activeTab === "Settings" && (
            <section className="admin-settings-panels">
              <button
                className={`admin-settings-panel-toggle${activeSettingsPanel === "contact" ? " is-active" : ""}`}
                type="button"
                onClick={() => setActiveSettingsPanel((current) => (current === "contact" ? "" : "contact"))}
              >
                <span>Manage contact details</span>
                <strong>{activeSettingsPanel === "contact" ? "Close" : "Open"}</strong>
              </button>
              {activeSettingsPanel === "contact" && (
                <section className="admin-form-panel admin-settings-panel">
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

              <button
                className={`admin-settings-panel-toggle${activeSettingsPanel === "content" ? " is-active" : ""}`}
                type="button"
                onClick={() => setActiveSettingsPanel((current) => (current === "content" ? "" : "content"))}
              >
                <span>Content</span>
                <strong>{activeSettingsPanel === "content" ? "Close" : "Open"}</strong>
              </button>
              {activeSettingsPanel === "content" && (
                <section className="admin-form-panel admin-settings-panel">
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
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function AdminInquirySections({ sections, groupedInquiries, activeSection, setActiveSection, dataStatus }) {
  const selectedSection = sections.find((section) => section.id === activeSection) || sections[0];
  const selectedInquiries = groupedInquiries[selectedSection.id] || [];
  const emptyText =
    dataStatus.startsWith("Loading") || dataStatus.startsWith("Could not")
      ? dataStatus
      : selectedSection.emptyText;

  return (
    <section className="admin-panel-stack">
      <div className="admin-inquiry-sections" role="tablist" aria-label="Inquiry categories">
        {sections.map((section) => {
          const count = groupedInquiries[section.id]?.length || 0;
          const isActive = selectedSection.id === section.id;

          return (
            <button
              className={`admin-inquiry-section${isActive ? " is-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              key={section.id}
              onClick={() => setActiveSection(section.id)}
            >
              <span>{section.label}</span>
              <strong>{count}</strong>
            </button>
          );
        })}
      </div>

      <div className="admin-inquiry-content-swap" key={selectedSection.id}>
        <AdminInquiryList
          title={selectedSection.label}
          inquiries={selectedInquiries}
          emptyText={emptyText}
        />
      </div>
    </section>
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

function ProductLoadingOverlay({ isFading }) {
  return (
    <div
      className={`product-loading-overlay${isFading ? " is-fading" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="product-loading-icon-wrap" aria-hidden="true">
        <img className="product-loading-icon" src={likituIcon} alt="" />
      </div>
    </div>
  );
}

function ProductPageHeader() {
  return (
    <header className="product-page-header">
      <a className="product-back-link" href="/" aria-label="Back to home">
        <BackToLinkIcon />
      </a>
      <a className="product-page-logo" href="/" aria-label="Likitu home">
        <img src={likituLogo} alt="Likitu" />
      </a>
      <span className="product-page-header__spacer" aria-hidden="true" />
    </header>
  );
}

function ProductPageFooter() {
  return (
    <footer className="site-footer product-page-footer">
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
      </div>
      <div className="site-footer__meta">
        <a href="tel:+27814375659">+27 81 437 5659</a>
        <a href="mailto:likitu.cb@gmail.com">likitu.cb@gmail.com</a>
        <span>© {new Date().getFullYear()} Likitu Fashion & Beauty</span>
      </div>
    </footer>
  );
}

function ProductInquiryPage({ slugOrId }) {
  const [product, setProduct] = useState(() => getFallbackProduct(slugOrId));
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
      setProduct(getFallbackProduct(slugOrId));

      try {
        const row = await fetchProductBySlugOrId(slugOrId);
        const nextProduct = row || getFallbackProduct(slugOrId);
        if (!active) return;

        setProduct(nextProduct);
        setProductStatus(nextProduct ? "Product loaded." : "Product not found.");
      } catch (error) {
        if (!active) return;

        const fallbackProduct = getFallbackProduct(slugOrId);
        setProduct(fallbackProduct);
        setProductStatus(fallbackProduct ? "Product loaded." : `Could not load product: ${error.message}`);
      } finally {
        if (active) {
          // Smooth transition: fade overlay out, then unmount it.
          setIsLoadingFading(true);
          fadeTimeoutId = window.setTimeout(() => {
            if (active) setIsLoading(false);
          }, 360);
        }
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

  if (!product) {
    return (
      <>
        {isLoading && <ProductLoadingOverlay isFading={isLoadingFading} />}
        <main className="product-page product-page--missing">
          <ProductPageHeader />
          <h1>{productStatus || "Product not found."}</h1>
        </main>
      </>
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
    <div className="product-page-shell">
      {isLoading && <ProductLoadingOverlay isFading={isLoadingFading} />}
      <main className={`product-page${isLoading ? " is-loading" : " is-ready"}`}>
        <ProductPageHeader />
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
      <ProductPageFooter />
    </div>
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
  const carouselResumeTimeoutRef = useRef(null);

  const [whatsappBottom, setWhatsappBottom] = useState(24);
  const [showMobileBackToTop, setShowMobileBackToTop] = useState(false);

  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [productsStatus, setProductsStatus] = useState("");
  const productRevealKey = useMemo(() => products.map((product) => product.id).join("|"), [products]);


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
    const visibleProducts = publicProducts.length ? publicProducts : FALLBACK_PRODUCTS;
    setProducts(visibleProducts);
    // No blocking “Loading products…” UI; just set an appropriate end state.
    setProductsStatus(visibleProducts.length ? "" : "No published products.");
  }, []);

  useEffect(() => {
    // Data fetch on mount — intentional async load from Supabase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll(".reveal"));
    if (revealItems.length === 0) return undefined;

    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.12,
      },
    );

    revealItems.forEach((item) => {
      if (!item.classList.contains("is-visible")) observer.observe(item);
    });

    return () => observer.disconnect();
  }, [productRevealKey]);

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
    let lastTimestamp = performance.now();
    const SPEED = 42; // px per second

    const tick = (timestamp) => {
      const elapsedSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.08);
      lastTimestamp = timestamp;

      if (!isPausedRef.current && !isUserInteractingRef.current) {
        const oneThird = railOneThirdRef.current || (rail.scrollWidth / 3);
        railOneThirdRef.current = oneThird;

        rail.scrollLeft += SPEED * elapsedSeconds;
        // Seamless loop: jump back when past 2nd copy
        if (rail.scrollLeft >= oneThird * 2) {
          rail.scrollLeft -= oneThird;
        }
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      if (scrollEndTimeoutRef.current) window.clearTimeout(scrollEndTimeoutRef.current);
      if (carouselResumeTimeoutRef.current) window.clearTimeout(carouselResumeTimeoutRef.current);
    };
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

  const clearCarouselResumeTimeout = () => {
    if (carouselResumeTimeoutRef.current) {
      window.clearTimeout(carouselResumeTimeoutRef.current);
      carouselResumeTimeoutRef.current = null;
    }
  };

  const handleCarouselHoverStart = () => {
    isPausedRef.current = true;
    clearCarouselResumeTimeout();
  };

  const handleCarouselHoverEnd = (event) => {
    if (event?.currentTarget?.contains(event.relatedTarget)) return;
    isPausedRef.current = false;
    isUserInteractingRef.current = false;
    clearCarouselResumeTimeout();
    clampRailLoop();
  };

  const handleCarouselInteractionStart = () => {
    isPausedRef.current = true;
    isUserInteractingRef.current = true;
    clearCarouselResumeTimeout();
    if (scrollEndTimeoutRef.current) {
      window.clearTimeout(scrollEndTimeoutRef.current);
      scrollEndTimeoutRef.current = null;
    }
  };

  const handleCarouselInteractionEnd = () => {
    if (!isUserInteractingRef.current) return;
    isUserInteractingRef.current = false;

    if (scrollEndTimeoutRef.current) {
      window.clearTimeout(scrollEndTimeoutRef.current);
      scrollEndTimeoutRef.current = null;
    }

    clearCarouselResumeTimeout();
    carouselResumeTimeoutRef.current = window.setTimeout(() => {
      clampRailLoop();
      isPausedRef.current = false;
      carouselResumeTimeoutRef.current = null;
    }, 700);
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
          onMouseEnter={handleCarouselHoverStart}
          onMouseLeave={handleCarouselHoverEnd}
          onFocus={handleCarouselHoverStart}
          onBlur={handleCarouselHoverEnd}
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
            onPointerLeave={handleCarouselInteractionEnd}
            onTouchStart={handleCarouselInteractionStart}
            onTouchEnd={handleCarouselInteractionEnd}
          >
            {products.length === 0 ? (
              <p className="admin-note product-carousel__empty">{productsStatus}</p>
            ) : (
              [...products, ...products, ...products].map((item, index) => (
                <a
                  className="product-tile reveal"
                  href={item.slug ? `/products/${item.slug}` : `/products/${item.id}`}
                  key={`${item.id}-${index}`}
                  style={{ "--delay": `${(index % Math.max(products.length, 1)) * 70}ms` }}
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
                .map((item, index) => (
                  <a
                    className="collection-card reveal"
                    href={item.slug ? `/products/${item.slug}` : `/products/${item.id}`}
                    key={item.id}
                    data-featured={item.is_featured}
                    style={{ "--delay": `${index * 80}ms` }}
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

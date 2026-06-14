import { useCallback, useEffect, useState } from "react";

import {
  deleteProductImage,
  deleteProductRecord,
  fetchAdminProducts,
  saveProductRecord,
} from "../lib/products";
import {
  COLOR_PRESETS,
  emptyProductDraft,
  PRODUCT_STATUS_OPTIONS,
  SIZE_OPTIONS,
  toggleArrayValue,
} from "../lib/productOptions";

function draftFromProduct(product) {
  return {
    id: product.id,
    title: product.title || "",
    type: product.type || "",
    description: product.description || "",
    price: product.price || "",
    slug: product.slug || "",
    status: product.status || "Draft",
    is_featured: Boolean(product.is_featured),
    available_sizing: product.available_sizing || [],
    available_colors: product.available_colors || [],
    images: (product.images || []).map((img, index) => ({
      id: img.id,
      public_url: img.public_url,
      colorway_label: img.colorway_label || "",
      sort_order: img.sort_order ?? index,
    })),
    pendingFiles: [],
  };
}

function OptionGroup({ legend, options, selected, onToggle }) {
  return (
    <fieldset className="admin-option-group">
      <legend>{legend}</legend>
      <div className="admin-option-grid">
        {options.map((option) => (
          <label className="admin-option-chip" key={option}>
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ProductEditor({ draft, onChange, onSave, onDelete, onRemoveImage, isSaving }) {
  const update = (field, value) => onChange({ ...draft, [field]: value });

  const handleImagePick = (event) => {
    const files = [...event.target.files];
    if (!files.length) return;
    update("pendingFiles", [
      ...(draft.pendingFiles || []),
      ...files.map((file) => ({ file, colorway_label: "" })),
    ]);
    event.target.value = "";
  };

  const updatePendingLabel = (index, colorway_label) => {
    const pendingFiles = [...(draft.pendingFiles || [])];
    pendingFiles[index] = { ...pendingFiles[index], colorway_label };
    update("pendingFiles", pendingFiles);
  };

  const removePending = (index) => {
    update(
      "pendingFiles",
      (draft.pendingFiles || []).filter((_, i) => i !== index)
    );
  };

  const updateExistingLabel = (index, colorway_label) => {
    const images = [...(draft.images || [])];
    images[index] = { ...images[index], colorway_label };
    update("images", images);
  };

  return (
    <article className="admin-product-card">
      <div className="admin-product-card__head">
        <div>
          <h3>{draft.title || "New product"}</h3>
          <p>{draft.id ? "Existing product" : "Draft — not saved yet"}</p>
        </div>
        <div className="admin-product-card__actions">
          {draft.id && (
            <button className="admin-button" type="button" onClick={() => onDelete(draft.id)} disabled={isSaving}>
              Delete
            </button>
          )}
          <button className="admin-button admin-button--dark" type="button" onClick={() => onSave(draft)} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <div className="admin-product-form">
        <label>
          Title
          <input value={draft.title} onChange={(e) => update("title", e.target.value)} required />
        </label>
        <label>
          Type
          <input value={draft.type} onChange={(e) => update("type", e.target.value)} placeholder="Crochet bag" />
        </label>
        <label>
          Price
          <input value={draft.price} onChange={(e) => update("price", e.target.value)} placeholder="From R650" />
        </label>
        <label>
          Status
          <select value={draft.status} onChange={(e) => update("status", e.target.value)}>
            {PRODUCT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-product-form__wide">
          Description
          <textarea rows="4" value={draft.description} onChange={(e) => update("description", e.target.value)} />
        </label>
        <label className="admin-product-form__checkbox">
          <input
            type="checkbox"
            checked={draft.is_featured}
            onChange={(e) => update("is_featured", e.target.checked)}
          />
          Featured collection
        </label>

        <OptionGroup
          legend="Available sizing"
          options={SIZE_OPTIONS}
          selected={draft.available_sizing}
          onToggle={(value) => update("available_sizing", toggleArrayValue(draft.available_sizing, value))}
        />

        <OptionGroup
          legend="Available colors"
          options={COLOR_PRESETS}
          selected={draft.available_colors}
          onToggle={(value) => update("available_colors", toggleArrayValue(draft.available_colors, value))}
        />

        <div className="admin-product-form__wide admin-product-images">
          <div className="admin-panel-head">
            <h4>Product images</h4>
            <label className="admin-button admin-button--dark admin-file-button">
              Add images
              <input type="file" accept="image/*" multiple onChange={handleImagePick} />
            </label>
          </div>

          {(draft.images || []).length > 0 && (
            <div className="admin-image-grid">
              {draft.images.map((image, index) => (
                <div className="admin-image-card" key={image.id}>
                  <img src={image.public_url} alt="" />
                  <input
                    value={image.colorway_label}
                    onChange={(e) => updateExistingLabel(index, e.target.value)}
                    placeholder="Colorway label"
                    aria-label="Colorway label"
                  />
                  <button className="admin-button" type="button" onClick={() => onRemoveImage(draft.id, image.id, draft)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {(draft.pendingFiles || []).length > 0 && (
            <div className="admin-image-grid">
              {draft.pendingFiles.map((entry, index) => (
                <div className="admin-image-card admin-image-card--pending" key={`${entry.file.name}-${index}`}>
                  <span>New upload</span>
                  <p>{entry.file.name}</p>
                  <input
                    value={entry.colorway_label}
                    onChange={(e) => updatePendingLabel(index, e.target.value)}
                    placeholder="Colorway label"
                    aria-label="Colorway label for new image"
                  />
                  <button className="admin-button" type="button" onClick={() => removePending(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function AdminCollections() {
  const [drafts, setDrafts] = useState([]);
  const [status, setStatus] = useState("Loading products...");
  const [savingId, setSavingId] = useState(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDraft, setActiveDraft] = useState(null);

  const loadProducts = useCallback(async () => {
    setStatus("Loading products...");
    setIsLoadingProducts(true);
    try {
      const products = await fetchAdminProducts();
      setDrafts(products.map(draftFromProduct));
      setStatus(products.length ? `${products.length} products loaded.` : "No products yet. Add your first product.");
    } catch (error) {
      setStatus(`Could not load products: ${error.message}`);
      setDrafts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [loadProducts]);

  const openEditorForDraft = (draft) => {
    setActiveDraft(draft);
    setIsModalOpen(true);
  };

  const closeEditor = () => {
    setIsModalOpen(false);
    setActiveDraft(null);
  };

  const handleAddProduct = () => {
    const nextDraft = emptyProductDraft();
    setDrafts((current) => [nextDraft, ...current]);
    openEditorForDraft(nextDraft);
  };

  const handleSave = async (draft) => {
    setSavingId(draft.id || "new");
    setStatus("Saving product...");
    try {
      const saved = await saveProductRecord(draft);
      await loadProducts();
      setStatus(saved ? `"${saved.title}" saved.` : "Product saved.");
    } catch (error) {
      setStatus(`Could not save product: ${error.message}`);
    } finally {
      setSavingId(null);
    }
    closeEditor();
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    setSavingId(productId);
    try {
      await deleteProductRecord(productId);
      await loadProducts();
      setStatus("Product deleted.");
    } catch (error) {
      setStatus(`Could not delete product: ${error.message}`);
    } finally {
      setSavingId(null);
    }
    closeEditor();
  };

  const handleRemoveImage = async (_productId, imageId, draft) => {
    if (!_productId || !imageId) return;
    if (!window.confirm("Remove this image?")) return;
    setSavingId(_productId);
    try {
      await deleteProductImage(imageId);
      const nextDraft = {
        ...draft,
        images: draft.images.filter((img) => img.id !== imageId),
      };
      setActiveDraft(nextDraft);
      setStatus("Image removed.");
    } catch (error) {
      setStatus(`Could not remove image: ${error.message}`);
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeEditor();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen]);

  const listItems = drafts.length ? drafts : [];

  return (
    <section className="admin-panel-stack">
      <div className="admin-panel-head admin-collections-head">
        <div>
          <p className={`admin-note admin-products-status${isLoadingProducts ? " is-loading" : ""}`}>{status}</p>
        </div>
        <button className="admin-button admin-button--dark admin-add-product" type="button" onClick={handleAddProduct}>
          <span aria-hidden="true">+</span>
          Add new product
        </button>
      </div>

      <div className={`admin-product-list admin-product-list--simple${isLoadingProducts ? " is-loading" : " is-ready"}`}>
        {isLoadingProducts && listItems.length === 0 ? null : listItems.length === 0 ? (
          <p className="admin-note admin-product-empty">No products yet. Use “Add new product” to create one.</p>
        ) : (
          listItems.map((draft, index) => (
            <div className="admin-product-row" key={draft.id || `new-${index}`} style={{ "--delay": `${index * 55}ms` }}>
              <span className="admin-product-row__title">{draft.title || "Untitled"}</span>
              <button
                type="button"
                className="admin-button admin-button--dark admin-product-row__edit"
                onClick={() => openEditorForDraft(draft)}
                disabled={savingId && savingId !== draft.id}
              >
                Edit
              </button>
            </div>
          ))
        )}
      </div>

      {isModalOpen && activeDraft && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Edit product"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEditor();
          }}
        >
          <div className="admin-modal">
            <div className="admin-modal__head">
              <div>
                <h2 className="admin-modal__title">{activeDraft.title || "New product"}</h2>
                <p className="admin-note admin-modal__subtitle">
                  {activeDraft.id ? "Existing product" : "Draft — not saved yet"}
                </p>
              </div>
              <button className="admin-button" type="button" onClick={closeEditor}>
                Close
              </button>
            </div>

            <div className="admin-modal__body">
              <ProductEditor
                draft={activeDraft}
                onChange={setActiveDraft}
                onSave={handleSave}
                onDelete={handleDelete}
                onRemoveImage={(productId, imageId, draft) => handleRemoveImage(productId, imageId, draft)}
                isSaving={savingId === activeDraft.id || (savingId === "new" && !activeDraft.id)}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export const SIZE_OPTIONS = [
  "XS",
  "Small",
  "Medium",
  "Large",
  "XL",
  "Custom Measurements",
  "Not Applicable",
];

export const COLOR_PRESETS = [
  "Ocean",
  "Lime",
  "Noir",
  "Nude",
  "Vermilion",
  "Marigold floral",
  "Plain marigold",
  "Neutral bucket",
  "Spectrum fringe",
  "Custom colour",
];

export const PRODUCT_STATUS_OPTIONS = ["Draft", "Published"];

export function emptyProductDraft() {
  return {
    id: null,
    title: "",
    type: "",
    description: "",
    price: "",
    slug: "",
    status: "Draft",
    is_featured: false,
    available_sizing: [],
    available_colors: [],
    images: [],
    pendingFiles: [],
  };
}

export function toggleArrayValue(list, value) {
  const set = new Set(list || []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return [...set];
}

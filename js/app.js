import { createCategoryCard, getCategoryOptions, getCategoryTitle } from "./components/category-card.js";
import { defaultCategories } from "./data/categories.js";
import { translations } from "./data/translations.js";

const categoryStorageKey = "steam_review_user_categories";
const languageStorageKey = "steam_review_lang";
const categoryState = {};
let categories = [];
let currentLanguage = localStorage.getItem(languageStorageKey) || "es";

const componentMounts = {
  "add-category": "addCategoryMount",
  "review-notes": "reviewNotesMount",
  "review-preview": "reviewPreviewMount",
};

function getText() {
  return translations[currentLanguage];
}

function orderCategoriesByType() {
  categories = categories.filter((category) => category.type === "stars").concat(
    categories.filter((category) => category.type !== "stars"),
  );
}

function loadCategories() {
  const savedCategories = localStorage.getItem(categoryStorageKey);
  if (!savedCategories) {
    categories = structuredClone(defaultCategories);
  } else {
    try {
      const parsedCategories = JSON.parse(savedCategories);
      if (!Array.isArray(parsedCategories)) {
        throw new TypeError("Saved categories must be an array.");
      }

      categories = parsedCategories.filter(
        (category) =>
          category &&
          typeof category.id === "string" &&
          (typeof category.title === "string" ||
            (typeof category.title === "object" && category.title !== null)) &&
          (category.type === "stars" || category.type === "options"),
      );
    } catch (error) {
      console.error("Could not load saved review categories.", error);
      categories = structuredClone(defaultCategories);
    }
  }

  orderCategoriesByType();
}

function saveCategories() {
  orderCategoriesByType();
  localStorage.setItem(categoryStorageKey, JSON.stringify(categories));
}

async function loadComponents() {
  await Promise.all(
    Object.entries(componentMounts).map(async ([componentName, mountId]) => {
      const response = await fetch(`components/${componentName}.html`);
      if (!response.ok) {
        throw new Error(`Could not load ${componentName}.html (${response.status}).`);
      }

      document.getElementById(mountId).innerHTML = await response.text();
    }),
  );
}

function updateLanguageUI() {
  const text = getText();
  const labels = {
    txtAddCatTitle: text.addCategoryTitle,
    newIconLabel: text.iconLabel,
    newTitleLabel: text.nameLabel,
    newTypeLabel: text.typeLabel,
    optStars: text.starsOption,
    optCheckboxes: text.checkboxesOption,
    newOptionsLabel: text.optionsLabel,
    txtNotesHeader: text.notesHeader,
    notesLabel: text.notesLabel,
    txtPreviewTitle: text.previewTitle,
    previewLabel: text.previewLabel,
    addCatBtn: text.saveButton,
    copyBtn: text.copyButton,
    resetBtn: text.resetButton,
  };

  Object.entries(labels).forEach(([elementId, label]) => {
    document.getElementById(elementId).textContent = label;
  });

  document.getElementById("newIcon").placeholder = text.iconPlaceholder;
  document.getElementById("newTitle").placeholder = text.namePlaceholder;
  document.getElementById("newOptions").placeholder = text.optionsPlaceholder;
  document.getElementById("notesInput").placeholder = text.notesPlaceholder;
  document.getElementById("categoriesContainer").setAttribute("aria-label", text.categoriesLabel);
  document.getElementById("langEs").classList.toggle("active", currentLanguage === "es");
  document.getElementById("langEn").classList.toggle("active", currentLanguage === "en");
  document.documentElement.lang = currentLanguage;
}

function getCategoryState(category) {
  if (!categoryState[category.id]) {
    categoryState[category.id] = {
      stars: category.defaultStars || (category.type === "stars" ? 3 : 0),
      selectedIndex: [],
    };
  }

  return categoryState[category.id];
}

function renderCategories() {
  const container = document.getElementById("categoriesContainer");
  container.replaceChildren();

  categories.forEach((category) => {
    const isCustom = !defaultCategories.some(
      (defaultCategory) => defaultCategory.id === category.id,
    );
    container.append(
      createCategoryCard(
        category,
        getCategoryState(category),
        currentLanguage,
        getText(),
        isCustom,
      ),
    );
  });

  updatePreview();
}

function updateStarRating(categoryId, value) {
  categoryState[categoryId].stars = value;

  const rating = document.querySelector(
    `.star-rating [data-category-id="${CSS.escape(categoryId)}"]`,
  )?.parentElement;
  if (!rating) {
    return;
  }

  rating.setAttribute("aria-label", getText().starRating.replace("{count}", value));
  rating.querySelectorAll(".star").forEach((star) => {
    const isActive = Number(star.dataset.value) <= value;
    star.classList.toggle("active", isActive);
    star.setAttribute("aria-pressed", String(Number(star.dataset.value) === value));
  });

  updatePreview();
}

function addCustomCategory(event) {
  event.preventDefault();
  const title = document.getElementById("newTitle").value.trim();
  const icon = document.getElementById("newIcon").value.trim() || "📌";
  const type = document.getElementById("newType").value;
  const rawOptions = document.getElementById("newOptions").value.trim();

  if (!title) {
    return;
  }

  const category = {
    id: `custom_${Date.now()}`,
    title,
    icon,
    type,
    options:
      type === "options"
        ? rawOptions.split(",").map((option) => option.trim()).filter(Boolean)
        : [],
  };

  categories.push(category);
  saveCategories();
  document.getElementById("addCategoryForm").reset();
  document.getElementById("newOptions").hidden = true;
  renderCategories();
}

function deleteCustomCategory(categoryId) {
  categories = categories.filter((category) => category.id !== categoryId);
  delete categoryState[categoryId];
  saveCategories();
  renderCategories();
}

function generateStarsString(count) {
  return "★".repeat(count) + "☆".repeat(5 - count);
}

function updatePreview() {
  if (!document.getElementById("outputPreview")) {
    return;
  }

  const text = getText();
  let bbcode = "[table]\n";
  bbcode += `[tr][th]${text.tableCategory}[/th][th]${text.tableRating}[/th][/tr]\n`;

  categories.forEach((category) => {
    const state = getCategoryState(category);
    let evaluation = "";

    if (category.type === "stars") {
      evaluation = generateStarsString(state.stars);
    } else {
      const options = getCategoryOptions(category, currentLanguage);
      const selectedOptions = [...state.selectedIndex]
        .sort((firstIndex, secondIndex) => firstIndex - secondIndex)
        .map((index) => options[index])
        .filter(Boolean);
      evaluation = selectedOptions.length > 0 ? selectedOptions.join(", ") : "---";
    }

    bbcode += `[tr][td]${category.icon || "📌"} ${getCategoryTitle(category, currentLanguage)}[/td][td]${evaluation}[/td][/tr]\n`;
  });

  bbcode += "[/table]";

  const notes = document.getElementById("notesInput").value.trim();
  if (notes) {
    bbcode += `\n\n[h1]${text.summaryHeader}[/h1]\n${notes}`;
  }

  document.getElementById("outputPreview").value = bbcode;
}

function resetReview() {
  document.getElementById("notesInput").value = "";
  categories.forEach((category) => {
    const state = getCategoryState(category);
    state.stars = category.defaultStars || (category.type === "stars" ? 3 : 0);
    state.selectedIndex = [];
  });
  renderCategories();
}

async function copyPreview() {
  const status = document.getElementById("actionStatus");
  try {
    await navigator.clipboard.writeText(document.getElementById("outputPreview").value);
    status.textContent = getText().copied;
    window.setTimeout(() => {
      status.textContent = "";
    }, 2000);
  } catch (error) {
    console.error("Could not copy the review to the clipboard.", error);
    status.textContent = getText().copyError;
  }
}

function setupEvents() {
  document.getElementById("langEs").addEventListener("click", () => {
    currentLanguage = "es";
    localStorage.setItem(languageStorageKey, currentLanguage);
    updateLanguageUI();
    renderCategories();
  });

  document.getElementById("langEn").addEventListener("click", () => {
    currentLanguage = "en";
    localStorage.setItem(languageStorageKey, currentLanguage);
    updateLanguageUI();
    renderCategories();
  });

  document.getElementById("newType").addEventListener("change", (event) => {
    document.getElementById("newOptions").hidden = event.target.value !== "options";
  });

  document.getElementById("addCategoryForm").addEventListener("submit", addCustomCategory);

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const star = target.closest(".star");
    if (star) {
      updateStarRating(star.dataset.categoryId, Number(star.dataset.value));
      return;
    }

    const deleteButton = target.closest("[data-delete-category]");
    if (deleteButton) {
      deleteCustomCategory(deleteButton.dataset.deleteCategory);
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") {
      return;
    }

    const state = categoryState[target.dataset.categoryId];
    const optionIndex = Number(target.dataset.optionIndex);
    if (target.checked && !state.selectedIndex.includes(optionIndex)) {
      state.selectedIndex.push(optionIndex);
    } else if (!target.checked) {
      state.selectedIndex = state.selectedIndex.filter((index) => index !== optionIndex);
    }

    updatePreview();
  });

  document.getElementById("notesInput").addEventListener("input", updatePreview);
  document.getElementById("copyBtn").addEventListener("click", copyPreview);
  document.getElementById("resetBtn").addEventListener("click", resetReview);
}

async function initializeApp() {
  try {
    await loadComponents();
    if (!Object.hasOwn(translations, currentLanguage)) {
      currentLanguage = "es";
    }
    loadCategories();
    updateLanguageUI();
    renderCategories();
    setupEvents();
  } catch (error) {
    console.error("Could not start the Steam Review Generator.", error);
    const errorMessage = document.getElementById("appError");
    errorMessage.textContent =
      "The app could not start. Run it through a local web server and check the browser console for details.";
    errorMessage.hidden = false;
  }
}

initializeApp();

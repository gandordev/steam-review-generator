export function getCategoryTitle(category, language) {
  if (typeof category.title === "object" && category.title !== null) {
    return category.title[language] || category.title.es || category.title.en || "";
  }

  return category.title;
}

export function getCategoryOptions(category, language) {
  if (Array.isArray(category.options)) {
    return category.options;
  }

  if (typeof category.options === "object" && category.options !== null) {
    return (
      category.options[language] ||
      category.options.es ||
      category.options.en ||
      []
    );
  }

  return [];
}

export function createCategoryCard(
  category,
  categoryState,
  language,
  text,
  isCustom,
) {
  const card = document.createElement("article");
  card.className = "card category-card";

  const header = document.createElement("div");
  header.className = "card-header category-card-header";

  const title = document.createElement("h2");
  title.className = "card-title category-card-title";
  title.textContent = `${category.icon || "📌"} ${getCategoryTitle(category, language)}`;
  header.append(title);

  const actions = document.createElement("div");
  actions.className = "category-card-actions";

  if (category.type === "stars") {
    const rating = document.createElement("div");
    rating.className = "star-rating";
    rating.setAttribute("role", "group");
    rating.setAttribute("aria-label", text.starRating.replace("{count}", categoryState.stars));

    for (let value = 1; value <= 5; value += 1) {
      const star = document.createElement("button");
      star.className = `star${value <= categoryState.stars ? " active" : ""}`;
      star.type = "button";
      star.dataset.categoryId = category.id;
      star.dataset.value = String(value);
      star.setAttribute("aria-label", text.starRating.replace("{count}", value));
      star.setAttribute("aria-pressed", String(value === categoryState.stars));
      star.textContent = "★";
      rating.append(star);
    }

    actions.append(rating);
  }

  if (isCustom) {
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.deleteCategory = category.id;
    deleteButton.title = text.deleteCategory;
    deleteButton.setAttribute("aria-label", `${text.deleteCategory}: ${getCategoryTitle(category, language)}`);
    deleteButton.textContent = "🗑️";
    actions.append(deleteButton);
  }

  header.append(actions);
  card.append(header);

  const options = getCategoryOptions(category, language);
  if (options.length > 0) {
    const optionsList = document.createElement("div");
    optionsList.className = "options-list";

    options.forEach((option, index) => {
      const label = document.createElement("label");
      label.className = "checkbox-label";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.categoryId = category.id;
      checkbox.dataset.optionIndex = String(index);
      checkbox.checked = categoryState.selectedIndex.includes(index);

      label.append(checkbox, document.createTextNode(option));
      optionsList.append(label);
    });

    card.append(optionsList);
  }

  return card;
}

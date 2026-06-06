// Rendering Service Module

/**
 * Check if an item matches the selected dietary filters.
 */
function matchesDiets(item, selectedDiets) {
  if (!selectedDiets || selectedDiets.length === 0) return true;
  
  const itemDiets = item.diets || [];
  const tags = (item.specialtiesTags || item.specialties || []).map(t => t.toLowerCase());
  const category = (item.category || item.specialty || "").toLowerCase();
  const title = (item.title || "").toLowerCase();
  const desc = (item.bio || item.tagline || item.details || "").toLowerCase();

  return selectedDiets.every(diet => {
    const d = diet.toLowerCase();
    
    // Explicit array match
    if (itemDiets.some(id => id.toLowerCase() === d)) return true;
    
    // Fallback checks
    if (d === "vegan") {
      if (tags.includes("vegan") || tags.includes("plant-based") || category === "vegan") return true;
      if (title.includes("vegan") || desc.includes("vegan")) return true;
    }
    if (d === "vegetarian") {
      if (tags.includes("vegetarian") || tags.includes("vegan") || tags.includes("plant-based") || category === "vegan" || category === "vegetarian") return true;
      if (title.includes("vegetarian") || desc.includes("vegetarian") || title.includes("vegan") || desc.includes("vegan")) return true;
    }
    if (d === "gluten-free") {
      if (tags.includes("gluten-free") || category === "gluten-free") return true;
      if (title.includes("gluten-free") || desc.includes("gluten-free") || desc.includes("gf")) return true;
    }
    if (d === "dairy-free") {
      if (tags.includes("dairy-free") || tags.includes("vegan") || category === "vegan" || category === "dairy-free") return true;
      if (title.includes("dairy-free") || desc.includes("dairy-free")) return true;
    }
    if (d === "nut-free") {
      if (tags.includes("nut-free") || category === "nut-free") return true;
      if (title.includes("nut-free") || desc.includes("nut-free")) return true;
    }
    return false;
  });
}

/**
 * Filter and render chef listings.
 */
export function renderChefs(chefs, currentFilters, elements, onChefClick) {
  elements.chefsGrid.innerHTML = "";
  
  const filteredChefs = chefs.filter(chef => {
    const matchesSearch = chef.name.toLowerCase().includes(currentFilters.search) || 
                          chef.tagline.toLowerCase().includes(currentFilters.search) ||
                          chef.specialty.toLowerCase().includes(currentFilters.search) ||
                          chef.specialtiesTags.some(t => t.toLowerCase().includes(currentFilters.search));
    
    const matchesSpecialty = currentFilters.specialty === "all" || chef.specialty === currentFilters.specialty;
    const matchesCost = currentFilters.cost === "all" || chef.costType === currentFilters.cost;
    const matchesRating = chef.rating >= currentFilters.rating;
    
    const matchesDiet = matchesDiets(chef, currentFilters.diets);
    
    return matchesSearch && matchesSpecialty && matchesCost && matchesRating && matchesDiet;
  });

  if (elements.chefsCountBadge) {
    elements.chefsCountBadge.textContent = filteredChefs.length;
  }

  if (filteredChechefsCount(filteredChefs, elements)) return;

  filteredChefs.forEach(chef => {
    const card = document.createElement("div");
    card.className = "chef-card";
    card.setAttribute("data-id", chef.id);
    
    const costBadge = "";

    // Render inferred dietary tags
    let dietBadges = "";
    if (chef.specialty === "Vegan") dietBadges += `<span class="dietary-badge vegan" style="margin-top: 0.35rem; display: inline-block; font-size: 0.65rem;">Vegan</span>`;
    if (chef.specialtiesTags.some(t => t.toLowerCase().includes("gluten-free"))) {
      dietBadges += `<span class="dietary-badge gluten-free" style="margin-top: 0.35rem; display: inline-block; font-size: 0.65rem; margin-left: 0.25rem;">Gluten-Free</span>`;
    }

    card.innerHTML = `
      <div class="chef-card-header">
        <div class="chef-avatar">
          ${chef.avatar}
          <span class="status-pulse"></span>
        </div>
        ${costBadge}
      </div>
      <div class="chef-info">
        <h3>${chef.name}</h3>
        <span class="chef-specialty-tag">${chef.specialty} Cooking</span>
        <p class="chef-tagline">${chef.tagline}</p>
        <div class="recipe-allergen-badges">${dietBadges}</div>
      </div>
      <div class="chef-card-meta">
        <span>⭐ ${chef.rating.toFixed(1)} (${chef.reviewsCount} reviews)</span>
        <span>📍 ${chef.location}</span>
      </div>
    `;
    
    card.addEventListener("click", () => onChefClick(chef));
    elements.chefsGrid.appendChild(card);
  });
}

function filteredChechefsCount(filtered, elements) {
  if (filtered.length === 0) {
    elements.chefsGrid.style.display = "none";
    elements.chefsEmpty.style.display = "block";
    return true;
  }
  elements.chefsGrid.style.display = "grid";
  elements.chefsEmpty.style.display = "none";
  return false;
}

/**
 * Filter and render community requests.
 */
export function renderRequests(requests, currentFilters, elements, onOfferHelp) {
  elements.requestsGrid.innerHTML = "";
  
  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(currentFilters.search) || 
                          req.details.toLowerCase().includes(currentFilters.search) || 
                          req.name.toLowerCase().includes(currentFilters.search);
                          
    const matchesSpecialty = currentFilters.specialty === "all" || req.specialty === currentFilters.specialty;
    
    let matchesCost = true;
    if (currentFilters.cost === "free") {
      matchesCost = req.budgetType === "free";
    } else if (currentFilters.cost === "paid") {
      matchesCost = req.budgetType === "paid";
    }
    
    const matchesDiet = matchesDiets(req, currentFilters.diets);
    
    return matchesSearch && matchesSpecialty && matchesCost && matchesDiet;
  });

  elements.requestsCountBadge.textContent = filteredRequests.length;

  if (filteredRequests.length === 0) {
    elements.requestsGrid.style.display = "none";
    elements.requestsEmpty.style.display = "block";
  } else {
    elements.requestsGrid.style.display = "grid";
    elements.requestsEmpty.style.display = "none";
    
    filteredRequests.forEach(req => {
      const card = document.createElement("div");
      card.className = "request-card";
      
      const budgetBadge = req.budgetType === "free"
        ? `<span class="request-compensation free">Skill Swap</span>`
        : `<span class="request-compensation paid">Paid Help</span>`;

      card.innerHTML = `
        <div class="request-details">
          <div class="request-meta-header">
            ${budgetBadge}
            <span class="badge" style="margin-bottom: 0; padding: 0.15rem 0.6rem; font-size: 0.7rem;">${req.specialty}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">📍 ${req.location}</span>
          </div>
          <h3 class="request-title">${req.title}</h3>
          <p class="request-desc">${req.details}</p>
          <div class="request-footer">
            <span>Posted by: <strong>${req.name}</strong></span>
            <span>${req.date}</span>
          </div>
        </div>
        <button class="btn btn-secondary contact-request-btn" data-name="${req.name}">Offer Help</button>
      `;
      
      card.querySelector(".contact-request-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        onOfferHelp(req);
      });
      
      elements.requestsGrid.appendChild(card);
    });
  }
}

/**
 * Filter and render recipe swap library.
 */
export function renderRecipes(recipes, currentFilters, elements, onRecipeClick, onFavoriteClick, savedRecipeIds = new Set()) {
  elements.recipesGrid.innerHTML = "";
  
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(currentFilters.search) || 
                          recipe.chefName.toLowerCase().includes(currentFilters.search) ||
                          recipe.category.toLowerCase().includes(currentFilters.search) ||
                          (recipe.ingredients && recipe.ingredients.some(ing => ing.toLowerCase().includes(currentFilters.search)));
                          
    const matchesSpecialty = currentFilters.specialty === "all" || recipe.category === currentFilters.specialty;
    const matchesDiet = matchesDiets(recipe, currentFilters.diets);
    const matchesSaved = !currentFilters.showSavedOnly || savedRecipeIds.has(recipe.id);
    
    return matchesSearch && matchesSpecialty && matchesDiet && matchesSaved;
  });

  if (elements.recipesCountBadge) {
    elements.recipesCountBadge.textContent = filteredRecipes.length;
  }

  if (filteredRecipes.length === 0) {
    elements.recipesGrid.style.display = "none";
    elements.recipesEmpty.style.display = "block";
  } else {
    elements.recipesGrid.style.display = "grid";
    elements.recipesEmpty.style.display = "none";
    
    filteredRecipes.forEach(recipe => {
      const card = document.createElement("div");
      card.className = "chef-card recipe-card-item";
      card.setAttribute("data-id", recipe.id);
      card.style.position = "relative";
      
      // Inferred dietary badges
      let badgesHTML = "";
      if (recipe.category === "Vegan" || recipe.title.toLowerCase().includes("vegan")) {
        badgesHTML += `<span class="dietary-badge vegan">Vegan</span>`;
      }
      if (recipe.category === "Baking" && recipe.title.toLowerCase().includes("sourdough")) {
        badgesHTML += `<span class="dietary-badge vegan">Vegan</span>`;
      }
      if (recipe.title.toLowerCase().includes("gluten-free") || (recipe.ingredients && recipe.ingredients.some(i => i.toLowerCase().includes("gluten-free")))) {
        badgesHTML += `<span class="dietary-badge gluten-free" style="margin-left: 0.25rem;">Gluten-Free</span>`;
      }

      const isFav = savedRecipeIds.has(recipe.id);
      
      card.innerHTML = `
        <button class="recipe-favorite-btn ${isFav ? "is-active" : ""}" aria-label="Favorite recipe">
          ❤
        </button>
        <div class="chef-card-header">
          <div class="chef-avatar" style="background: var(--bg-primary); font-size: 2rem; box-shadow: none;">
            ${recipe.emoji || "🍕"}
          </div>
          <span class="chef-cost-badge free" style="background: rgba(255, 111, 89, 0.1); color: var(--accent-color);">${recipe.category}</span>
        </div>
        <div class="chef-info" style="flex-grow: 1;">
          <h3 style="margin-top: 0.5rem; font-size: 1.15rem; line-height: 1.3;">${recipe.title}</h3>
          <span class="chef-specialty-tag" style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-bottom: 0.5rem; display: block;">by ${recipe.chefName}</span>
          <div class="recipe-allergen-badges">${badgesHTML}</div>
        </div>
        <div class="chef-card-meta" style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem; font-size: 0.8rem;">
          <span>⏱ ${recipe.cookTime}</span>
          <span>👥 ${recipe.servings} servings</span>
        </div>
      `;
      
      // Heart bookmark action
      card.querySelector(".recipe-favorite-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        onFavoriteClick(recipe.id, !isFav);
      });
      
      // Main card click details
      card.addEventListener("click", () => onRecipeClick(recipe));
      elements.recipesGrid.appendChild(card);
    });
  }
}

/**
 * Render a list of user reviews inside the reviews container.
 */
export function renderReviews(reviews, container) {
  container.innerHTML = "";
  if (reviews.length === 0) {
    container.innerHTML = `<p style="font-size: 0.9rem; color: var(--text-muted); text-align: center; padding: 1rem;">No reviews yet. Be the first to leave a review!</p>`;
    return;
  }
  
  reviews.forEach(r => {
    const card = document.createElement("div");
    card.className = "review-item-card";
    
    const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
    
    card.innerHTML = `
      <div class="review-item-header">
        <span class="review-item-author">${r.reviewerName}</span>
        <span class="review-item-stars">${stars}</span>
      </div>
      <p class="review-item-comment">${r.comment}</p>
    `;
    container.appendChild(card);
  });
}

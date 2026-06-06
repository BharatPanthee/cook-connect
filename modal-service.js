// Modal Service Module

/**
 * Populate and display details for a selected chef helper.
 * @param {Object} chef - The chef object.
 * @param {Object} elements - UI elements context for the details modal.
 */
export function openChefModal(chef, elements) {
  if (!chef) return;
  
  elements.chefModalTitle.textContent = chef.name;
  elements.modalChefAvatar.textContent = chef.avatar;
  elements.modalChefTagline.textContent = `${chef.specialty} Cooking Specialist`;
  elements.modalChefRating.innerHTML = `⭐ ${chef.rating.toFixed(1)} <span style="color: var(--text-muted); font-weight: 500;">(${chef.reviewsCount} reviews)</span>`;
  elements.modalChefBio.textContent = chef.bio;
  elements.modalChefLocation.textContent = chef.location;
  elements.modalChefAvailability.textContent = chef.availability;
  elements.modalChefType.textContent = chef.serviceType;
  
  const priceValueEl = elements.modalChefPrice;
  if (chef.costType === "free") {
    priceValueEl.textContent = "Free / Swap";
    priceValueEl.style.color = "var(--success-color)";
  } else {
    priceValueEl.textContent = `$${chef.rate}/hr`;
    priceValueEl.style.color = "var(--text-primary)";
  }

  // Render Tags
  elements.tagsContainer.innerHTML = "";
  chef.specialtiesTags.forEach(tag => {
    const tagSpan = document.createElement("span");
    tagSpan.className = "modal-tag";
    tagSpan.textContent = tag;
    elements.tagsContainer.appendChild(tagSpan);
  });

  // Render Portfolio Images
  elements.portfolioContainer.innerHTML = "";
  chef.portfolio.forEach(item => {
    const portfolioDiv = document.createElement("div");
    portfolioDiv.className = "portfolio-item";
    portfolioDiv.innerHTML = `
      <img src="${item.img}" alt="${item.caption}">
      <div class="portfolio-caption">${item.caption}</div>
    `;
    elements.portfolioContainer.appendChild(portfolioDiv);
  });

  elements.chefModal.showModal();
}

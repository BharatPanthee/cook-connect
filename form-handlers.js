// Form Handlers Module

import { registerChefListing, registerCookingRequest } from "./registration-service.js";

/**
 * Handle form submission for adding a new cook listing.
 * @param {Object} currentUser - The currently logged-in user.
 * @param {Object} context - Callbacks and elements needed to update the UI.
 */
export async function addNewCook(currentUser, context) {
  if (!currentUser) return;

  const name = document.getElementById("cook-name").value.trim();
  const specialty = document.getElementById("cook-specialty").value;
  const costType = document.getElementById("cook-rate-type").value;
  const rate = parseInt(document.getElementById("cook-rate").value) || 0;
  const tagline = document.getElementById("cook-tagline").value.trim();
  const bio = document.getElementById("cook-bio").value.trim();
  const location = document.getElementById("cook-location").value.trim();
  const avatar = document.getElementById("cook-avatar-emoji").value;

  try {
    // Save to Firestore and sync user role using registration service
    await registerChefListing(currentUser.uid, {
      name,
      specialty,
      costType,
      rate,
      tagline,
      bio,
      location,
      avatar
    });

    // Update currentUser state role locally
    currentUser.role = "cook";
    context.updateAuthUI();

    // Re-fetch and render listings
    await context.fetchAndRenderChefs();

    context.becomeCookForm.reset();
    context.becomeCookModal.close();

    // Scroll to explore
    const exploreEl = document.getElementById("explore");
    if (exploreEl) {
      exploreEl.scrollIntoView();
    }

    alert(`Congratulations ${name}! Your chef helper listing has been created successfully.`);
  } catch (error) {
    console.error("Failed to save chef listing:", error);
    alert(`Failed to save listing: ${error.message}`);
  }
}

/**
 * Handle form submission for posting a new cooking request.
 * @param {Object} currentUser - The currently logged-in user.
 * @param {Object} context - Callbacks and elements needed to update the UI.
 */
export async function addNewRequest(currentUser, context) {
  if (!currentUser) return;

  const title = document.getElementById("req-title").value.trim();
  const name = document.getElementById("req-name").value.trim();
  const budgetOption = document.getElementById("req-budget").value;
  const details = document.getElementById("req-desc").value.trim();
  const location = document.getElementById("req-location").value.trim();
  const specialty = document.getElementById("req-specialty").value;

  try {
    await registerCookingRequest(currentUser.uid, {
      title,
      name,
      budgetOption,
      details,
      location,
      specialty
    });

    // Re-fetch and render requests
    await context.fetchAndRenderRequests();

    context.postRequestForm.reset();
    context.becomeRequestModal.close();

    // Switch to requests tab
    context.switchTab("requests-view");

    alert("Your cooking help request has been posted to the Community Board.");
  } catch (error) {
    console.error("Failed to save cooking request:", error);
    alert(`Failed to post request: ${error.message}`);
  }
}

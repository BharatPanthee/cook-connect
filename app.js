// CookConnect Application Logic

// Import service modules (Separation of Concerns)
import { subscribeToAuthChanges } from "./auth-service.js";
import { 
  getChefs, 
  getRequests,
  getRecipes,
  getUserProfile,
  toggleRecipeFavorite,
  getReviews,
  reportContent,
  blockUser,
  unblockUser
} from "./db-service.js";
import { 
  addNewCook, 
  addNewRequest 
} from "./form-handlers.js";
import { addNewRecipe } from "./recipe-handlers.js";
import { 
  handleRegister, 
  handleSignin, 
  handleSignout, 
  updateAuthUI, 
  switchAuthPane 
} from "./auth-handlers.js";
import { renderChefs, renderRequests, renderRecipes, renderReviews } from "./render-service.js";
import { openChefModal } from "./modal-service.js";

import { INITIAL_CHEFS, INITIAL_REQUESTS, INITIAL_RECIPES } from "./mock-data.js";
import { initTheme, toggleTheme } from "./theme-service.js";
import { 
  initChat, 
  startChefChat, 
  startRequestChat, 
  sendChatMessage, 
  setCurrentUser,
  handleAuthChange 
} from "./chat-service.js";
import { handleReviewSubmit } from "./review-handlers.js";


// Auth State
let currentUser = null;

// App State
let chefs = [];
let requests = [];
let recipes = [];
let currentFilters = {
  search: "",
  specialty: "all",
  cost: "all",
  rating: 0,
  diets: [],
  showSavedOnly: false
};
let activeChef = null;
let activeRecipe = null;
let reportTarget = null;
let savedRecipes = new Set();

// DOM Elements
const chefsGrid = document.getElementById("chefs-grid");
const chefsEmpty = document.getElementById("chefs-empty");
const requestsGrid = document.getElementById("requests-grid");
const requestsEmpty = document.getElementById("requests-empty");
const requestsCountBadge = document.getElementById("requests-count");
const recipesGrid = document.getElementById("recipes-grid");
const recipesEmpty = document.getElementById("recipes-empty");

const searchInput = document.getElementById("search-input");
const specialtyFilter = document.getElementById("specialty-filter");
const ratingFilter = document.getElementById("rating-filter");
const costToggleBtns = document.querySelectorAll(".toggle-btn");

const themeToggle = document.getElementById("theme-toggle");
const navLinks = document.querySelectorAll(".nav-links a, .nav-link");
const tabTriggers = document.querySelectorAll(".tab-trigger");
const tabPanes = document.querySelectorAll(".tab-pane");

// Modals
const chefModal = document.getElementById("chef-modal");
const chatModal = document.getElementById("chat-modal");
const becomeCookModal = document.getElementById("become-cook-modal");
const becomeRequestModal = document.getElementById("become-request-modal");
const authModal = document.getElementById("auth-modal");
const recipeModal = document.getElementById("recipe-modal");
const becomeRecipeModal = document.getElementById("become-recipe-modal");

// Forms
const becomeCookForm = document.getElementById("become-cook-form");
const postRequestForm = document.getElementById("post-request-form");
const postRecipeForm = document.getElementById("post-recipe-form");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessagesContainer = document.getElementById("chat-messages");
const chatSuggestions = document.getElementById("chat-suggestions");

const signinForm = document.getElementById("signin-form");
const registerForm = document.getElementById("register-form");
const signinError = document.getElementById("signin-error");
const registerError = document.getElementById("register-error");

// Buttons & Actions
const becomeHelperBtn = document.getElementById("become-helper-btn");
const heroBecomeHelperBtn = document.getElementById("hero-become-helper");
const postRequestBtn = document.getElementById("post-request-btn");
const postRecipeBtn = document.getElementById("post-recipe-btn");
const resetChefFiltersBtn = document.getElementById("reset-chef-filters");
const modalChefChatBtn = document.getElementById("modal-chef-chat-btn");
const modalRecipeBookBtn = document.getElementById("modal-recipe-book-btn");
const authBtn = document.getElementById("auth-btn");
const profileTrigger = document.getElementById("profile-trigger");
const signOutBtn = document.getElementById("sign-out-btn");

// Dropdown/Profile elements
const userProfileMenu = document.getElementById("user-profile-menu");
const profileDropdown = document.getElementById("profile-dropdown");
const userAvatarBadge = document.getElementById("user-avatar-badge");
const userNameBadge = document.getElementById("user-name-badge");
const dropdownUserName = document.getElementById("dropdown-user-name");
const dropdownUserRole = document.getElementById("dropdown-user-role");

// Close Modals buttons
const closeChefModalBtn = document.getElementById("close-chef-modal");
const closeChatModalBtn = document.getElementById("close-chat-modal");
const closeBecomeModalBtn = document.getElementById("close-become-modal");
const closeRequestModalBtn = document.getElementById("close-request-modal");
const closeRecipeModalBtn = document.getElementById("close-recipe-modal");
const closeBecomeRecipeModalBtn = document.getElementById("close-become-recipe-modal");
const closeAuthModalBtn = document.getElementById("close-auth-modal");
const reportModal = document.getElementById("report-modal");
const closeReportModalBtn = document.getElementById("close-report-modal");
const reportContentForm = document.getElementById("report-content-form");
const reportChefBtn = document.getElementById("report-chef-btn");
const reportRecipeBtn = document.getElementById("report-recipe-btn");
const tabSigninBtn = document.getElementById("tab-signin-btn");
const tabRegisterBtn = document.getElementById("tab-register-btn");

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initAuth();
  initChat({
    chatModal,
    chatMessagesContainer,
    chatInput,
    chatScheduleMeetBtn: document.getElementById("chat-schedule-meet-btn"),
    scheduleMeetModal: document.getElementById("schedule-meet-modal"),
    scheduleMeetForm: document.getElementById("schedule-meet-form"),
    meetTopicInput: document.getElementById("meet-topic"),
    meetDateInput: document.getElementById("meet-date"),
    meetTimeInput: document.getElementById("meet-time"),
    closeScheduleMeetBtn: document.getElementById("close-schedule-meet-modal")
  });
  fetchAndRenderChefs();
  fetchAndRenderRequests();
  fetchAndRenderRecipes();
  setupEventListeners();
  setupModalDismissFallbacks();
});



// Event Listeners
function setupEventListeners() {
  // Theme
  themeToggle.addEventListener("click", toggleTheme);

  // Tabs
  tabTriggers.forEach(trigger => {
    trigger.addEventListener("click", (e) => {
      const targetId = trigger.getAttribute("data-target");
      switchTab(targetId);
    });
  });

  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      const tabName = link.getAttribute("data-tab");
      if (tabName === "browse") {
        switchTab("browse-view");
      } else if (tabName === "requests") {
        switchTab("requests-view");
      } else if (tabName === "recipes") {
        switchTab("recipes-view");
      }
    });
  });

  // Filters
  searchInput.addEventListener("input", (e) => {
    currentFilters.search = e.target.value.toLowerCase().trim();
    callRenderChefs();
    callRenderRequests();
    callRenderRecipes();
  });

  specialtyFilter.addEventListener("change", (e) => {
    currentFilters.specialty = e.target.value;
    callRenderChefs();
    callRenderRequests();
    callRenderRecipes();
  });

  ratingFilter.addEventListener("change", (e) => {
    currentFilters.rating = parseFloat(e.target.value);
    callRenderChefs();
  });

  costToggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      costToggleBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilters.cost = btn.getAttribute("data-cost");
      callRenderChefs();
      callRenderRequests();
      callRenderRecipes();
    });
  });

  resetChefFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    specialtyFilter.value = "all";
    ratingFilter.value = "0";
    costToggleBtns.forEach(b => b.classList.remove("active"));
    costToggleBtns[0].classList.add("active");

    // Reset dietary checkboxes
    document.querySelectorAll(".diet-filter").forEach(cb => {
      cb.checked = false;
    });

    // Reset saved recipes button
    const toggleSavedRecipesBtn = document.getElementById("toggle-saved-recipes-btn");
    if (toggleSavedRecipesBtn) {
      toggleSavedRecipesBtn.classList.remove("active");
      toggleSavedRecipesBtn.innerHTML = `<span>💖</span> Saved Recipes`;
    }

    currentFilters = {
      search: "",
      specialty: "all",
      cost: "all",
      rating: 0,
      diets: [],
      showSavedOnly: false
    };
    callRenderChefs();
    callRenderRecipes();
    callRenderRequests();
  });

  // Dietary checkboxes
  document.querySelectorAll(".diet-filter").forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const selected = [];
      document.querySelectorAll(".diet-filter:checked").forEach(cb => {
        selected.push(cb.value);
      });
      currentFilters.diets = selected;
      callRenderChefs();
      callRenderRequests();
      callRenderRecipes();
    });
  });

  // Toggle saved recipes button
  const toggleSavedRecipesBtn = document.getElementById("toggle-saved-recipes-btn");
  if (toggleSavedRecipesBtn) {
    toggleSavedRecipesBtn.addEventListener("click", () => {
      if (!currentUser) {
        alert("Please sign in to view saved recipes!");
        callSwitchAuthPane("signin-pane");
        authModal.showModal();
        return;
      }
      currentFilters.showSavedOnly = !currentFilters.showSavedOnly;
      if (currentFilters.showSavedOnly) {
        toggleSavedRecipesBtn.classList.add("active");
        toggleSavedRecipesBtn.innerHTML = `<span>💖</span> All Recipes`;
      } else {
        toggleSavedRecipesBtn.classList.remove("active");
        toggleSavedRecipesBtn.innerHTML = `<span>💖</span> Saved Recipes`;
      }
      callRenderRecipes();
    });
  }

  // Review Form Submit Handler
  const writeReviewForm = document.getElementById("write-review-form");
  if (writeReviewForm) {
    writeReviewForm.addEventListener("submit", (e) => {
      const elements = {
        reviewsListContainer: document.getElementById("modal-chef-reviews-list"),
        avgScoreEl: document.getElementById("modal-chef-avg-score"),
        avgStarsEl: document.getElementById("modal-chef-avg-stars"),
        reviewCountEl: document.getElementById("modal-chef-review-count")
      };
      handleReviewSubmit(e, currentUser, activeChef, elements, () => {
        fetchAndRenderChefs();
      });
    });
  }

  // Review signin redirect link
  const reviewSigninLink = document.getElementById("review-signin-link");
  if (reviewSigninLink) {
    reviewSigninLink.addEventListener("click", (e) => {
      e.preventDefault();
      callSwitchAuthPane("signin-pane");
      authModal.showModal();
    });
  }

  // Modal Open Triggering (Auth-Gated)
  becomeHelperBtn.addEventListener("click", () => {
    if (!currentUser) {
      callSwitchAuthPane("signin-pane");
      authModal.showModal();
    } else {
      becomeCookModal.showModal();
    }
  });

  if (heroBecomeHelperBtn) {
    heroBecomeHelperBtn.addEventListener("click", () => {
      if (!currentUser) {
        callSwitchAuthPane("signin-pane");
        authModal.showModal();
      } else {
        becomeCookModal.showModal();
      }
    });
  }

  postRequestBtn.addEventListener("click", () => {
    if (!currentUser) {
      callSwitchAuthPane("signin-pane");
      authModal.showModal();
    } else {
      becomeRequestModal.showModal();
    }
  });

  if (postRecipeBtn) {
    postRecipeBtn.addEventListener("click", () => {
      if (!currentUser) {
        callSwitchAuthPane("signin-pane");
        authModal.showModal();
      } else {
        becomeRecipeModal.showModal();
      }
    });
  }

  // Auth Modal Open/Close
  authBtn.addEventListener("click", () => {
    callSwitchAuthPane("signin-pane");
    authModal.showModal();
  });

  closeAuthModalBtn.addEventListener("click", () => authModal.close());

  // Profile Dropdown Toggle
  profileTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (profileDropdown && !profileDropdown.contains(e.target) && e.target !== profileTrigger) {
      profileDropdown.classList.remove("show");
    }
  });

  // Sign Out
  signOutBtn.addEventListener("click", () => {
    handleSignout();
  });

  // Auth Pane Switching
  tabSigninBtn.addEventListener("click", () => callSwitchAuthPane("signin-pane"));
  tabRegisterBtn.addEventListener("click", () => callSwitchAuthPane("register-pane"));

  // Toggle Password Visibility
  document.querySelectorAll(".toggle-password-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const inputId = btn.getAttribute("data-input");
      const passwordInput = document.getElementById(inputId);
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        btn.textContent = "🙈";
      } else {
        passwordInput.type = "password";
        btn.textContent = "👁️";
      }
    });
  });

  // Auth Form submissions
  signinForm.addEventListener("submit", (e) => {
    handleSignin(e, { signinForm, authModal, signinError });
  });
  registerForm.addEventListener("submit", (e) => {
    handleRegister(e, { registerForm, authModal, registerError });
  });

  // Modal Close buttons
  closeChefModalBtn.addEventListener("click", () => chefModal.close());
  closeChatModalBtn.addEventListener("click", () => chatModal.close());
  closeBecomeModalBtn.addEventListener("click", () => becomeCookModal.close());
  closeRequestModalBtn.addEventListener("click", () => becomeRequestModal.close());
  closeRecipeModalBtn.addEventListener("click", () => recipeModal.close());
  closeBecomeRecipeModalBtn.addEventListener("click", () => becomeRecipeModal.close());
  closeReportModalBtn.addEventListener("click", () => reportModal.close());

  // Become a Cook pricing rate logic toggler
  const rateTypeSelect = document.getElementById("cook-rate-type");
  const rateInputContainer = document.getElementById("cook-rate-container");
  const rateInput = document.getElementById("cook-rate");
  
  rateTypeSelect.addEventListener("change", (e) => {
    if (e.target.value === "free") {
      rateInputContainer.style.display = "none";
      rateInput.value = "0";
      rateInput.removeAttribute("required");
    } else {
      rateInputContainer.style.display = "flex";
      rateInput.setAttribute("required", "true");
      rateInput.value = "25";
    }
  });

  // Form Submissions
  becomeCookForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addNewCook(currentUser, {
      updateAuthUI: callUpdateAuthUI,
      fetchAndRenderChefs,
      becomeCookForm,
      becomeCookModal
    });
  });

  postRequestForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addNewRequest(currentUser, {
      fetchAndRenderRequests,
      postRequestForm,
      becomeRequestModal,
      switchTab
    });
  });

  postRecipeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addNewRecipe(currentUser, {
      fetchAndRenderRecipes,
      postRecipeForm,
      becomeRecipeModal
    });
  });

  // Chat message submission
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendChatMessage();
  });

  // Chat suggestion chips
  chatSuggestions.addEventListener("click", (e) => {
    if (e.target.classList.contains("suggestion-chip")) {
      chatInput.value = e.target.textContent;
      sendChatMessage();
    }
  });

  // Open Chat from Chef Modal
  modalChefChatBtn.addEventListener("click", () => {
    if (activeChef) {
      chefModal.close();
      startChefChat(activeChef);
    }
  });

  // Report button triggers
  reportChefBtn.addEventListener("click", () => {
    if (!currentUser) {
      alert("Please sign in to report profiles.");
      authModal.showModal();
      return;
    }
    if (activeChef) {
      reportTarget = {
        id: activeChef.id || activeChef.userId,
        type: "chef",
        title: activeChef.name
      };
      chefModal.close();
      reportModal.showModal();
    }
  });

  reportRecipeBtn.addEventListener("click", () => {
    if (!currentUser) {
      alert("Please sign in to report recipes.");
      authModal.showModal();
      return;
    }
    if (activeRecipe) {
      reportTarget = {
        id: activeRecipe.id,
        type: "recipe",
        title: activeRecipe.title
      };
      recipeModal.close();
      reportModal.showModal();
    }
  });

  // Report Submission Form
  reportContentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser || !reportTarget) return;

    const reason = document.getElementById("report-reason").value;
    const details = document.getElementById("report-details").value.trim();

    try {
      await reportContent({
        reporterId: currentUser.uid,
        reporterName: currentUser.name || "User",
        targetId: reportTarget.id,
        targetType: reportTarget.type,
        targetTitle: reportTarget.title,
        reason,
        details
      });
      alert("Thank you. Your report has been submitted to moderators for review.");
      reportModal.close();
      reportContentForm.reset();
      reportTarget = null;
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert(`Error submitting report: ${err.message}`);
    }
  });
}

// Fallback Light Dismiss for browsers not fully supporting closedby="any"
function setupModalDismissFallbacks() {
  const dialogs = [chefModal, chatModal, becomeCookModal, becomeRequestModal, authModal, recipeModal, becomeRecipeModal, reportModal];
  
  // Check if closedBy is natively supported
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialogs.forEach(dialog => {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;

        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );

        if (isDialogContent) return;
        dialog.close();
      });
    });
  }
}

// Tab Switching
function switchTab(targetPaneId) {
  // Update tabs header buttons
  tabTriggers.forEach(btn => {
    if (btn.getAttribute("data-target") === targetPaneId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update navlinks
  navLinks.forEach(link => {
    const tabName = link.getAttribute("data-tab");
    if (targetPaneId === "browse-view" && tabName === "browse") {
      link.classList.add("active");
    } else if (targetPaneId === "requests-view" && tabName === "requests") {
      link.classList.add("active");
    } else if (targetPaneId === "recipes-view" && tabName === "recipes") {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Switch pane
  tabPanes.forEach(pane => {
    if (pane.id === targetPaneId) {
      pane.classList.add("active");
    } else {
      pane.classList.remove("active");
    }
  });
}

// Chef Details Modal Populator Wrapper
async function openChefDetails(chefId) {
  const chef = chefs.find(c => c.id === chefId);
  if (!chef) return;
  activeChef = chef;
  openChefModal(chef, {
    chefModalTitle: document.getElementById("chef-modal-title"),
    modalChefAvatar: document.getElementById("modal-chef-avatar"),
    modalChefTagline: document.getElementById("modal-chef-tagline"),
    modalChefRating: document.getElementById("modal-chef-rating"),
    modalChefBio: document.getElementById("modal-chef-bio"),
    modalChefLocation: document.getElementById("modal-chef-location"),
    modalChefAvailability: document.getElementById("modal-chef-availability"),
    modalChefType: document.getElementById("modal-chef-type"),
    modalChefPrice: document.getElementById("modal-chef-price"),
    tagsContainer: document.getElementById("modal-chef-specialties"),
    portfolioContainer: document.getElementById("modal-chef-portfolio"),
    chefModal
  });

  // Fetch and display reviews
  const reviewForm = document.getElementById("write-review-form");
  const signinNotice = document.getElementById("review-signin-notice");
  const reviewsContainer = document.getElementById("modal-chef-reviews-list");

  // Show loading
  reviewsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 1rem;">Loading reviews...</p>';

  try {
    const reviews = await getReviews(chef.id);
    renderReviews(reviews, reviewsContainer);

    // Update aggregate average UI
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgScore = reviews.length > 0 ? parseFloat((totalRating / reviews.length).toFixed(1)) : chef.rating;
    const starString = "★".repeat(Math.round(avgScore)) + "☆".repeat(5 - Math.round(avgScore));

    document.getElementById("modal-chef-avg-score").textContent = avgScore.toFixed(1);
    document.getElementById("modal-chef-avg-stars").textContent = starString;
    document.getElementById("modal-chef-review-count").textContent = `${reviews.length} reviews`;
  } catch (err) {
    console.error("Failed to fetch reviews:", err);
    reviewsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 1rem;">Failed to load reviews.</p>';
  }

  // Handle Review Form Visibility
  if (currentUser) {
    signinNotice.style.display = "none";
    // If the logged in user is the chef themselves, hide the review form
    if (currentUser.uid === chef.id || currentUser.uid === chef.userId) {
      reviewForm.style.display = "none";
    } else {
      reviewForm.style.display = "flex";
    }
  } else {
    signinNotice.style.display = "block";
    reviewForm.style.display = "none";
  }
}

// Local rendering wrappers
function callRenderChefs() {
  renderChefs(chefs, currentFilters, { 
    chefsGrid, 
    chefsEmpty,
    chefsCountBadge: document.getElementById("chefs-count")
  }, (chef) => {
    openChefDetails(chef.id);
  });
}

function callRenderRequests() {
  renderRequests(requests, currentFilters, { requestsGrid, requestsEmpty, requestsCountBadge }, (req) => {
    startRequestChat(req);
  });
}

function callRenderRecipes() {
  renderRecipes(
    recipes, 
    currentFilters, 
    { 
      recipesGrid, 
      recipesEmpty,
      recipesCountBadge: document.getElementById("recipes-count")
    }, 
    (recipe) => {
      openRecipeDetails(recipe);
    },
    async (recipeId, isFavorite) => {
      if (!currentUser) {
        alert("Please sign in to favorite recipes!");
        callSwitchAuthPane("signin-pane");
        authModal.showModal();
        return;
      }
      try {
        await toggleRecipeFavorite(currentUser.uid, recipeId, isFavorite);
        if (isFavorite) {
          savedRecipes.add(recipeId);
        } else {
          savedRecipes.delete(recipeId);
        }
        callRenderRecipes();
      } catch (err) {
        console.error("Error toggling favorite:", err);
        alert(`Failed to save favorite: ${err.message}`);
      }
    },
    savedRecipes
  );
}

// Recipe Detail Modal Populator
function openRecipeDetails(recipe) {
  if (!recipe) return;
  activeRecipe = recipe;
  
  document.getElementById("modal-recipe-image").textContent = recipe.emoji || "🍝";
  document.getElementById("recipe-modal-title").textContent = recipe.title;
  document.getElementById("modal-recipe-author").textContent = `by ${recipe.chefName}`;
  document.getElementById("modal-recipe-meta").textContent = `⏱ ${recipe.cookTime} | 👥 ${recipe.servings} servings`;
  document.getElementById("modal-recipe-author-name").textContent = recipe.chefName;

  // Render ingredients list
  const ingredientsUl = document.getElementById("modal-recipe-ingredients");
  ingredientsUl.innerHTML = "";
  recipe.ingredients.forEach(ing => {
    const li = document.createElement("li");
    li.textContent = ing;
    ingredientsUl.appendChild(li);
  });

  // Render instructions list
  const instructionsOl = document.getElementById("modal-recipe-instructions");
  instructionsOl.innerHTML = "";
  recipe.instructions.forEach(step => {
    const li = document.createElement("li");
    li.textContent = step;
    instructionsOl.appendChild(li);
  });

  // Setup click handler to book live lesson
  modalRecipeBookBtn.onclick = () => {
    recipeModal.close();
    
    // Find the chef profile
    const authorChef = chefs.find(c => c.id === recipe.chefId || c.name === recipe.chefName);
    
    if (authorChef) {
      startChefChat(authorChef);
    } else {
      // Create a simulated chef object for the poster
      const simulatedChef = {
        id: recipe.chefId || "temp-chef",
        name: recipe.chefName,
        avatar: recipe.emoji || "👨‍🍳",
        costType: "free",
        rate: 0,
        chatReplies: [
          `Hi! Thanks for checking out my recipe for "${recipe.title}". I'd love to help you cook it! When were you thinking of scheduling the call?`,
          "That works great for me. Let's schedule a Google Meet so we can cook together step-by-step!",
          "Sounds like a plan! Looking forward to it."
        ]
      };
      startChefChat(simulatedChef);
    }
    
    // Auto-populate topic in scheduling form
    const meetTopicInput = document.getElementById("meet-topic");
    if (meetTopicInput) {
      meetTopicInput.value = `Cooking Lesson: ${recipe.title}`;
    }
  };

  recipeModal.showModal();
}

// Auth wrappers
function callUpdateAuthUI() {
  updateAuthUI(currentUser, {
    authBtn,
    userProfileMenu,
    userNameBadge,
    dropdownUserName,
    dropdownUserRole,
    userAvatarBadge,
    profileDropdown
  });
}

function callSwitchAuthPane(targetId) {
  switchAuthPane(targetId, {
    signinError,
    registerError
  });
}

// Auth Logic functions
function initAuth() {
  subscribeToAuthChanges(async (user) => {
    currentUser = user;
    setCurrentUser(user);
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          currentUser = { ...user, ...profile };
          setCurrentUser(currentUser);
          savedRecipes = new Set(profile.savedRecipes || []);
        } else {
          savedRecipes = new Set();
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
        savedRecipes = new Set();
      }
    } else {
      savedRecipes = new Set();
    }
    handleAuthChange(currentUser);
    callUpdateAuthUI();
    callRenderRecipes(); // Rerender to update active/inactive hearts
  });
}

async function fetchAndRenderChefs() {
  try {
    const firebaseChefs = await getChefs();
    chefs = [...firebaseChefs, ...INITIAL_CHEFS.filter(c => !firebaseChefs.some(fc => fc.id === c.id))];
  } catch (error) {
    console.error("Error fetching chefs from Firestore:", error);
    chefs = [...INITIAL_CHEFS];
  }
  callRenderChefs();
}

async function fetchAndRenderRequests() {
  try {
    const firebaseRequests = await getRequests();
    requests = [...firebaseRequests, ...INITIAL_REQUESTS.filter(r => !firebaseRequests.some(fr => fr.id === r.id))];
  } catch (error) {
    console.error("Error fetching requests from Firestore:", error);
    requests = [...INITIAL_REQUESTS];
  }
  callRenderRequests();
}

async function fetchAndRenderRecipes() {
  try {
    const firebaseRecipes = await getRecipes();
    recipes = [...firebaseRecipes, ...INITIAL_RECIPES.filter(r => !firebaseRecipes.some(fr => fr.id === r.id))];
  } catch (error) {
    console.error("Error fetching recipes from Firestore:", error);
    recipes = [...INITIAL_RECIPES];
  }
  callRenderRecipes();
}


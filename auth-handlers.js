// Authentication UI Handlers Module

import { registerUser, loginUser, logoutUser } from "./auth-service.js";

/**
 * Handle form submission for registering a new user.
 * @param {Event} e - The submit event.
 * @param {Object} context - Callbacks and elements needed to update the UI.
 */
export async function handleRegister(e, context) {
  e.preventDefault();
  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim().toLowerCase();
  const password = document.getElementById("register-password").value;
  const role = document.getElementById("register-role").value;

  context.registerError.style.display = "none";

  try {
    await registerUser(name, email, password, role);
    context.registerForm.reset();
    context.authModal.close();
    alert(`Welcome to CookConnect, ${name}! Your account has been created.`);
  } catch (error) {
    console.error("Registration failed:", error);
    if (error.code === "auth/email-already-in-use") {
      context.registerError.textContent = "This email is already in use by another account.";
    } else if (error.code === "auth/weak-password") {
      context.registerError.textContent = "The password is too weak. Choose at least 6 characters.";
    } else if (error.code === "auth/invalid-email") {
      context.registerError.textContent = "Please enter a valid email address.";
    } else {
      context.registerError.textContent = `Error: ${error.message}`;
    }
    context.registerError.style.display = "block";
  }
}

/**
 * Handle form submission for signing in a user.
 * @param {Event} e - The submit event.
 * @param {Object} context - Callbacks and elements needed to update the UI.
 */
export async function handleSignin(e, context) {
  e.preventDefault();
  const email = document.getElementById("signin-email").value.trim().toLowerCase();
  const password = document.getElementById("signin-password").value;

  context.signinError.style.display = "none";

  try {
    await loginUser(email, password);
    context.signinForm.reset();
    context.authModal.close();
  } catch (error) {
    console.error("Sign in failed:", error);
    if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
      context.signinError.textContent = "Invalid email or password. Please try again.";
    } else if (error.code === "auth/too-many-requests") {
      context.signinError.textContent = "Access has been temporarily disabled due to many failed login attempts.";
    } else {
      context.signinError.textContent = `Error: ${error.message}`;
    }
    context.signinError.style.display = "block";
  }
}

/**
 * Handle user sign out request.
 */
export async function handleSignout() {
  try {
    await logoutUser();
  } catch (error) {
    console.error("Sign out failed:", error);
  }
}

/**
 * Update UI elements based on authentication state.
 * @param {Object} currentUser - User information object or null.
 * @param {Object} elements - UI elements context object.
 */
export function updateAuthUI(currentUser, elements) {
  if (currentUser) {
    elements.authBtn.style.display = "none";
    elements.userProfileMenu.style.display = "block";
    
    // Set badges
    elements.userNameBadge.textContent = currentUser.name.split(" ")[0];
    elements.dropdownUserName.textContent = currentUser.name;
    elements.dropdownUserRole.textContent = currentUser.role;
    
    // Set avatar badge to first letter of name
    elements.userAvatarBadge.textContent = currentUser.name.charAt(0).toUpperCase();

    // Populate forms with logged-in user name
    const cookNameInput = document.getElementById("cook-name");
    const reqNameInput = document.getElementById("req-name");
    if (cookNameInput) cookNameInput.value = currentUser.name;
    if (reqNameInput) reqNameInput.value = currentUser.name;
  } else {
    elements.authBtn.style.display = "block";
    elements.userProfileMenu.style.display = "none";
    elements.profileDropdown.classList.remove("show");

    // Clear forms
    const cookNameInput = document.getElementById("cook-name");
    const reqNameInput = document.getElementById("req-name");
    if (cookNameInput) cookNameInput.value = "";
    if (reqNameInput) reqNameInput.value = "";
  }
}

/**
 * Switch auth pane panel tabs.
 * @param {string} targetId - Pane ID to switch to.
 * @param {Object} elements - UI elements context object.
 */
export function switchAuthPane(targetId, elements) {
  // Update buttons
  const authTabBtns = document.querySelectorAll(".auth-tab-btn");
  authTabBtns.forEach(btn => {
    if (btn.getAttribute("data-target") === targetId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update panes
  const authPanes = document.querySelectorAll(".auth-pane");
  authPanes.forEach(pane => {
    if (pane.id === targetId) {
      pane.classList.add("active");
    } else {
      pane.classList.remove("active");
    }
  });
  
  // Clear error messages
  elements.signinError.style.display = "none";
  elements.registerError.style.display = "none";
}

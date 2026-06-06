// Recipe Form Submission Handler

import { createRecipe } from "./db-service.js";

/**
 * Handle submission of a new recipe.
 * @param {Object} currentUser - Current logged-in user details.
 * @param {Object} context - App callback and DOM context.
 */
export async function addNewRecipe(currentUser, context) {
  const {
    fetchAndRenderRecipes,
    postRecipeForm,
    becomeRecipeModal
  } = context;

  if (!currentUser) {
    alert("Please sign in to share a recipe!");
    return;
  }

  const title = document.getElementById("recipe-title").value.trim();
  const category = document.getElementById("recipe-category").value;
  const cookTime = document.getElementById("recipe-cook-time").value.trim();
  const servings = parseInt(document.getElementById("recipe-servings").value);
  const emoji = document.getElementById("recipe-emoji").value;
  const ingredientsText = document.getElementById("recipe-ingredients").value;
  const instructionsText = document.getElementById("recipe-instructions").value;

  if (!title || !category || !cookTime || !servings || !ingredientsText || !instructionsText) {
    alert("Please fill in all required fields.");
    return;
  }

  // Parse lines into clean arrays
  const ingredients = ingredientsText
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const instructions = instructionsText
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  try {
    const recipeData = {
      title,
      category,
      cookTime,
      servings,
      emoji,
      ingredients,
      instructions,
      chefId: currentUser.uid,
      chefName: currentUser.name || "Community Cook",
      createdAt: new Date().toISOString()
    };

    // Save recipe to Firestore
    await createRecipe(recipeData);

    // Reset and close
    postRecipeForm.reset();
    becomeRecipeModal.close();

    // Reload UI
    await fetchAndRenderRecipes();
  } catch (error) {
    console.error("Failed to share recipe:", error);
    alert(`Failed to share recipe: ${error.message}`);
  }
}

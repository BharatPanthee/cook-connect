// Chef Reviews Handlers Module

import { createReview, getReviews } from "./db-service.js";
import { renderReviews } from "./render-service.js";

/**
 * Handle new review form submission.
 */
export async function handleReviewSubmit(e, currentUser, activeChef, elements, onReviewAdded) {
  e.preventDefault();
  
  if (!currentUser) {
    alert("Please sign in to write a review!");
    return;
  }
  
  if (!activeChef) return;
  
  const ratingInput = document.querySelector('input[name="review-rating"]:checked');
  const commentInput = document.getElementById("review-text");
  
  if (!ratingInput) {
    alert("Please select a star rating!");
    return;
  }
  
  const rating = parseInt(ratingInput.value);
  const comment = commentInput.value.trim();
  
  if (!comment) {
    alert("Please enter a comment!");
    return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  
  try {
    const reviewData = {
      chefId: activeChef.id,
      rating,
      comment,
      reviewerId: currentUser.uid,
      reviewerName: currentUser.name || "Client",
      createdAt: new Date().toISOString()
    };
    
    await createReview(reviewData);
    
    // Reset form
    e.target.reset();
    
    // Fetch and reload reviews lists
    const updatedReviews = await getReviews(activeChef.id);
    renderReviews(updatedReviews, elements.reviewsListContainer);
    
    // Recalculate and update the chef details stats in the modal
    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgScore = parseFloat((totalRating / updatedReviews.length).toFixed(1));
    const starString = "★".repeat(Math.round(avgScore)) + "☆".repeat(5 - Math.round(avgScore));
    
    elements.avgScoreEl.textContent = avgScore.toFixed(1);
    elements.avgStarsEl.textContent = starString;
    elements.reviewCountEl.textContent = `${updatedReviews.length} reviews`;
    
    // Trigger callback to refresh listings in the main view
    if (onReviewAdded) {
      onReviewAdded();
    }
    
    alert("Thank you! Your review has been posted.");
  } catch (err) {
    console.error("Failed to post review:", err);
    alert(`Failed to post review: ${err.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

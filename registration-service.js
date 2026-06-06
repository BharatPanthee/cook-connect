// Registration Service Module

import { createChefProfile, createCookingRequest } from "./db-service.js";

/**
 * Register a new chef listing.
 * @param {string} uid - User ID of the chef.
 * @param {Object} fields - Form fields containing chef details.
 */
export async function registerChefListing(uid, fields) {
  const chefData = {
    userId: uid,
    name: fields.name,
    avatar: fields.avatar,
    rating: 5.0,
    reviewsCount: 1,
    specialty: fields.specialty,
    tagline: fields.tagline,
    bio: fields.bio,
    specialtiesTags: [fields.specialty, "Home Cooked", "Fresh Ingredients"],
    costType: fields.costType,
    rate: fields.costType === "free" ? 0 : fields.rate,
    location: fields.location,
    availability: "Flexible scheduling",
    serviceType: "In-person & Online",
    portfolio: [
      { img: "images/pasta.png", caption: "Homecooked Specialty" },
      { img: "images/bread.png", caption: "Signature Baking" }
    ],
    chatReplies: [
      `Hello! Thank you for message. I recently joined CookConnect to help out with ${fields.specialty} cooking. How can I help you?`,
      "That sounds great. I am generally free on weekends. Let's arrange details!",
      "Perfect, looking forward to it!"
    ]
  };

  return createChefProfile(uid, chefData);
}

/**
 * Register a new community help request.
 * @param {string} uid - User ID of the requester.
 * @param {Object} fields - Form fields containing request details.
 */
export async function registerCookingRequest(uid, fields) {
  const budgetType = fields.budgetOption.includes("Free") ? "free" : "paid";

  const requestData = {
    userId: uid,
    title: fields.title,
    name: fields.name,
    location: fields.location,
    budgetType,
    details: fields.details,
    specialty: fields.specialty,
    date: "Post date: Today"
  };

  return createCookingRequest(requestData);
}

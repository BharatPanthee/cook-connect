// Static Mock Database for Initial Seeding

export const INITIAL_CHEFS = [
  {
    id: "chef-1",
    name: "Elena Rostova",
    avatar: "👩‍🍳",
    rating: 4.9,
    reviewsCount: 34,
    specialty: "Italian",
    tagline: "Homemade pasta enthusiast and Neapolitan pizza curator",
    bio: "I learned to cook from my grandmother in Florence and spent 5 years working in local trattorias. I love teaching others the simplicity of classic Italian dishes—from making pasta dough from scratch to balancing a ragù. I offer in-person classes and can also assist in prepping meals for families.",
    specialtiesTags: ["Handmade Pasta", "Woodfire Pizza", "Gnocchi", "Sauces"],
    costType: "free",
    rate: 0,
    location: "Brooklyn, NY",
    availability: "Friday evenings & Weekends",
    serviceType: "In-person & Online",
    portfolio: [
      { img: "images/pasta.png", caption: "Fresh Burrata Tagliatelle" },
      { img: "images/bread.png", caption: "Crispy Focaccia bread" }
    ],
    chatReplies: [
      "Hi there! 🍝 Thanks for reaching out. I'd love to help you master handmade pasta. Are you looking to learn a specific dish or do a general session?",
      "Perfect! Tagliatelle with burrata is one of my signature dishes. If we do it in-person, I'll bring the pasta rolling machine, you just need to grab the double-zero flour and fresh eggs. Would next Saturday afternoon work?",
      "Excellent, I've noted that down! I will send you a list of the simple ingredients we need. Looking forward to cooking together! 👩‍🍳"
    ]
  },
  {
    id: "chef-2",
    name: "Marcus Vance",
    avatar: "👨‍🍳",
    rating: 4.8,
    reviewsCount: 22,
    specialty: "Baking",
    tagline: "Sourdough mentor offering free community workshops",
    bio: "Baking is my meditation. I specialize in wild yeast fermentation, sourdough starters, and artisanal pastries. I believe good bread should be accessible to everyone, which is why I offer free weekend skill-shares to help locals start their own sourdough journeys. I also accept small voluntary donations or skill swaps!",
    specialtiesTags: ["Sourdough Fermentation", "Croissants", "Brioche", "Gluten-Free"],
    costType: "free",
    rate: 0,
    location: "Queens, NY",
    availability: "Saturday mornings",
    serviceType: "In-person & Group classes",
    portfolio: [
      { img: "images/bread.png", caption: "Crusty Artisanal Sourdough" },
      { img: "images/pasta.png", caption: "Handmade Ravioli swap" }
    ],
    chatReplies: [
      "Hello! 🥖 Sourdough can be intimidating, but I promise we can crack it! I do these workshops for free to help build local baking circles. Do you already have a wild starter going?",
      "No starter? No problem! I can bring a jar of my active 4-year-old starter (I call her 'Eliza') to kickstart yours. We will feed her and bake a loaf. Does Saturday at 10 AM work?",
      "Great! Just make sure you have some unbleached bread flour and a Dutch oven if possible. I'll see you then! Happy baking!"
    ]
  },
  {
    id: "chef-3",
    name: "Kenji Sato",
    avatar: "🧑‍🍳",
    rating: 5.0,
    reviewsCount: 41,
    specialty: "Asian",
    tagline: "Sushi chef specializing in traditional Edomae sushi",
    bio: "With over 12 years of professional experience in Tokyo and New York, I specialize in the art of Edomae sushi, fish curing, and traditional Japanese home cooking (Washoku). I provide premium private dinners, meal prep, and high-end sushi rolling classes. All rates are inclusive of specialized tools.",
    specialtiesTags: ["Nigiri & Maki", "Fish Curing", "Ramen Broths", "Tempura"],
    costType: "free",
    rate: 0,
    location: "Manhattan, NY",
    availability: "Flexible scheduling",
    serviceType: "In-person private catering",
    portfolio: [
      { img: "images/sushi.png", caption: "Premium Nigiri Platter" },
      { img: "images/pasta.png", caption: "Ramen noodles dough" }
    ],
    chatReplies: [
      "Konnichiwa! 🍣 Thank you for your interest. I specialize in private sushi events and targeted chef lessons. What kind of menu or experience do you have in mind?",
      "Ah, a private sushi rolling lesson is a wonderful choice. I will bring sashimi-grade fish directly from the fish market, as well as sushi mats and seasoned rice. What date are you planning for?",
      "Understood. I will prepare a custom proposal and email it to you. Let's make this an unforgettable culinary experience!"
    ]
  },
  {
    id: "chef-4",
    name: "Aisha Patel",
    avatar: "👩‍🍳",
    rating: 4.7,
    reviewsCount: 19,
    specialty: "Indian",
    tagline: "Homestyle curries and spice blending workshops",
    bio: "Spices are a language of love. I offer cooking lessons centered on traditional North & South Indian home cooking. Learn how to roast spices, balance flavors, and make soft rotis. I do this part-time to connect with neighbors and share my heritage.",
    specialtiesTags: ["Spice Roasting", "Curries", "Roti & Naan", "Vegan Dishes"],
    costType: "free",
    rate: 0,
    location: "Brooklyn, NY",
    availability: "Weeknights",
    serviceType: "Online & In-person",
    portfolio: [
      { img: "images/pasta.png", caption: "Indian Fusion Pasta" },
      { img: "images/bread.png", caption: "Traditional Roti bread" }
    ],
    chatReplies: [
      "Namaste! 🌶️ I'd love to help you understand the magic of Indian spices. We can cook some comforting curries together. Do you have a specific spice tolerance level?",
      "Perfect, mild-to-medium is great because we can really taste the aromatics! Let's schedule an online session or in-person. What works best for you?",
      "Splendid! I will email you the recipe card and shopping list. Get ready for some incredible aromas in your kitchen!"
    ]
  },
  {
    id: "chef-5",
    name: "Clara Dupont",
    avatar: "👩‍🍳",
    rating: 4.6,
    reviewsCount: 15,
    specialty: "Vegan",
    tagline: "Plant-based meal prep and allergen-free cooking",
    bio: "Transitioning to plant-based eating doesn't mean sacrificing flavor! I help clients plan and prep their weekly vegan meals, making sure they get balanced nutrition. I also specialize in gluten-free and nut-free desserts. Let's make healthy cooking fun!",
    specialtiesTags: ["Plant-based Prep", "Gluten-Free Baking", "Nut-Free", "Smoothies"],
    costType: "free",
    rate: 0,
    location: "Hoboken, NJ",
    availability: "Sunday afternoons",
    serviceType: "Meal prep assistance",
    portfolio: [
      { img: "images/bread.png", caption: "Gluten-Free Bread" },
      { img: "images/pasta.png", caption: "Vegan Tomato Pasta" }
    ],
    chatReplies: [
      "Hi! 🌱 Plant-based cooking is a wonderful journey. I can share some recipes that make meal-prepping for the week a breeze. Do you have any allergies I should know about?",
      "Got it, gluten-free and plant-based is my specialty. We can prep three main dishes in about two hours. Are you free this coming Sunday?",
      "Perfect! I will send over the menu options. Once you pick your favorites, I'll send the prep instructions. See you Sunday!"
    ]
  }
];

export const INITIAL_REQUESTS = [
  {
    id: "req-1",
    title: "Need help baking my first sourdough loaf",
    name: "Alex Rivera",
    location: "Brooklyn, NY",
    budgetType: "free",
    details: "I've tried twice but my bread keeps turning out flat and dense. I have flour and a glass jar, but I think my starter is weak. Looking for a neighbor to guide me through the folding and proofing process. Can trade for Spanish lessons!",
    specialty: "Baking",
    date: "Post date: June 4, 2026"
  },
  {
    id: "req-2",
    title: "Weekly vegan meal prep for busy family of 4",
    name: "Sarah & Dan",
    location: "Manhattan, NY",
    budgetType: "paid",
    details: "Looking for an experienced cook to come to our home on Sunday afternoons to prep 4 vegan lunches and dinners for the week. We have all ingredients and a large kitchen. Rates negotiable, around $25/hr.",
    specialty: "Vegan",
    date: "Post date: June 5, 2026"
  },
  {
    id: "req-3",
    title: "Learn to roll sushi for a date night",
    name: "Tyler Jenkins",
    location: "Queens, NY",
    budgetType: "paid",
    details: "I want to surprise my partner with a sushi-making night. Looking for a chef or experienced cook to teach us how to prepare sushi rice, slice fish, and roll neat maki rolls. Willing to pay hourly rate + supply costs.",
    specialty: "Asian",
    date: "Post date: June 5, 2026"
  }
];

export const INITIAL_RECIPES = [
  {
    id: "recipe-1",
    title: "Classic Tagliatelle al Limone",
    chefId: "chef-1",
    chefName: "Elena Rostova",
    category: "Italian",
    cookTime: "30 mins",
    servings: 4,
    emoji: "🍝",
    ingredients: [
      "1 lb fresh tagliatelle pasta",
      "2 organic lemons (zest and juice)",
      "1/2 cup heavy cream",
      "1/2 cup Parmigiano-Reggiano, grated",
      "4 tbsp unsalted butter",
      "Salt and freshly cracked black pepper to taste"
    ],
    instructions: [
      "Bring a large pot of salted water to a boil and cook the tagliatelle until al dente.",
      "Meanwhile, melt butter in a large skillet over medium heat. Add lemon zest and sauté for 1 minute.",
      "Stir in heavy cream and lemon juice, bring to a gentle simmer for 2 minutes.",
      "Drain pasta, reserving 1/2 cup of pasta water.",
      "Toss the pasta into the skillet, adding grated cheese and reserved pasta water as needed to create a glossy sauce.",
      "Season with salt and plenty of black pepper. Serve hot."
    ]
  },
  {
    id: "recipe-2",
    title: "Artisanal Country Sourdough Loaf",
    chefId: "chef-2",
    chefName: "Marcus Vance",
    category: "Baking",
    cookTime: "24 hrs (Prep + Rise)",
    servings: 8,
    emoji: "🍞",
    ingredients: [
      "500g unbleached bread flour",
      "375g warm water",
      "100g active sourdough starter",
      "10g fine sea salt"
    ],
    instructions: [
      "In a bowl, mix flour and 350g of water. Let rest (autolyse) for 45 minutes.",
      "Add starter, salt, and remaining 25g of water. Mix well by squeezing the dough.",
      "Perform stretch and folds every 30 minutes for 2 hours.",
      "Bulk ferment at room temperature until dough has grown 50% in size.",
      "Shape into a round boule and place in a proofing basket. Cold proof in fridge overnight.",
      "Preheat Dutch oven to 450°F. Score the dough and bake covered for 20 minutes, then uncovered for 25 minutes."
    ]
  },
  {
    id: "recipe-3",
    title: "Traditional Shoyu Ramen Broth",
    chefId: "chef-3",
    chefName: "Kenji Sato",
    category: "Asian",
    cookTime: "4 hrs",
    servings: 6,
    emoji: "🍜",
    ingredients: [
      "2 lbs chicken bones",
      "1 onion, halved",
      "1 ginger knob, sliced",
      "4 garlic cloves",
      "1/2 cup soy sauce",
      "2 tbsp mirin",
      "1 sheet kombu",
      "6 cups water"
    ],
    instructions: [
      "Rinse chicken bones and boil in water for 5 minutes, then drain and rinse clean.",
      "Place bones, fresh water, onion, ginger, and garlic in a clean pot. Simmer gently for 3 hours, skimming fat.",
      "In a separate pan, combine soy sauce, mirin, and kombu. Simmer for 10 minutes to make the tare (seasoning).",
      "Strain the chicken broth.",
      "To serve, place 2 tbsp of tare in a bowl, ladle in hot broth, and add cooked ramen noodles and toppings of choice."
    ]
  }
];

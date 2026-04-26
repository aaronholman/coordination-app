import type { GroceryCategory } from "@/lib/types/database";

const categoryKeywords: Array<{
  category: GroceryCategory;
  keywords: string[];
}> = [
  {
    category: "produce",
    keywords: [
      "apple",
      "banana",
      "orange",
      "lettuce",
      "spinach",
      "tomato",
      "avocado",
      "onion",
      "potato",
      "berry",
      "grape",
      "pepper",
    ],
  },
  {
    category: "dairy",
    keywords: ["milk", "cheese", "yogurt", "butter", "cream", "egg"],
  },
  {
    category: "meat",
    keywords: ["chicken", "beef", "pork", "turkey", "sausage", "bacon"],
  },
  {
    category: "seafood",
    keywords: ["salmon", "tuna", "shrimp", "fish", "crab", "lobster"],
  },
  {
    category: "bakery",
    keywords: ["bread", "bagel", "muffin", "croissant", "bun", "roll"],
  },
  {
    category: "pantry",
    keywords: ["rice", "pasta", "bean", "flour", "oil", "sauce", "spice"],
  },
  {
    category: "frozen",
    keywords: ["frozen", "ice cream", "waffle", "pizza"],
  },
  {
    category: "beverages",
    keywords: ["juice", "soda", "water", "coffee", "tea", "kombucha"],
  },
  {
    category: "snacks",
    keywords: ["chips", "cracker", "cookie", "nuts", "bar", "popcorn"],
  },
  {
    category: "household",
    keywords: ["detergent", "soap", "paper towel", "toilet paper", "trash bag"],
  },
  {
    category: "personal_care",
    keywords: ["shampoo", "toothpaste", "deodorant", "lotion", "razor"],
  },
];

export function categorizeGroceryItem(name: string): GroceryCategory {
  const normalized = name.trim().toLowerCase();

  const match = categoryKeywords.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );

  return match?.category ?? "other";
}

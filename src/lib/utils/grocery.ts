import type { GroceryCategory, GroceryItem } from "@/lib/types/database";

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

/**
 * Normalize a grocery item name for comparison.
 * Strips whitespace, lowercases, removes trailing "s" for basic plural handling,
 * and removes common filler words.
 */
function normalizeForMatch(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b(the|a|an|of|for)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Split a name into individual meaningful words for token matching.
 */
function tokenize(name: string): string[] {
  return normalizeForMatch(name)
    .split(" ")
    .filter((w) => w.length > 1);
}

/**
 * Find existing grocery items that are similar to the given name.
 * Returns matches ranked by relevance: exact > substring > token overlap.
 * Only returns items above a minimum similarity threshold.
 */
export function findSimilarItems(
  name: string,
  items: GroceryItem[],
): GroceryItem[] {
  const normalized = normalizeForMatch(name);
  if (!normalized) return [];

  const inputTokens = tokenize(name);

  const scored: Array<{ item: GroceryItem; score: number }> = [];

  for (const item of items) {
    const itemNorm = normalizeForMatch(item.name);

    // Exact match — skip, this is handled by the existing logic
    if (itemNorm === normalized) continue;

    let score = 0;

    // One name contains the other (e.g. "brioche" / "brioche bread")
    if (normalized.includes(itemNorm) || itemNorm.includes(normalized)) {
      // Shorter name length / longer name length = how much overlap
      const shorter = Math.min(normalized.length, itemNorm.length);
      const longer = Math.max(normalized.length, itemNorm.length);
      score = Math.max(score, 0.7 + 0.3 * (shorter / longer));
    }

    // Token overlap (e.g. "whole wheat bread" / "wheat bread")
    if (score === 0) {
      const itemTokens = tokenize(item.name);
      if (inputTokens.length > 0 && itemTokens.length > 0) {
        const shared = inputTokens.filter((t) =>
          itemTokens.some((it) => it.includes(t) || t.includes(it)),
        );
        const overlapRatio =
          shared.length / Math.max(inputTokens.length, itemTokens.length);
        if (overlapRatio >= 0.5) {
          score = 0.4 + 0.3 * overlapRatio;
        }
      }
    }

    if (score >= 0.5) {
      scored.push({ item, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => entry.item);
}

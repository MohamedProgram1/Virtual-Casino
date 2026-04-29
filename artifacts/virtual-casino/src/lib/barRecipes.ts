import { getShopItem } from "./shopItems";

export interface Ingredient {
  id: string;
  name: string;
  /** Tailwind color used for the bottle label and the liquid in the glass. */
  color: string;
  /** Hex used directly in SVG fills (the colored layers in the glass). */
  hex: string;
}

export interface BarRecipe {
  /** Matches a SHOP_ITEMS id so a perfectly-mixed drink can be added to inventory. */
  id: string;
  name: string;
  /** Italic line shown under the customer's order. */
  vibe: string;
  /** Map of ingredient id → number of pour-units required. Total typically 4–6. */
  parts: Record<string, number>;
}

export const INGREDIENTS: Ingredient[] = [
  { id: "whiskey", name: "Whiskey", color: "text-amber-300", hex: "#b07a2b" },
  { id: "gin", name: "Gin", color: "text-sky-200", hex: "#cfe9ff" },
  { id: "vermouth", name: "Vermouth", color: "text-rose-200", hex: "#d6889a" },
  { id: "campari", name: "Campari", color: "text-rose-400", hex: "#c43355" },
  { id: "soda", name: "Soda", color: "text-zinc-200", hex: "#e7eef5" },
  { id: "bitters", name: "Bitters", color: "text-amber-700", hex: "#5d2e1f" },
];

export const RECIPES: BarRecipe[] = [
  {
    id: "old_fashioned",
    name: "Old Fashioned",
    vibe: "Two of whiskey, a kiss of bitters. No fuss.",
    parts: { whiskey: 3, bitters: 1 },
  },
  {
    id: "martini",
    name: "Dry Martini",
    vibe: "Mostly gin, a whisper of vermouth.",
    parts: { gin: 3, vermouth: 1 },
  },
  {
    id: "negroni",
    name: "Negroni",
    vibe: "Equal parts. Dangerous in its symmetry.",
    parts: { gin: 1, campari: 1, vermouth: 1 },
  },
  {
    id: "highball",
    name: "Whiskey Highball",
    vibe: "Long, cold, easy on the burn.",
    parts: { whiskey: 2, soda: 3 },
  },
];

export const TOTAL_PARTS_BY_RECIPE: Record<string, number> = Object.fromEntries(
  RECIPES.map((r) => [r.id, Object.values(r.parts).reduce((a, b) => a + b, 0)]),
);

/**
 * Score a poured glass against a recipe.
 * - Returns 0..100 accuracy based on absolute pour-unit error.
 * - Any extra ingredients (not in the recipe) cost double.
 */
export function scoreGlass(
  recipe: BarRecipe,
  poured: Record<string, number>,
): number {
  const target = TOTAL_PARTS_BY_RECIPE[recipe.id];
  let error = 0;
  // Penalise wrong ingredients hard
  for (const id of Object.keys(poured)) {
    if (!(id in recipe.parts) && poured[id] > 0) {
      error += poured[id] * 2;
    }
  }
  // Compare each required ingredient's amount
  for (const [id, want] of Object.entries(recipe.parts)) {
    const got = poured[id] ?? 0;
    error += Math.abs(got - want);
  }
  // Maximum tolerable error is roughly the recipe size
  const maxError = Math.max(target * 1.5, 4);
  const acc = Math.max(0, Math.min(1, 1 - error / maxError));
  return Math.round(acc * 100);
}

/** Convert an accuracy score (0..100) into a chip tip. */
export function tipFor(accuracy: number): number {
  if (accuracy >= 95) return 80;
  if (accuracy >= 80) return 50;
  if (accuracy >= 60) return 25;
  if (accuracy >= 40) return 10;
  return 0;
}

/** Drinks are only added to your tab when you nail it (>= 80). */
export function shouldGrantDrink(accuracy: number): boolean {
  return accuracy >= 80;
}

/** Look up the matching shop drink so we can grant its boost on a perfect mix. */
export function shopItemForRecipe(recipeId: string) {
  return getShopItem(recipeId);
}

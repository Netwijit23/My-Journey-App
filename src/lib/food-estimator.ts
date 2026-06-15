import type { FoodEstimate } from "@/types/forma";

const foodMap: Record<string, Omit<FoodEstimate, "confidence" | "source">> = {
  eggs: { name: "Large egg", calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0 },
  "chicken breast": { name: "Chicken breast, cooked", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  rice: { name: "Jasmine rice, cooked", calories: 205, protein: 4.3, carbs: 44.5, fat: 0.4, fiber: 0.6 },
  oats: { name: "Oats, dry", calories: 150, protein: 5, carbs: 27, fat: 3, fiber: 4 },
  banana: { name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1 },
};

export function estimateFoods(input: string): FoodEstimate[] {
  const normalized = input.toLowerCase();
  const estimates: FoodEstimate[] = [];

  for (const [key, food] of Object.entries(foodMap)) {
    if (normalized.includes(key)) {
      const quantity = extractQuantity(normalized, key);
      estimates.push({
        ...food,
        name: quantity > 1 ? `${quantity} x ${food.name}` : food.name,
        calories: Math.round(food.calories * quantity),
        protein: round(food.protein * quantity),
        carbs: round(food.carbs * quantity),
        fat: round(food.fat * quantity),
        fiber: round(food.fiber * quantity),
        confidence: key.length > 4 ? 0.78 : 0.64,
        source: "ai-estimate",
      });
    }
  }

  return estimates;
}

function extractQuantity(input: string, key: string) {
  const match = input.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:x\\s*)?${key}`));
  return match ? Number(match[1]) : 1;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

import { NextRequest, NextResponse } from "next/server";

const fallbackFoods = [
  {
    id: "usda-171688",
    name: "Chicken breast, cooked, roasted",
    source: "USDA FoodData Central",
    servingSize: "100 g",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
  },
  {
    id: "usda-169910",
    name: "Rice, white, long-grain, cooked",
    source: "USDA FoodData Central",
    servingSize: "1 cup",
    calories: 205,
    protein: 4.3,
    carbs: 44.5,
    fat: 0.4,
    fiber: 0.6,
  },
  {
    id: "off-737628064502",
    name: "Greek yogurt, plain",
    source: "Open Food Facts",
    servingSize: "170 g",
    calories: 100,
    protein: 17,
    carbs: 6,
    fat: 0,
    fiber: 0,
  },
];

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";
  const foods = fallbackFoods.filter((food) => food.name.toLowerCase().includes(query));

  return NextResponse.json({
    foods,
    cached: true,
    nextStep: "Connect USDA_API_KEY to proxy and cache verified FoodData Central results.",
  });
}

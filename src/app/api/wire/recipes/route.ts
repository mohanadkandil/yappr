import { RECIPES } from "@/lib/wire/recipes";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, recipes: RECIPES });
}

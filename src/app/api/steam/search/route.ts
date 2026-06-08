import { NextResponse } from "next/server"
import { searchSteamStorefront } from "@/services/steam"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  if (!query || query.length < 2) {
    return NextResponse.json({ items: [] })
  }

  const items = await searchSteamStorefront(query)
  return NextResponse.json({ items })
}

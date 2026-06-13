import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: "maintenance" } })
    return NextResponse.json({ maintenance: setting?.value ?? "false" })
  } catch {
    return NextResponse.json({ maintenance: "false" })
  }
}

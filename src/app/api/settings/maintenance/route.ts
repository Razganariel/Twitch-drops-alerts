import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMaintenanceValue, setMaintenanceValue } from "@/lib/maintenance"

export async function GET() {
  try {
    let value = getMaintenanceValue()

    if (value === "false") {
      const setting = await prisma.appSetting.findUnique({ where: { key: "maintenance" } })
      value = setting?.value ?? "false"
      setMaintenanceValue(value)
    }

    return NextResponse.json({ maintenance: value })
  } catch {
    return NextResponse.json({ maintenance: "false" })
  }
}

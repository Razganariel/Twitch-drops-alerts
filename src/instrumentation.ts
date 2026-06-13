import { prisma } from "@/lib/prisma"
import { setMaintenanceValue } from "@/lib/maintenance"

export async function register() {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: "maintenance" } })
    setMaintenanceValue(setting?.value ?? "false")
  } catch {}
}

const globalForMaintenance = globalThis as unknown as {
  _maintenanceValue: string | undefined
}

export function setMaintenanceValue(value: string) {
  globalForMaintenance._maintenanceValue = value
}

export function getMaintenanceValue(): string {
  return globalForMaintenance._maintenanceValue ?? "false"
}

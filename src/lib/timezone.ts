export function getOffsetMinutes(timezone: string): number {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  }).formatToParts(new Date())

  const tz = parts.find((p) => p.type === "timeZoneName")?.value
  if (!tz) return 0

  const m = tz.match(/GMT([+-])(\d+)(?::(\d+))?/)
  if (!m) return 0

  const hours = parseInt(m[2])
  const mins = parseInt(m[3] || "0")
  return m[1] === "+" ? hours * 60 + mins : -(hours * 60 + mins)
}

export function parseTwitchDate(dateStr: string, timezone: string): Date {
  if (/[Z+]/i.test(dateStr) || /-\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr)
  }

  const asUtc = new Date(dateStr + "Z")
  const offset = getOffsetMinutes(timezone)
  return new Date(asUtc.getTime() - offset * 60000)
}

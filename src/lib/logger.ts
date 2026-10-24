function timestamp() {
  const d = new Date()
  const pad = (n: number, len = 2) => String(n).padStart(len, "0")
  const offset = -d.getTimezoneOffset()
  const sign = offset >= 0 ? "+" : "-"
  const absOffset = Math.abs(offset)
  const tz = `${sign}${pad(Math.floor(absOffset / 60))}:${pad(absOffset % 60)}`

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}${tz}`
}

const originalLog = console.log
const originalError = console.error

console.log = (...args) => originalLog(`[${timestamp()}]`, ...args)
console.error = (...args) => originalError(`[${timestamp()}]`, ...args)

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalize(name: string) {
  return name.toLowerCase().trim()
}

export const KOFI_URL = "https://ko-fi.com/razganariel"
export const GIT_URL = "https://github.com/Razganariel/Twitch-drops-alerts"

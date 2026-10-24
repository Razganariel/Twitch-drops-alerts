import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalize(name: string) {
  return name.toLowerCase().trim()
}

export const KOFI_URL = "https://ko-fi.com/razganariel"

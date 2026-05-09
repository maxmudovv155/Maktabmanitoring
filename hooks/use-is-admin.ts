"use client";

export function useIsAdmin(role: string | null | undefined): boolean {
  return role === "admin";
}

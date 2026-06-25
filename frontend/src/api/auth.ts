import type { User } from "@/types/user";
import apiFetch from "./client";

export const getMe = () => apiFetch<User>("/auth/me");

export const logout = () => apiFetch<{ message: string }>("/auth/logout", { method: "POST" });

export const initiateGoogleLogin = () => {
  window.location.href = "/auth/google";
};

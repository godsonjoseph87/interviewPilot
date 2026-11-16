// Environment variables helper

export const ENV_GOOGLE_CLIENT_ID: string =
  (import.meta.env.GOOGLE_CLIENT_ID as string) ||
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
  '';

export const ENV_GOOGLE_CLIENT_SECRET: string =
  (import.meta.env.GOOGLE_CLIENT_SECRET as string) ||
  (import.meta.env.VITE_GOOGLE_CLIENT_SECRET as string) ||
  '';

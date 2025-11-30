/**
 * Helper functions para manejo de autenticación y cookies
 */

// Obtener el token de acceso desde las cookies
export function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;

  const name = "access=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(";");

  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return null;
}

// Obtener el token de refresco desde las cookies
export function getRefreshToken(): string | null {
  if (typeof document === "undefined") return null;

  const name = "refresh=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(";");

  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return null;
}

// Verificar si el usuario está autenticado
export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

// Guardar tokens en cookies
export function setAuthTokens(access: string, refresh: string): void {
  const maxAge = 7 * 24 * 60 * 60; // 7 días
  document.cookie = `access=${access}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `refresh=${refresh}; path=/; max-age=${
    maxAge * 4
  }; samesite=lax`;
}

// Limpiar tokens (logout)
export function clearAuthTokens(): void {
  document.cookie = "access=; path=/; max-age=0";
  document.cookie = "refresh=; path=/; max-age=0";
}

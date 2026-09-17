export type Theme = "light" | "dark";

export const themeInitScript = `(() => {
  const root = document.documentElement;
  let storedTheme = null;
  try {
    storedTheme = localStorage.getItem("theme");
  } catch {}
  const theme = storedTheme === "light" || storedTheme === "dark"
    ? storedTheme
    : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
})();`;

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;

  try {
    localStorage.setItem("theme", theme);
  } catch {
    // The visual preference still applies when private browsing blocks storage.
  }
}

export function toggleTheme() {
  const nextTheme: Theme = document.documentElement.classList.contains("dark")
    ? "light"
    : "dark";
  applyTheme(nextTheme);
}

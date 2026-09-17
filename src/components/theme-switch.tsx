import { toggleTheme } from "@/lib/theme";
import { Button } from "@/shared/components/button";

export function ThemeSwitch() {
  return (
    <Button
      aria-label="テーマを切り替え"
      className="theme-switch"
      onClick={toggleTheme}
      title="テーマを切り替え"
      type="button"
    >
      <span aria-hidden="true" className="theme-switch__light">
        ☀
      </span>
      <span aria-hidden="true" className="theme-switch__dark">
        ◐
      </span>
    </Button>
  );
}

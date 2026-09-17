import { toggleTheme } from "@/lib/theme";
import { Button } from "@/shared/components/button";

export function ThemeSwitch() {
  return (
    <Button
      aria-label="テーマを切り替え"
      className="relative overflow-hidden rounded-full text-[1.15rem] leading-none"
      onClick={toggleTheme}
      title="テーマを切り替え"
      type="button"
    >
      <span aria-hidden="true" className="dark:hidden">
        ☀
      </span>
      <span aria-hidden="true" className="hidden dark:inline">
        ◐
      </span>
    </Button>
  );
}

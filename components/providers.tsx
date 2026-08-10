"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/primitives";
import { StoreProvider } from "@/lib/store";
import { PreviewSwitcher } from "@/components/preview-switcher";

const ThemeContext = React.createContext<{ dark: boolean; toggle: () => void }>({
  dark: true,
  toggle: () => {},
});

export const useTheme = () => React.useContext(ThemeContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = React.useState(true);

  React.useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = React.useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <StoreProvider>
        <TooltipProvider delayDuration={250} skipDelayDuration={300}>
          {children}
          <PreviewSwitcher />
        </TooltipProvider>
      </StoreProvider>
    </ThemeContext.Provider>
  );
}

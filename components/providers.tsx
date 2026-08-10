"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/primitives";
import { StoreProvider } from "@/lib/store";
import { PortalSwitcher } from "@/components/portal-switcher";

const ThemeContext = React.createContext<{ dark: boolean; toggle: () => void }>({
  dark: false,
  toggle: () => {},
});

export const useTheme = () => React.useContext(ThemeContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = React.useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("cadence.theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <StoreProvider>
        <TooltipProvider delayDuration={250} skipDelayDuration={300}>
          {children}
          <PortalSwitcher />
        </TooltipProvider>
      </StoreProvider>
    </ThemeContext.Provider>
  );
}

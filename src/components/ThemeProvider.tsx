import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";

export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => (
  <NextThemeProvider
    attribute="class"
    defaultTheme="dark"
    enableSystem
    storageKey="fadebook-pro-theme"
    {...props}
  >
    {children}
  </NextThemeProvider>
);


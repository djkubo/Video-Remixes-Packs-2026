import { useTheme } from "@/contexts/ThemeContext";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";

const Header = () => {
  const { theme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 dark:bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm dark:shadow-none">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <img
            src={theme === "dark" ? logoWhite : logoDark}
            alt="VideoRemixesPacks"
            className="h-10 w-auto object-contain"
          />
        </a>

        {/* Navigation - can be extended */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#pricing"
            className="font-sans text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Planes
          </a>
          <a
            href="https://videoremixpack.com"
            className="font-sans text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Sitio Principal
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;

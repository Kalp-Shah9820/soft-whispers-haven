import { NavLink } from "@/components/NavLink";
import { Home, PenLine, BookHeart, Target, Heart, Mail, Eye, Settings, Menu, X, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useSettingsAPI, useRoleAPI } from "@/lib/store-api";
import { motion, AnimatePresence } from "framer-motion";
import { useHideMode } from "@/lib/hideMode";

const navItems = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/write", icon: PenLine, label: "Write" },
  { to: "/dreams", icon: BookHeart, label: "My Dreams" },
  { to: "/thoughts", icon: MessageCircle, label: "My Thoughts" },
  { to: "/targets", icon: Target, label: "Gentle Steps" },
  { to: "/self-care", icon: Heart, label: "Take Care" },
  { to: "/letters", icon: Mail, label: "Letters" },
  { to: "/shared", icon: Eye, label: "Shared" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings] = useSettingsAPI();
  const [role] = useRoleAPI();
  const { hideMode, exitHideMode } = useHideMode();
  const [escCount, setEscCount] = useState(0);

  useEffect(() => {
    if (!hideMode) return;

    let timeoutId: number | undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setEscCount((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          exitHideMode();
          return 0;
        }

        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        timeoutId = window.setTimeout(() => setEscCount(0), 1500);
        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      setEscCount(0);
    };
  }, [hideMode, exitHideMode]);

  if (hideMode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-4 text-center">
        <p className="text-muted-foreground text-lg">Nothing to see here 🌿</p>
        <p className="text-xs text-muted-foreground">
          Press <span className="font-semibold">Esc</span> three times quickly or use the button below to come back.
        </p>
        <button
          type="button"
          onClick={exitHideMode}
          className="px-5 py-2.5 rounded-full text-sm font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
        >
          Exit hide mode 🌸
        </button>
      </div>
    );
  }

  // Partner view: only show shared page
  const visibleItems = role === "partner"
    ? navItems.filter((item) => ["/", "/shared"].includes(item.to))
    : navItems;

  const displayName = settings.identity.name || "lovely";

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r bg-card/50 p-4 gap-1 fixed h-full">
        <h2 className="font-display text-xl font-light text-primary mb-6 px-3 tracking-wide">🌸 Dream & Care</h2>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60"
            activeClassName="bg-secondary text-secondary-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </aside>

      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex md:hidden items-center justify-between px-4 h-14 bg-card/80 backdrop-blur-sm border-b">
        <span className="font-display text-lg font-light text-primary tracking-wide">🌸 Dream & Care</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-xl hover:bg-secondary/60">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile nav overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-40 bg-card/95 backdrop-blur-sm pt-16 px-6 md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-muted-foreground transition-colors hover:bg-secondary/60"
                  activeClassName="bg-secondary text-secondary-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:ml-56 pt-16 md:pt-0 overflow-x-hidden">
        <div className="max-w-3xl mx-auto px-4 py-8 min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}

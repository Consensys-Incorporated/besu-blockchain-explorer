import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { Compass, FileCode2, LogOut, Menu, Server, Users, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/nodes", label: "Nodes", icon: Server },
  { href: "/validators", label: "Validators", icon: Users },
  { href: "/explorer", label: "Explorer", icon: Compass },
  { href: "/contracts", label: "Contracts", icon: FileCode2 },
  { href: "/wallets", label: "Wallets", icon: Wallet },
];

export function NavBar() {
  const { pathname } = useRouter();
  const { status } = useSession();
  const [open, setOpen] = useState(false);

  const links = (mobile: boolean) =>
    navItems.map(({ href, label, icon: Icon }) => (
      <Button
        key={href}
        asChild
        variant="ghost"
        size="lg"
        className={cn(
          "text-muted-foreground",
          pathname === href && "bg-muted text-foreground",
          mobile && "justify-start"
        )}
      >
        <Link href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? "page" : undefined}>
          <Icon data-icon="inline-start" />
          {label}
        </Link>
      </Button>
    ));

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/nodes">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">{links(false)}</nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {status === "authenticated" && (
            <Button variant="ghost" size="icon-lg" aria-label="Sign out" onClick={() => signOut()}>
              <LogOut />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-lg"
            className="md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && <nav className="flex flex-col gap-1 border-t px-4 py-3 md:hidden">{links(true)}</nav>}
    </header>
  );
}

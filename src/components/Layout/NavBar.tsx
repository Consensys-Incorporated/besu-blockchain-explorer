import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { ArrowLeftRight, Blocks, Coins, FileCode2, FlaskConical, LogOut, Menu, Server, Users, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/nodes", label: "Nodes", icon: Server },
  { href: "/validators", label: "Validators", icon: Users },
  { href: "/blocks", label: "Blocks", icon: Blocks },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/contracts", label: "Contracts", icon: FileCode2 },
  { href: "/tokens", label: "Tokens", icon: Coins },
  { href: "/playground", label: "Playground", icon: FlaskConical },
  { href: "/wallets", label: "Wallets", icon: Wallet },
];

// Fixed sidebar on large screens; a top bar with a menu toggle below that.
export function NavBar() {
  const { pathname } = useRouter();
  const { status } = useSession();
  const [open, setOpen] = useState(false);

  const links = navItems.map(({ href, label, icon: Icon }) => (
    <Button
      key={href}
      asChild
      variant="ghost"
      size="lg"
      className={cn("justify-start text-muted-foreground", pathname === href && "bg-muted text-foreground")}
    >
      <Link href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? "page" : undefined}>
        <Icon data-icon="inline-start" />
        {label}
      </Link>
    </Button>
  ));

  const actions = (
    <>
      <ThemeToggle />
      {status === "authenticated" && (
        <Button variant="ghost" size="icon-lg" aria-label="Sign out" onClick={() => signOut()}>
          <LogOut />
        </Button>
      )}
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-background lg:flex">
        <Link href="/nodes" className="flex h-16 items-center px-5">
          <Logo />
        </Link>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">{links}</nav>
        <div className="flex items-center gap-1 border-t px-3 py-3">{actions}</div>
      </aside>

      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/nodes">
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            {actions}
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Toggle navigation"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && <nav className="flex flex-col gap-1 border-t px-4 py-3">{links}</nav>}
      </header>
    </>
  );
}

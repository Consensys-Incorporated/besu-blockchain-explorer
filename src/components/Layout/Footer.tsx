const links = [
  { href: "https://besu.hyperledger.org/", label: "Besu docs" },
  { href: "https://github.com/hyperledger/besu", label: "Besu on GitHub" },
  { href: "https://github.com/joshuafernandes/besu-explorer", label: "besu-explorer" },
  { href: "https://discord.com/invite/hyperledger", label: "Discord" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>&copy; {new Date().getFullYear()} Consensys</p>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

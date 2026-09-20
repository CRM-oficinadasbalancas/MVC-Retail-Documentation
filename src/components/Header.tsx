import Image from "next/image";
import Link from "next/link";
import { SairButton } from "@/components/SairButton";

const LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/comparar", label: "Comparar" },
  { href: "/buscar", label: "Buscar com IA" },
];

// Logo é placeholder até recebermos o arquivo oficial da Toledo — ver
// CLAUDE.md § "Identidade visual". Nunca escolhido pela IA, sempre o mesmo
// template fixo aqui e em src/lib/apresentacao/pdf.ts.
export function Header() {
  return (
    <header className="flex items-center justify-between gap-4 bg-[var(--color-azul-prix)] px-4 py-3 text-white">
      <div className="flex items-center gap-3">
        <Image
          src="/icons/icon.svg"
          alt="Toledo"
          width={32}
          height={32}
          className="rounded"
        />
        <span className="font-semibold">Toledo</span>
      </div>
      <nav className="flex gap-4 text-sm">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:underline">
            {link.label}
          </Link>
        ))}
      </nav>
      <SairButton />
    </header>
  );
}

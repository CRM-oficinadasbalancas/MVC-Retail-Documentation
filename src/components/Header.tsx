import Image from "next/image";
import Link from "next/link";
import { SairButton } from "@/components/SairButton";

const LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/comparar", label: "Comparar" },
  { href: "/buscar", label: "Buscar com IA" },
];

// Logo oficial Prix — mesmo arquivo usado aqui e em
// src/lib/apresentacao/pdf.ts, nunca escolhido pela IA. Ver CLAUDE.md §
// "Identidade visual".
export function Header() {
  return (
    <header className="flex items-center justify-between gap-4 bg-[var(--color-azul-prix)] px-4 py-3 text-white">
      <div className="flex items-center gap-3">
        <Image
          src="/logo/prix-logo.png"
          alt="Prix — Toledo do Brasil"
          width={36}
          height={36}
        />
        <span className="font-semibold">Agente Comercial</span>
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

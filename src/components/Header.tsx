import Image from "next/image";
import Link from "next/link";
import { BotaoVoltar } from "@/components/BotaoVoltar";
import { SairButton } from "@/components/SairButton";

const LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/comparar", label: "Comparar" },
  { href: "/buscar", label: "Buscar com IA" },
];

// Logo oficial Prix — mesmo arquivo usado aqui e em
// src/lib/apresentacao/pdf.ts, nunca escolhido pela IA. Ver CLAUDE.md §
// "Identidade visual".
// Em telas estreitas (celular, o alvo principal do app) o cabeçalho não cabe
// numa linha só: logo + título + 3 links + sair. Em vez de estourar
// horizontalmente, o nav quebra pra uma segunda linha (flex-wrap) — sem
// esconder nada atrás de menu hambúrguer, os 3 links continuam sempre
// visíveis, só reorganizados. O botão Voltar fica numa faixa própria abaixo
// da barra azul — dentro dela ele podia sobrepor o logo em telas estreitas.
export function Header() {
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-[var(--color-azul-prix)] px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo/prix-logo.png"
            alt="Prix — Toledo do Brasil"
            width={32}
            height={32}
            className="shrink-0"
          />
          <span className="truncate font-semibold">Agente Comercial</span>
        </div>
        <SairButton />
        <nav className="order-3 flex w-full justify-center gap-4 text-sm sm:order-none sm:w-auto sm:justify-start">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="border-b border-gray-200 bg-white px-4 py-2">
        <BotaoVoltar />
      </div>
    </>
  );
}

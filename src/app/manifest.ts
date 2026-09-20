import type { MetadataRoute } from "next";

// Ícone é placeholder (letra "T" em Azul Prix) até recebermos o logo oficial
// Toledo — ver CLAUDE.md § "Identidade visual".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agente Comercial Toledo",
    short_name: "Toledo",
    description:
      "Catálogo, comparação de modelos e geração de apresentação para vendedores Toledo",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b66b2",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}

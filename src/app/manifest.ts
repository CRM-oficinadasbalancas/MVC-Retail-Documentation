import type { MetadataRoute } from "next";

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
        src: "/logo/prix-logo.png",
        sizes: "1944x1944",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

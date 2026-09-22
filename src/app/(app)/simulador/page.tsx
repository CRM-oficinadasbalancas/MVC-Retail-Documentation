import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simulador grenke — Agente Comercial Toledo",
};

// O simulador de leasing (grenke) veio pronto de um APK existente — um app
// WebView cujo conteúdo real é public/simulador/index.html (autocontido,
// sem chamadas de rede, só localStorage). Embutido via iframe em vez de
// reescrito em React de propósito: o usuário pediu explicitamente pra não
// mudar nada da funcionalidade, só disponibilizar numa aba do app. Os
// arquivos em public/simulador/ são cópia byte-a-byte dos extraídos do APK.
export default function SimuladorPage() {
  return (
    <iframe
      src="/simulador/index.html"
      title="Simulador grenke — leasing de equipamentos Toledo"
      className="h-[calc(100vh-8rem)] w-full rounded-md border border-gray-200"
    />
  );
}

export default function DominioInvalidoPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold text-[var(--color-chumbo-prix)]">
        Acesso restrito
      </h1>
      <p className="max-w-sm text-sm text-[var(--color-chumbo-prix)]/80">
        Este app só está disponível para contas de e-mail corporativas da
        Toledo. Sua conta foi desconectada.
      </p>
      <a
        href="/login"
        className="rounded-md bg-[var(--color-azul-prix)] px-6 py-3 font-medium text-white"
      >
        Voltar ao login
      </a>
    </main>
  );
}

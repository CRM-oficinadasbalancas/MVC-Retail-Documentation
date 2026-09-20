// Service worker mínimo — existe só para satisfazer o critério de
// instalabilidade PWA (Chrome/Android exige um fetch handler registrado).
// Sem cache offline por enquanto: o app depende de dados sempre atualizados
// do Supabase, então cachear respostas de API traria risco de mostrar specs
// desatualizadas — contra a regra de "zero invenção"/dado não verificado.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("fetch", () => {
  // passthrough — sem interceptação, sem cache
});

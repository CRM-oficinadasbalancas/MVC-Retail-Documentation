import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Client autenticado com a sessão do vendedor (respeita RLS: só vê
 * equipamentos revisados e ativos). Use em Server Components e Route Handlers
 * que atuam em nome do usuário logado.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from a Server Component sem permissão de escrita — middleware
            // já cuida de renovar a sessão nesse caso.
          }
        },
      },
    },
  );
}

/**
 * Client com a service role key — bypassa RLS. Só usar em Route Handlers de
 * servidor (nunca expor ao browser) e SEMPRE reaplicar manualmente os filtros
 * "revisado_por is not null" e "status = 'ativo'" nas queries, já que o RLS
 * que faria isso automaticamente é ignorado por esse client.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

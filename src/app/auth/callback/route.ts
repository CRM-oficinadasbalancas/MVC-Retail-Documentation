import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Troca o código do OAuth do Google pela sessão do Supabase. A restrição de
// domínio de e-mail é aplicada depois, no middleware — aqui só estabelecemos
// a sessão.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/catalogo`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}

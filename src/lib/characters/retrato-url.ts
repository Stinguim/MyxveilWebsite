import { createClient } from "@/lib/supabase/server";

const BUCKET = "character-art";

/**
 * Devolve a URL pública do retrato, ou null se a ficha não tiver retrato
 * (o caller decide o visual default — ver <RetratoPersonagem>).
 * Client Component friendly: só monta a URL pública, não faz I/O real
 * (o bucket é público, por isso getPublicUrl não precisa de sessão).
 */
export async function urlRetrato(retratoPath: string | null): Promise<string | null> {
  if (!retratoPath) return null;
  const supabase = await createClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(retratoPath);
  return data.publicUrl;
}

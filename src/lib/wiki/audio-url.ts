import { createClient } from "@/lib/supabase/server";

const BUCKET = "character-art";

/**
 * Devolve a URL pública do áudio de leitura da página, ou null se a
 * página não tiver áudio. Igual em espírito a urlRetrato() — só monta a
 * URL pública, não faz I/O real (o bucket é público).
 */
export async function urlAudioWiki(audioPath: string | null): Promise<string | null> {
  if (!audioPath) return null;
  const supabase = await createClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(audioPath);
  return data.publicUrl;
}

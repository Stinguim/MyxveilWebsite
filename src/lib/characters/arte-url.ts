import { createClient } from "@/lib/supabase/server";
import type { ArteItem } from "@/lib/characters/arte-actions";

const BUCKET = "character-art";

/**
 * Junta cada item de arte à sua URL pública. Igual em espírito a
 * urlRetrato()/comUrlsMidiaInspirada() — só constrói a string do URL (o
 * bucket é público, sem I/O de rede real), seguro fazer em massa.
 */
export async function comUrlsArte(
  itens: ArteItem[]
): Promise<(ArteItem & { url: string })[]> {
  const supabase = await createClient();
  return itens.map((item) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(item.storage_path);
    return { ...item, url: data.publicUrl };
  });
}

import { createClient } from "@/lib/supabase/server";
import type { MidiaInspirada } from "@/lib/characters/types";

const BUCKET = "character-art";

/**
 * Junta cada item de mídia inspirada à sua URL pública. Igual em
 * espírito a urlRetrato() — só constrói a string do URL (o bucket é
 * público, sem I/O de rede real), seguro fazer em massa aqui.
 */
export async function comUrlsMidiaInspirada(
  itens: MidiaInspirada[]
): Promise<(MidiaInspirada & { url: string })[]> {
  const supabase = await createClient();
  return itens.map((item) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(item.storage_path);
    return { ...item, url: data.publicUrl };
  });
}

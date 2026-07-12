import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Fixa a raiz do projeto explicitamente. Sem isto, o Next.js tenta
    // adivinhar a raiz observando lockfiles nas pastas acima — e se
    // houver outro package-lock.json/bun.lock mais acima na árvore de
    // pastas (ex: C:\Users\<utilizador>\package-lock.json, de outro
    // projeto qualquer), pode escolher a pasta errada como raiz.
    root: __dirname,
  },
};

export default nextConfig;

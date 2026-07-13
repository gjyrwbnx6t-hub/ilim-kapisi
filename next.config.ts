import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Üst dizindeki ikinci package-lock.json yüzünden yanlış kök seçilmesini önler.
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;

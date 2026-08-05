import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "cesium", "Build", "Cesium");
const destination = join(root, "public", "cesium");
const directories = ["Assets", "ThirdParty", "Widgets", "Workers"];

if (!existsSync(source)) {
  process.exit(0);
}

mkdirSync(destination, { recursive: true });
for (const directory of directories) {
  cpSync(join(source, directory), join(destination, directory), { recursive: true, force: true });
}

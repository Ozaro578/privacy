import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateThemeCss } from "../src/css";

const target = resolve(dirname(fileURLToPath(import.meta.url)), "../src/theme.css");
writeFileSync(target, generateThemeCss(), "utf8");
console.log(`theme.css geschrieben: ${target}`);

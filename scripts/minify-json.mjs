import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const i18nDir = path.join(__dirname, "../message");

// Read all JSON files in directory
const files = fs.readdirSync(i18nDir).filter((file) => file.endsWith(".json"));

files.forEach((file) => {
  const filePath = path.join(i18nDir, file);
  // Read JSON file
  const content = fs.readFileSync(filePath, "utf8");
  // Parse and re-serialize (this removes all whitespace and formatting)
  const minified = JSON.stringify(JSON.parse(content));
  // Write back to file
  fs.writeFileSync(filePath, minified);
  console.log(`Minified ${file}`);
});

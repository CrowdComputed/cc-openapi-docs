import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const i18nDir = path.join(__dirname, "../message");

// 读取目录中的所有 JSON 文件
const files = fs.readdirSync(i18nDir).filter((file) => file.endsWith(".json"));

files.forEach((file) => {
  const filePath = path.join(i18nDir, file);
  // 读取 JSON 文件
  const content = fs.readFileSync(filePath, "utf8");
  // 解析并重新序列化（这会移除所有空格和格式化）
  const minified = JSON.stringify(JSON.parse(content));
  // 写回文件
  fs.writeFileSync(filePath, minified);
  console.log(`Minified ${file}`);
});

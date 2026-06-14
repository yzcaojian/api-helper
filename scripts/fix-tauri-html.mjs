import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const indexPath = join(process.cwd(), "dist", "index.html");
let html = readFileSync(indexPath, "utf8");

html = html
  .replace(/\scrossorigin/g, "")
  .replace(/src="\.\//g, 'src="')
  .replace(/href="\.\//g, 'href="')
  .replace(/src="\/assets\//g, 'src="assets/')
  .replace(/href="\/assets\//g, 'href="assets/');

writeFileSync(indexPath, html, "utf8");
console.log("fixed dist/index.html for Tauri asset protocol");

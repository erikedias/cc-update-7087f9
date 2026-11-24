// Gera o update.json (manifesto de atualização): versão + todos os arquivos do app com SHA-256.
// O app baixa só o que mudou, confere o hash de cada arquivo e troca tudo de uma vez.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.join(__dirname, "..");

function walk(dir, base, out) {
  for (const f of fs.readdirSync(dir).sort()) {
    if (f === ".DS_Store") continue;
    const full = path.join(dir, f);
    const rel = base ? base + "/" + f : f;
    if (fs.statSync(full).isDirectory()) walk(full, rel, out);
    else out.push(rel);
  }
}
const list = [];
walk(path.join(ROOT, "src"), "src", list);
walk(path.join(ROOT, "electron"), "electron", list);
list.push("package.json");

const files = list.map((rel) => {
  const buf = fs.readFileSync(path.join(ROOT, rel));
  return { path: rel, sha256: crypto.createHash("sha256").update(buf).digest("hex"), size: buf.length };
});
const version = require(path.join(ROOT, "package.json")).version;
const notes = process.argv[2] || "";
fs.writeFileSync(path.join(ROOT, "update.json"), JSON.stringify({ version, notes, publishedAt: new Date().toISOString(), files }, null, 2) + "\n");
console.log(`update.json gerado · v${version} · ${files.length} arquivos`);

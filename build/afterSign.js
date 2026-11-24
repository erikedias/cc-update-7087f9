// Assina o app final com assinatura "adhoc" (obrigatória em Mac Apple Silicon; sem isso o app aparece como "danificado").
// Com assinatura adhoc, o aviso na primeira abertura vira o "leve" (o passo 2 do pacote ensina a liberar).
const { execSync } = require("child_process");
const path = require("path");
exports.default = async function afterSign(context) {
  if (context.electronPlatformName !== "darwin") return;
  if (/-temp$/.test(path.basename(context.appOutDir))) return; // pastas temporárias do build universal
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  try { execSync(`codesign --deep --force --sign - "${app}"`, { stdio: "inherit" }); console.log("  • assinatura adhoc aplicada em " + app); }
  catch (e) { console.warn("  • aviso: não consegui assinar adhoc: " + e.message); }
};

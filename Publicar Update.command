#!/bin/bash
# Publica uma atualização: sobe o código novo pro GitHub; quem usa o app recebe ao abrir.
cd "$(dirname "$0")" || exit 1
export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

NOTES=$(osascript -e 'text returned of (display dialog "O que mudou nesta atualização? (aparece para o usuário)" default answer "Melhorias e correções" with title "Publicar atualização")' 2>/dev/null)
[ -z "$NOTES" ] && { echo "cancelado"; exit 0; }

# sobe a versão (0.9.0 -> 0.9.1) e gera o manifesto
node -e "const fs=require('fs');const p=require('./package.json');const v=p.version.split('.').map(Number);v[2]++;p.version=v.join('.');fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');"
node scripts/gen-update.js "$NOTES"
V=$(node -e "console.log(require('./package.json').version)")

git add -A && git commit -m "v$V — $NOTES" && git push origin main
if [ $? -eq 0 ]; then
  osascript -e "display notification \"v$V publicada — o time recebe ao abrir o app\" with title \"Central de Campanhas\"" 2>/dev/null
  echo "✅ v$V publicada com sucesso."
else
  echo "❌ Falhou ao publicar. Veja o erro acima."
fi
echo "(pode fechar esta janela)"

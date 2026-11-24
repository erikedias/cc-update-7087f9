// Assinatura "adhoc" só do app FINAL (feita no afterSign). Aqui não assina nada: no build universal,
// cada arquitetura é montada em pasta temporária e assinar antes da junção deixa os arquivos diferentes.
exports.default = async function afterPack() {};

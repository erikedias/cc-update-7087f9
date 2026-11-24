const { contextBridge, ipcRenderer } = require("electron");
const call = (ch) => (arg) => ipcRenderer.invoke(ch, arg);
contextBridge.exposeInMainWorld("api", {
  keysStatus: call("keys:status"), keysImportPainel: call("keys:importPainel"), keysExport: call("keys:export"), keysImportFile: call("keys:importFile"),
  settingsGet: call("settings:get"), settingsSet: call("settings:set"), uiGet: call("ui:get"), uiSet: call("ui:set"),
  clientsList: call("clients:list"), clientsSync: call("clients:sync"), clientsProjects: call("clients:projects"),
  clientsAdd: call("clients:add"), clientsSetProject: call("clients:setProject"), clientsSetAccounts: call("clients:setAccounts"),
  platform: call("data:platform"), metaVideo: call("meta:video"), metaTokenInfo: call("meta:tokenInfo"), metaExtend: call("meta:extendToken"),
  strategy: call("strategy:get"), strategyAI: call("strategy:ai"), vaultOpen: call("vault:open"), vaultPick: call("vault:pick"),
  linkedinConnect: call("linkedin:connect"), open: call("open:external"),
});
contextBridge.exposeInMainWorld("api2", {
  trelloBoards: () => ipcRenderer.invoke("trello:boards"),
  setTrello: (a) => ipcRenderer.invoke("clients:setTrello", a),
  setActive: (a) => ipcRenderer.invoke("clients:setActive", a),
  addFromTrello: (a) => ipcRenderer.invoke("clients:addFromTrello", a),
});
contextBridge.exposeInMainWorld("api3", { trelloDone: (a) => ipcRenderer.invoke("trello:done", a), trelloApproval: (a) => ipcRenderer.invoke("trello:approval", a) });
contextBridge.exposeInMainWorld("api4", { leadsGet: (a) => ipcRenderer.invoke("leads:get", a), leadsSetSheet: (a) => ipcRenderer.invoke("leads:setSheet", a) });
contextBridge.exposeInMainWorld("api5", { sheetsConnect: () => ipcRenderer.invoke("google:sheetsConnect"), sheetsDisconnect: () => ipcRenderer.invoke("google:sheetsDisconnect") });
contextBridge.exposeInMainWorld("api6", { updateInfo: () => ipcRenderer.invoke("update:info"), updateCheck: () => ipcRenderer.invoke("update:check"), updateApply: () => ipcRenderer.invoke("update:apply"), updateRollback: () => ipcRenderer.invoke("update:rollback") });
contextBridge.exposeInMainWorld("api7", { keysTest: (which) => ipcRenderer.invoke("keys:test", { which }), googleConnect: () => ipcRenderer.invoke("google:connect"), keysExportTeam: () => ipcRenderer.invoke("keys:exportTeam"), guideOpen: (a) => ipcRenderer.invoke("guide:open", a) });

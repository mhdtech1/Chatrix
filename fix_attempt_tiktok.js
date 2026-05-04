import { Project } from "ts-morph";

const project = new Project();
const runtimeFile = project.addSourceFileAtPath("apps/desktop/src/main/runtime.ts");
const tiktokFile = project.addSourceFileAtPath("apps/desktop/src/main/services/tiktok.ts");


const varDecl = tiktokFile.getVariableDeclaration("attemptTikTokBrowserSignIn");
if (varDecl) {
    varDecl.getVariableStatement().setIsExported(true);
} else {
    tiktokFile.addVariableStatement({
        declarationKind: "const",
        declarations: [{
            name: "attemptTikTokBrowserSignIn",
            initializer: `() => {
              const loginWindow = new BrowserWindow({
                width: 500,
                height: 700,
                show: true,
                parent: mainWindow ?? undefined,
                modal: true,
                webPreferences: {
                  partition: TIKTOK_AUTH_PARTITION,
                },
              });
              loginWindow.loadURL(TIKTOK_LOGIN_URL);
            }`
        }],
        isExported: true
    });
}


project.saveSync();

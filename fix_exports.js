import { Project } from "ts-morph";

const project = new Project();
const runtimeFile = project.addSourceFileAtPath("apps/desktop/src/main/runtime.ts");
const shellFile = project.addSourceFileAtPath("apps/desktop/src/renderer/ui/layouts/ChatShell.tsx");
const emotesFile = project.addSourceFileAtPath("apps/desktop/src/renderer/ui/utils/emotes.ts");
const historyFile = project.addSourceFileAtPath("apps/desktop/src/renderer/ui/utils/history.ts");

const makeExported = (file, name) => {
    const varDecl = file.getVariableDeclaration(name);
    if (varDecl) {
        varDecl.getVariableStatement().setIsExported(true);
    }
}

makeExported(runtimeFile, "mainWindow");
makeExported(runtimeFile, "IPC_CHANNELS");
makeExported(runtimeFile, "bringAppToFrontAfterOAuth");

makeExported(shellFile, "asRecord");
makeExported(shellFile, "normalizeOauthToken");
makeExported(shellFile, "createId");


emotesFile.insertStatements(0, `import { asRecord, normalizeOauthToken } from "../layouts/ChatShell.jsx";\n`);
historyFile.insertStatements(0, `import { createId } from "../layouts/ChatShell.jsx";\n`);

project.saveSync();

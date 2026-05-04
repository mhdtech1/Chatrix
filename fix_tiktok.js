import { Project } from "ts-morph";

const project = new Project();
const tiktokFile = project.addSourceFileAtPath("apps/desktop/src/main/services/tiktok.ts");

tiktokFile.insertStatements(0, `import { shell } from "electron";
import { IPC_CHANNELS } from "../../shared/constants.js";
import { mainWindow, store, bringAppToFrontAfterOAuth } from "../runtime.js";
`);

project.saveSync();

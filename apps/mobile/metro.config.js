// Metro-Konfiguration für das pnpm-Monorepo: Workspace-Packages (packages/*) werden aus dem Quelltext geladen.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Änderungen in packages/* werden beobachtet und neu gebündelt.
config.watchFolders = [workspaceRoot];
// Auflösung zuerst im App-node_modules, dann im Repo-Root (pnpm-Hoisting).
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules"), path.resolve(workspaceRoot, "node_modules")];
// pnpm legt Pakete als Symlinks ab; Metro folgt ihnen.
config.resolver.unstable_enableSymlinks = true;
config.resolver.sourceExts = Array.from(new Set([...config.resolver.sourceExts, "mjs", "cjs"]));

module.exports = config;

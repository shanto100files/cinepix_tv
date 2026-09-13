import { execSync } from "child_process";
import { existsSync, writeFileSync, readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const windowsResourcesDir = join(rootDir, "src-tauri", "resources", "windows");
const vcRedistPath = join(windowsResourcesDir, "vc_redist.x64.exe");
const vcRedistUrl = "https://aka.ms/vs/17/release/vc_redist.x64.exe";
const cliPaths = [
  join(rootDir, "node_modules", "tauri-plugin-libmpv-api", "dist-js", "cli.js"),
  join(
    rootDir,
    "node_modules",
    "tauri-plugin-libmpv-api",
    "dist-js",
    "cli.cjs",
  ),
];

for (const cliPath of cliPaths) {
  if (!existsSync(cliPath)) continue;

  // Pin a real release so CI does not change underneath us when `latest` moves.
  // This release contains the non-v3 mpv-dev-lgpl-x86_64 archive expected by
  // tauri-plugin-libmpv-api 0.3.2.
  const PINNED_MPV_TAG = "2026-08-06-21277b0ccf";
  const PINNED_URL = `https://github.com/zhongfly/mpv-winbuild/releases/download/${PINNED_MPV_TAG}`;

  let content = readFileSync(cliPath, "utf-8");
  const mpvBaseUrlPattern =
    /const MPV_BASE_URL = ["']https:\/\/github\.com\/zhongfly\/mpv-winbuild\/releases\/(?:latest\/download|download\/[^"']+)["'];/;
  const patchedBaseUrl = `const MPV_BASE_URL = "${PINNED_URL}";`;
  if (mpvBaseUrlPattern.test(content)) {
    content = content.replace(mpvBaseUrlPattern, patchedBaseUrl);
    writeFileSync(cliPath, content, "utf-8");
    console.log(
      `[setup-lib] Pinned mpv-winbuild to release: ${PINNED_MPV_TAG} in ${cliPath}`,
    );
  }
}

if (process.platform === "win32" && !existsSync(vcRedistPath)) {
  console.log(
    "[setup-lib] Downloading Microsoft Visual C++ Redistributable...",
  );
  mkdirSync(windowsResourcesDir, { recursive: true });
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const response = await fetch(vcRedistUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      console.warn(
        `[setup-lib] Failed to download VC++ Redistributable: ${response.status} (skipping)`,
      );
    } else {
      writeFileSync(vcRedistPath, Buffer.from(await response.arrayBuffer()));
      console.log("[setup-lib] VC++ Redistributable downloaded successfully");
    }
  } catch (e) {
    console.warn(
      `[setup-lib] VC++ Redistributable download failed: ${e.message} (skipping)`,
    );
  }
}

try {
  execSync("npx tauri-plugin-libmpv-api setup-lib", {
    stdio: "inherit",
    cwd: rootDir,
  });
} catch (e) {
  console.warn(
    `[setup-lib] tauri-plugin-libmpv-api setup-lib failed: ${e.message} (skipping)`,
  );
}

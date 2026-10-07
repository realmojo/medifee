/**
 * lib/topics/ (TypeScript) 를 노드 스크립트에서 읽는다.
 *
 * 주제 목록을 스크립트마다 손으로 베끼면 언젠가 어긋난다. esbuild 로 그 자리에서
 * 묶어 data: URL 로 불러온다. lib/topics/ 가 `@/` 경로를 쓰지 않는 이유다.
 */
import path from "node:path";
import { build } from "esbuild";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

export async function loadTopics() {
  const out = await build({
    entryPoints: [path.join(ROOT, "lib/topics/index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
    logLevel: "silent",
  });
  const code = out.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
}

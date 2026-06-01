import type { DisplayBlock, Project, RenderOptions, Speaker } from "../types/project";
import { getSpeakerMap } from "./anonymize";
import { buildDisplayBlocks } from "./buildDisplayBlocks";

export const escapeHtml = (value = "") =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const classNameForSide = (speakerIndex: number, speaker: Speaker, options: RenderOptions) => {
  if (options.theme === "minimal") {
    if (speaker.position !== "auto") return `cw-${speaker.position}`;
    return speakerIndex === 0 ? "cw-right" : "cw-left";
  }
  if (speaker.position !== "auto") return `cw-${speaker.position}`;
  return "cw-stack";
};

const getFontBase = (options: RenderOptions) => {
  if (options.fontSize === "small") return "10.5pt";
  if (options.fontSize === "large") return "12.75pt";
  return "11.25pt";
};

function renderBlock(block: DisplayBlock, speakers: Speaker[], options: RenderOptions) {
  const speakerIndex = Math.max(0, speakers.findIndex((speaker) => speaker.id === block.speakerId));
  const speaker = speakers[speakerIndex];
  if (!speaker) return "";
  const speakerMap = getSpeakerMap(speakers, options);
  const displaySpeaker = speakerMap.get(block.speakerId);
  if (!displaySpeaker) return "";

  const side = classNameForSide(speakerIndex, speaker, options);
  const widthClass = `cw-width-${options.bubbleWidth}`;
  const fallbackAvatarText = options.anonymizeMode === "off" ? displaySpeaker.visibleName.trim().charAt(0) || "+" : displaySpeaker.anonymousInitial;
  const avatar = options.showAvatar
    ? displaySpeaker.visibleAvatarDataUrl
      ? `<img class="cw-avatar-img" src="${escapeHtml(displaySpeaker.visibleAvatarDataUrl)}" alt="" />`
      : `<span class="cw-avatar-letter">${escapeHtml(fallbackAvatarText)}</span>`
    : "";
  const header = options.showName || options.showHandle
    ? `<div class="cw-meta">${options.showName ? `<strong>${escapeHtml(displaySpeaker.visibleName)}</strong>` : ""}${
        options.showHandle && displaySpeaker.visibleHandle ? `<span>${escapeHtml(displaySpeaker.visibleHandle)}</span>` : ""
      }</div>`
    : "";

  const bubbles =
    options.mergeMode === "mergeText"
      ? `<p>${escapeHtml(block.mergedText).replaceAll("\n", "<br />")}</p>`
      : block.messages.map((message) => `<p>${escapeHtml(message.text).replaceAll("\n", "<br />")}</p>`).join("");
  const time = options.showTime ? block.messages.map((message) => message.timestampText).filter(Boolean).at(-1) : "";

  return `<article class="cw-block ${side} ${widthClass}" style="--cw-speaker:${speaker.color || "#5B7CFA"}">
    <div class="cw-avatar">${avatar}</div>
    <div class="cw-content">${header}<div class="cw-bubbles">${bubbles}</div>${time ? `<time>${escapeHtml(time)}</time>` : ""}</div>
  </article>`;
}

const buildArchiveCss = (scope = "") => `
    ${scope}.cw-viewer { max-width: 760px; margin: 0 auto; padding: 36px 22px 64px; font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #202124; }
    ${scope} .cw-title { margin: 0 0 24px; font-size: 24px; line-height: 1.35; }
    ${scope} .cw-block { display: flex; gap: 10px; margin: 14px 0; align-items: flex-start; }
    ${scope} .cw-right { flex-direction: row-reverse; text-align: right; }
    ${scope} .cw-stack { text-align: left; }
    ${scope} .cw-avatar { width: 36px; height: 36px; flex: 0 0 36px; border-radius: 50%; background: var(--cw-speaker); color: #fff; display: grid; place-items: center; overflow: hidden; font-weight: 800; }
    ${scope} .cw-avatar:empty { display: none; }
    ${scope} .cw-avatar-img { width: 100%; height: 100%; object-fit: cover; }
    ${scope} .cw-content { max-width: 72%; }
    ${scope} .cw-width-narrow .cw-content { max-width: 58%; }
    ${scope} .cw-width-normal .cw-content { max-width: 72%; }
    ${scope} .cw-width-wide .cw-content { max-width: 88%; }
    ${scope} .cw-meta { display: flex; gap: 8px; margin: 0 0 5px; font-size: 13px; color: #6b625b; }
    ${scope} .cw-right .cw-meta { justify-content: flex-end; }
    ${scope} .cw-bubbles p { margin: 0 0 5px; padding: 10px 12px; border-radius: 16px; background: #fff; box-shadow: 0 1px 8px rgba(50, 44, 38, .08); line-height: 1.62; white-space: normal; word-break: keep-all; overflow-wrap: anywhere; font-size: calc(var(--cw-font-base, 11.25pt) + var(--cw-font-delta, 0pt)); }
    ${scope} .cw-right .cw-bubbles p { background: #dce7ff; }
    ${scope} time { display: block; margin-top: 3px; font-size: 12px; color: #817973; }
    ${scope}.cw-theme-chatlog { background: #fff; }
    ${scope}.cw-theme-chatlog .cw-title { padding-bottom: 18px; border-bottom: 1px solid #e5e8ee; }
    ${scope}.cw-theme-chatlog .cw-block { margin: 0; padding: 9px 8px; border-radius: 6px; }
    ${scope}.cw-theme-chatlog .cw-block:hover { background: #f5f7fa; }
    ${scope}.cw-theme-chatlog .cw-right { flex-direction: row; text-align: left; }
    ${scope}.cw-theme-chatlog .cw-meta, ${scope}.cw-theme-chatlog .cw-right .cw-meta { justify-content: flex-start; margin-bottom: 2px; }
    ${scope}.cw-theme-chatlog .cw-meta strong { color: var(--cw-speaker); }
    ${scope}.cw-theme-chatlog .cw-bubbles p, ${scope}.cw-theme-chatlog .cw-right .cw-bubbles p { margin: 0; padding: 1px 0; border-radius: 0; background: transparent; box-shadow: none; line-height: 1.5; }
    ${scope}.cw-dark { background: #161b22; color: #eef1f5; }
    ${scope}.cw-dark .cw-title { color: #eef1f5; }
    ${scope}.cw-dark .cw-bubbles p { background: #262d37; color: #eef1f5; box-shadow: none; }
    ${scope}.cw-dark .cw-right .cw-bubbles p { background: #243857; }
    ${scope}.cw-dark .cw-meta, ${scope}.cw-dark time { color: #a9b0bb; }
    ${scope}.cw-dark.cw-theme-chatlog .cw-bubbles p, ${scope}.cw-dark.cw-theme-chatlog .cw-right .cw-bubbles p { background: transparent; }
`;

const renderArchiveBody = (project: Project) => {
  const blocks = buildDisplayBlocks(project.messages, project.renderOptions);
  const body = blocks.map((block) => renderBlock(block, project.speakers, project.renderOptions)).join("\n");
  return `<main class="cw-viewer cw-theme-${escapeHtml(project.renderOptions.theme)} ${project.renderOptions.darkMode ? "cw-dark" : ""}" style="--cw-font-base:${getFontBase(project.renderOptions)};--cw-font-delta:${project.renderOptions.fontSizeDelta || 0}pt">
    <h1 class="cw-title">${escapeHtml(project.title || "Chat Weave Backup")}</h1>
    ${body || "<p>표시할 메시지가 없습니다.</p>"}
  </main>`;
};

export function buildViewerHtml(project: Project) {
  const data = escapeHtml(JSON.stringify(project));

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(project.title || "Chat Weave Backup")}</title>
  <style>
    :root { color-scheme: light dark; font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f5f2ec; color: #202124; }
${buildArchiveCss("")}
    script[type="application/json"] { display: none; }
  </style>
</head>
<body>
  ${renderArchiveBody(project)}
  <script type="application/json" id="chat-weave-project">${data}</script>
</body>
</html>`;
}

export function buildTistoryHtml(project: Project) {
  return `<style>
${buildArchiveCss(".cw-tistory-archive ")}
</style>
<div class="cw-tistory-archive">
  ${renderArchiveBody(project)}
</div>`;
}

export function downloadTextFile(filename: string, text: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

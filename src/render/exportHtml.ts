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
  // 프로필 이미지는 블록마다 Data URL을 반복하지 않고 화자별 클래스(cw-spk-N)로 참조한다.
  // 실제 이미지는 buildAvatarCss가 화자당 한 번만 정의한다.
  const hasAvatarImg = options.showAvatar && Boolean(displaySpeaker.visibleAvatarDataUrl);
  const avatarClass = hasAvatarImg ? ` cw-photo cw-spk-${speakerIndex}` : "";
  const avatar = options.showAvatar && !hasAvatarImg
    ? `<span class="cw-avatar-letter">${escapeHtml(fallbackAvatarText)}</span>`
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
    <div class="cw-avatar${avatarClass}">${avatar}</div>
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
    ${scope} .cw-avatar.cw-photo:empty { display: grid; background-size: cover; background-position: center; }
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

// 화자별 프로필 이미지를 Data URL로 한 번씩만 정의한다.
// 메시지 수와 무관하게 이미지가 화자 수(최대 4회)만 삽입되도록 해 용량 폭발을 막는다.
const buildAvatarCss = (project: Project, scope = "") => {
  if (!project.renderOptions.showAvatar) return "";
  const speakerMap = getSpeakerMap(project.speakers, project.renderOptions);
  return project.speakers
    .map((speaker, index) => {
      const dataUrl = speakerMap.get(speaker.id)?.visibleAvatarDataUrl;
      if (!dataUrl) return "";
      return `${scope} .cw-spk-${index} { background-image: url("${dataUrl}"); }`;
    })
    .filter(Boolean)
    .join("\n");
};

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
${buildAvatarCss(project, "")}
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
${buildAvatarCss(project, ".cw-tistory-archive ")}
</style>
<div class="cw-tistory-archive">
  ${renderArchiveBody(project)}
</div>`;
}

export type ExportSizeLevel = "safe" | "warn" | "danger";

export type ExportSizeInfo = {
  bytes: number;
  text: string;
  level: ExportSizeLevel;
  message: string;
};

// 관측상 약 150KB 부근에서 티스토리 저장이 실패하므로 그 아래로 안전/주의/위험 구간을 나눈다.
const SIZE_WARN = 100 * 1024;
const SIZE_DANGER = 150 * 1024;

export function getExportSizeInfo(html: string): ExportSizeInfo {
  const bytes = new Blob([html]).size;
  const kb = bytes / 1024;
  const text = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
  if (bytes >= SIZE_DANGER) {
    return { bytes, text, level: "danger", message: "티스토리 저장이 실패할 수 있는 크기입니다. 대화를 나눠서 내보내세요." };
  }
  if (bytes >= SIZE_WARN) {
    return { bytes, text, level: "warn", message: "용량이 큽니다. 저장이 안 되면 대화를 나눠서 내보내세요." };
  }
  return { bytes, text, level: "safe", message: "안전한 크기입니다." };
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

import type { Platform, RenderOptions, Speaker } from "../types/project";

export const speakerColors = ["#5B7CFA", "#F07378", "#2F9E75", "#A66CFF"];

export const createSpeaker = (index: number): Speaker => ({
  id: crypto.randomUUID(),
  displayName: "",
  handle: "",
  position: "auto",
  color: speakerColors[index % speakerColors.length],
});

export const getDefaultRenderOptions = (platform: Platform): RenderOptions => ({
  showTime: true,
  showName: true,
  showHandle: platform === "x",
  showAvatar: true,
  anonymizeMode: "off",
  layoutMode: "stack",
  speakerPositionMode: "auto",
  mergeMode: "groupVisual",
  mergeTimeWindow: "off",
  theme: "chatlog",
  darkMode: false,
  fontSize: "medium",
  fontSizeDelta: 0,
  bubbleWidth: platform === "discord" ? "wide" : "normal",
});

import type { Platform, Speaker, UnmatchedBlock } from "../types/project";

export const normalizeHandle = (handle = "") => {
  const trimmed = handle.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed.toLowerCase() : `@${trimmed.toLowerCase()}`;
};

export const isTimeLike = (line: string) =>
  /(오전|오후|오늘|어제|\d{1,2}:\d{2}|\d{4}년|\d{1,2}월\s*\d{1,2}일|\d+\s*(초|분|시간|일)전?|AM|PM)/i.test(line);

export const makeId = (prefix: string, index: number) => `${prefix}-${index}-${crypto.randomUUID()}`;

export const getNonEmptyLines = (rawText: string) =>
  rawText
    .split(/\r?\n/)
    .map((text, index) => ({ text: text.trim(), lineNumber: index + 1 }))
    .filter((line) => line.text.length > 0);

export const findSpeakerByName = (line: string, speakers: Speaker[]) => {
  const normalized = line.trim().toLowerCase();
  return speakers.find((speaker) => speaker.displayName.trim().toLowerCase() === normalized);
};

export const createUnmatched = (
  platform: Platform,
  text: string,
  sourceLines: number[],
  reason: string,
  index: number,
): UnmatchedBlock => ({
  id: makeId("unmatched", index),
  sourcePlatform: platform,
  text,
  sourceLines,
  reason,
});

export const compactUnmatchedText = (lines: { text: string; lineNumber: number }[]) => ({
  text: lines.map((line) => line.text).join("\n"),
  sourceLines: lines.map((line) => line.lineNumber),
});

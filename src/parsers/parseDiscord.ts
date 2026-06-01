import type { Message, ParseResult, Speaker } from "../types/project";
import { compactUnmatchedText, createUnmatched, findSpeakerByName, getNonEmptyLines, isTimeLike, makeId } from "./parseCommon";

const systemNoise = [
  /새 메시지/,
  /메시지 불러오는 중/,
  /님이 서버에 참가했습니다/,
  /님이 통화에 참여했습니다/,
  /님이 채널 이름을 변경했습니다/,
  /고정된 메시지/,
];

const isSystemNoise = (line: string) => systemNoise.some((pattern) => pattern.test(line));
const cleanTimestamp = (line: string) => line.replace(/^[—-]\s*/, "").trim();

const detectMessageStart = (line: string, speakers: Speaker[]) => {
  const exactSpeaker = findSpeakerByName(line, speakers);
  if (exactSpeaker) {
    return {
      speaker: exactSpeaker,
      rawSpeakerName: line,
      timestampText: "",
      mode: "name-line" as const,
    };
  }

  for (const speaker of speakers) {
    const name = speaker.displayName.trim();
    if (!name) continue;
    const normalizedLine = line.trim();
    const prefix = `${name} `;
    if (!normalizedLine.startsWith(prefix)) continue;
    const rest = normalizedLine.slice(prefix.length).trim();
    if (!/^[—-]\s*/.test(rest)) continue;
    const timestampText = cleanTimestamp(rest);
    if (!isTimeLike(timestampText)) continue;
    return {
      speaker,
      rawSpeakerName: name,
      timestampText,
      mode: "combined-line" as const,
    };
  }

  return undefined;
};

export function parseDiscord(rawText: string, speakers: Speaker[]): ParseResult {
  const lines = getNonEmptyLines(rawText);
  const messages: Message[] = [];
  const unmatchedBlocks = [];
  const consumed = new Set<number>();
  let cursor = 0;

  while (cursor < lines.length) {
    const startInfo = detectMessageStart(lines[cursor].text, speakers);
    if (!startInfo) {
      cursor += 1;
      continue;
    }

    const start = cursor;
    cursor += 1;
    let timestampText = startInfo.timestampText;
    if (startInfo.mode === "name-line" && lines[cursor] && isTimeLike(cleanTimestamp(lines[cursor].text))) {
      timestampText = cleanTimestamp(lines[cursor].text);
      cursor += 1;
    }

    const bodyLines: typeof lines = [];
    while (cursor < lines.length && !detectMessageStart(lines[cursor].text, speakers)) {
      if (!isSystemNoise(lines[cursor].text)) bodyLines.push(lines[cursor]);
      cursor += 1;
    }

    const text = bodyLines.map((line) => line.text).join("\n").trim();
    for (let index = start; index < cursor; index += 1) consumed.add(index);
    if (!text) continue;

    messages.push({
      id: makeId("discord-message", messages.length),
      speakerId: startInfo.speaker.id,
      rawSpeakerName: startInfo.rawSpeakerName,
      text,
      timestampText,
      sourcePlatform: "discord",
      sourceLines: lines.slice(start, cursor).map((line) => line.lineNumber),
      confidence: 0.82,
    });
  }

  let unmatchedBuffer: typeof lines = [];
  lines.forEach((line, index) => {
    if (consumed.has(index) || isSystemNoise(line.text)) {
      if (unmatchedBuffer.length) {
        const block = compactUnmatchedText(unmatchedBuffer);
        unmatchedBlocks.push(
          createUnmatched("discord", block.text, block.sourceLines, "등록된 화자 이름과 연결되지 않았습니다.", unmatchedBlocks.length),
        );
        unmatchedBuffer = [];
      }
      return;
    }
    unmatchedBuffer.push(line);
  });
  if (unmatchedBuffer.length) {
    const block = compactUnmatchedText(unmatchedBuffer);
    unmatchedBlocks.push(createUnmatched("discord", block.text, block.sourceLines, "등록된 화자 이름과 연결되지 않았습니다.", unmatchedBlocks.length));
  }

  return { messages, unmatchedBlocks };
}

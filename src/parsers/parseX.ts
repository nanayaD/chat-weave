import type { Message, ParseResult, Speaker } from "../types/project";
import { compactUnmatchedText, createUnmatched, findSpeakerByName, getNonEmptyLines, isTimeLike, makeId, normalizeHandle } from "./parseCommon";

const noisePatterns = [
  /^홈$/,
  /^검색$/,
  /^알림$/,
  /^쪽지$/,
  /^더 보기$/,
  /^번역하기$/,
  /^답글$/,
  /^재게시$/,
  /^마음에 들어요$/,
  /^북마크$/,
  /^조회수$/,
  /^프로모션$/,
  /^관련 게시물$/,
  /^팔로우$/,
  /^추천$/,
  /^·$/,
  /^출처:/,
  /^조회수\s*[\d,]+회?$/,
  /^[\d,]+\s*조회수$/,
  /^조회수$/,
  /^[\d,]+\s*$/,
  /^[\d,]+\s*(답글|재게시|마음에 들어요|북마크)$/,
  /^\d+$/,
];

const isNoise = (line: string) => noisePatterns.some((pattern) => pattern.test(line.trim()));
const isHandleLine = (line: string) => /^@[A-Za-z0-9_]{1,30}$/.test(line.trim());
const isUnmatchedContextLine = (line: string) => line.trim() === "·" || isTimeLike(line);

export function parseX(rawText: string, speakers: Speaker[]): ParseResult {
  const lines = getNonEmptyLines(rawText);
  const handleMap = new Map(
    speakers
      .map((speaker) => [normalizeHandle(speaker.handle), speaker] as const)
      .filter(([handle]) => handle.length > 1),
  );
  const handleEntries = lines
    .map((line, index) => ({
      line,
      index,
      nameIndex: Math.max(0, index - 1),
      speaker: handleMap.get(normalizeHandle(line.text)),
      matchedByName: false,
    }))
    .filter((entry): entry is typeof entry & { speaker: Speaker } => Boolean(entry.speaker));
  const nameHandleEntries = lines
    .map((line, index) => {
      const speaker = findSpeakerByName(line.text, speakers);
      const handleLine = lines[index + 1];
      if (!speaker || !handleLine || !isHandleLine(handleLine.text)) return undefined;
      const registeredHandle = normalizeHandle(speaker.handle);
      const copiedHandle = normalizeHandle(handleLine.text);
      if (registeredHandle && registeredHandle !== copiedHandle) return undefined;
      return {
        line: handleLine,
        index: index + 1,
        nameIndex: index,
        speaker,
        matchedByName: true,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const entryMap = new Map<number, (typeof handleEntries)[number] | (typeof nameHandleEntries)[number]>();
  [...handleEntries, ...nameHandleEntries].forEach((entry) => {
    const existing = entryMap.get(entry.index);
    if (!existing || entry.matchedByName) entryMap.set(entry.index, entry);
  });
  const handleIndexes = [...entryMap.values()].sort((a, b) => a.index - b.index);
  const allHandleIndexes = lines
    .map((line, index) => ({ line, index, nameIndex: Math.max(0, index - 1) }))
    .filter((entry) => isHandleLine(entry.line.text));

  const messages: Message[] = [];
  const unmatchedBlocks = [];
  const consumed = new Set<number>();

  handleIndexes.forEach((entry, messageIndex) => {
    const nextHandleEntry = allHandleIndexes.find((candidate) => candidate.index > entry.index);
    const endIndex = nextHandleEntry ? nextHandleEntry.nameIndex : lines.length;
    const blockLines = lines.slice(entry.index + 1, endIndex);
    const textLines: string[] = [];
    const sourceLines: number[] = [entry.line.lineNumber];
    let timestampText = "";

    if (entry.nameIndex < entry.index) {
      consumed.add(entry.nameIndex);
      sourceLines.push(lines[entry.nameIndex].lineNumber);
    }
    consumed.add(entry.index);

    blockLines.forEach((line) => {
      consumed.add(lines.indexOf(line));
      sourceLines.push(line.lineNumber);
      if (!timestampText && isTimeLike(line.text)) {
        timestampText = line.text;
        return;
      }
      if (isNoise(line.text)) return;
      textLines.push(line.text);
    });

    const text = textLines.join("\n").trim();
    if (!text) return;
    messages.push({
      id: makeId("x-message", messageIndex),
      speakerId: entry.speaker.id,
      rawSpeakerName: lines[entry.nameIndex]?.text,
      rawHandle: entry.line.text,
      text,
      timestampText,
      sourcePlatform: "x",
      sourceLines,
      confidence: entry.matchedByName ? 0.92 : 0.86,
    });
  });

  const unmatchedBuffer: { text: string; lineNumber: number }[] = [];
  lines.forEach((line, index) => {
    if (consumed.has(index) || (isNoise(line.text) && !isUnmatchedContextLine(line.text))) {
      if (unmatchedBuffer.length) {
        const block = compactUnmatchedText(unmatchedBuffer);
        unmatchedBlocks.push(createUnmatched("x", block.text, block.sourceLines, "등록된 닉네임/아이디와 연결되지 않았습니다.", unmatchedBlocks.length));
        unmatchedBuffer.length = 0;
      }
      return;
    }
    unmatchedBuffer.push(line);
  });
  if (unmatchedBuffer.length) {
    const block = compactUnmatchedText(unmatchedBuffer);
    unmatchedBlocks.push(createUnmatched("x", block.text, block.sourceLines, "등록된 닉네임/아이디와 연결되지 않았습니다.", unmatchedBlocks.length));
  }

  return { messages, unmatchedBlocks };
}

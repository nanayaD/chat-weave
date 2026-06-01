import type { ParseResult, Platform, Speaker } from "../types/project";
import { parseDiscord } from "./parseDiscord";
import { parseX } from "./parseX";

export function parseRawText(platform: Platform, rawText: string, speakers: Speaker[]): ParseResult {
  return platform === "x" ? parseX(rawText, speakers) : parseDiscord(rawText, speakers);
}


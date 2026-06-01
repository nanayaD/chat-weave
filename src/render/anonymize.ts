import type { RenderOptions, Speaker } from "../types/project";

export type DisplaySpeaker = Speaker & {
  visibleName: string;
  visibleHandle: string;
  visibleAvatarDataUrl?: string;
  anonymousInitial: string;
};

export function getDisplaySpeaker(speaker: Speaker, index: number, options: RenderOptions): DisplaySpeaker {
  const letters = ["A", "B", "C", "D"];
  const anonymousInitial = letters[index] ?? `A`;
  const isAnonymous = options.anonymizeMode !== "off";

  return {
    ...speaker,
    visibleName: isAnonymous ? speaker.anonymousName || anonymousInitial : speaker.displayName,
    visibleHandle: isAnonymous ? "" : speaker.handle || "",
    visibleAvatarDataUrl: isAnonymous ? undefined : speaker.avatarDataUrl,
    anonymousInitial,
  };
}

export function getSpeakerMap(speakers: Speaker[], options: RenderOptions) {
  return new Map(speakers.map((speaker, index) => [speaker.id, getDisplaySpeaker(speaker, index, options)]));
}

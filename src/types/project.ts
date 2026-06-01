export type Platform = "x" | "discord";

export type Speaker = {
  id: string;
  displayName: string;
  handle?: string;
  avatarDataUrl?: string;
  position: "auto" | "left" | "right";
  color?: string;
  anonymousName?: string;
};

export type Message = {
  id: string;
  speakerId: string;
  rawSpeakerName?: string;
  rawHandle?: string;
  text: string;
  timestampText?: string;
  sourcePlatform: Platform;
  sourceLines: number[];
  confidence: number;
};

export type UnmatchedBlock = {
  id: string;
  sourcePlatform: Platform;
  text: string;
  sourceLines: number[];
  reason: string;
};

export type RenderOptions = {
  showTime: boolean;
  showName: boolean;
  showHandle: boolean;
  showAvatar: boolean;
  anonymizeMode: "off" | "letters";
  layoutMode: "stack";
  speakerPositionMode: "auto" | "manual";
  mergeMode: "none" | "groupVisual" | "mergeText";
  mergeTimeWindow: "off";
  theme: "minimal" | "chatlog";
  darkMode: boolean;
  fontSize: "small" | "medium" | "large";
  fontSizeDelta: number;
  bubbleWidth: "narrow" | "normal" | "wide";
};

export type DisplayBlock = {
  id: string;
  speakerId: string;
  messages: Message[];
  mergedText: string;
  grouped: boolean;
};

export type Project = {
  version: string;
  title: string;
  platform: Platform;
  speakers: Speaker[];
  rawText: string;
  messages: Message[];
  unmatchedBlocks?: UnmatchedBlock[];
  renderOptions: RenderOptions;
  createdAt?: string;
  updatedAt?: string;
};

export type ParseResult = {
  messages: Message[];
  unmatchedBlocks: UnmatchedBlock[];
};

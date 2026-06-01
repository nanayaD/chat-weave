import type { DisplayBlock, Message, RenderOptions } from "../types/project";

export function buildDisplayBlocks(messages: Message[], options: RenderOptions): DisplayBlock[] {
  if (options.mergeMode === "none") {
    return messages.map((message) => ({
      id: message.id,
      speakerId: message.speakerId,
      messages: [message],
      mergedText: message.text,
      grouped: false,
    }));
  }

  const blocks: DisplayBlock[] = [];
  messages.forEach((message) => {
    const last = blocks[blocks.length - 1];
    if (last && last.speakerId === message.speakerId) {
      last.messages.push(message);
      last.mergedText = last.messages.map((item) => item.text).join("\n\n");
      last.grouped = true;
      return;
    }

    blocks.push({
      id: `block-${message.id}`,
      speakerId: message.speakerId,
      messages: [message],
      mergedText: message.text,
      grouped: false,
    });
  });

  return blocks;
}


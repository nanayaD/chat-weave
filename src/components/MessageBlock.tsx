import { getSpeakerMap } from "../render/anonymize";
import type { DisplayBlock, RenderOptions, Speaker } from "../types/project";

type MessageBlockProps = {
  block: DisplayBlock;
  speakers: Speaker[];
  options: RenderOptions;
  onMessageSelect: (sourceLines: number[]) => void;
};

const getSide = (speaker: Speaker, index: number, options: RenderOptions) => {
  if (options.theme === "minimal") {
    if (speaker.position !== "auto") return speaker.position;
    return index === 0 ? "right" : "left";
  }
  if (speaker.position !== "auto") return speaker.position;
  return "stack";
};

export function MessageBlock({ block, speakers, options, onMessageSelect }: MessageBlockProps) {
  const speakerIndex = Math.max(0, speakers.findIndex((speaker) => speaker.id === block.speakerId));
  const speaker = speakers[speakerIndex];
  const displaySpeaker = getSpeakerMap(speakers, options).get(block.speakerId);
  if (!speaker || !displaySpeaker) return null;
  const side = getSide(speaker, speakerIndex, options);
  const messages = options.mergeMode === "mergeText" ? [{ id: block.id, text: block.mergedText, timestampText: block.messages.at(-1)?.timestampText }] : block.messages;
  const fallbackAvatarText = options.anonymizeMode === "off" ? displaySpeaker.visibleName.trim().charAt(0) || "+" : displaySpeaker.anonymousInitial;

  return (
    <article
      className={`message-block ${side}`}
      data-block-message-ids={block.messages.map((message) => message.id).join(" ")}
      title="클릭하면 원문 위치로 이동합니다."
      role="button"
      tabIndex={0}
      onClick={() => onMessageSelect(block.messages.flatMap((message) => message.sourceLines))}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onMessageSelect(block.messages.flatMap((message) => message.sourceLines));
        }
      }}
      style={{ "--speaker-color": speaker.color || "#5B7CFA" } as React.CSSProperties}
    >
      {options.showAvatar ? (
        <div className="avatar">
          {displaySpeaker.visibleAvatarDataUrl ? <img src={displaySpeaker.visibleAvatarDataUrl} alt="" /> : <span>{fallbackAvatarText}</span>}
        </div>
      ) : null}
      <div className="message-content">
        {options.showName || options.showHandle ? (
          <div className="message-meta">
            {options.showName ? <strong>{displaySpeaker.visibleName}</strong> : null}
            {options.showHandle && displaySpeaker.visibleHandle ? <span>{displaySpeaker.visibleHandle}</span> : null}
          </div>
        ) : null}
        <div className="bubble-stack">
          {messages.map((message) => (
            <p
              key={message.id}
              data-message-id={message.id}
              onClick={(event) => {
                event.stopPropagation();
                const originalMessage = block.messages.find((item) => item.id === message.id);
                onMessageSelect(originalMessage?.sourceLines || block.messages.flatMap((item) => item.sourceLines));
              }}
            >
              {message.text}
            </p>
          ))}
        </div>
        {options.showTime ? <time>{block.messages.map((message) => message.timestampText).filter(Boolean).at(-1)}</time> : null}
      </div>
    </article>
  );
}

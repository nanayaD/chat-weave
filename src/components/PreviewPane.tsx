import { buildDisplayBlocks } from "../render/buildDisplayBlocks";
import type { DisplayBlock, Message, RenderOptions, Speaker, UnmatchedBlock } from "../types/project";
import { MessageBlock } from "./MessageBlock";

type PreviewPaneProps = {
  title: string;
  speakers: Speaker[];
  messages: Message[];
  unmatchedBlocks: UnmatchedBlock[];
  options: RenderOptions;
  onMessageSelect: (sourceLines: number[]) => void;
};

type PreviewItem =
  | { kind: "message"; block: DisplayBlock; firstLine: number }
  | { kind: "unmatched"; block: UnmatchedBlock; firstLine: number };

const getFirstLine = (sourceLines: number[]) => Math.min(...sourceLines);

function UnmatchedPreviewBlock({ block, onSelect }: { block: UnmatchedBlock; onSelect: (sourceLines: number[]) => void }) {
  return (
    <article
      className="message-block stack unmatched-preview-block"
      data-unmatched-id={block.id}
      title="클릭하면 원문 위치로 이동합니다."
      role="button"
      tabIndex={0}
      onClick={() => onSelect(block.sourceLines)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(block.sourceLines);
        }
      }}
    >
      <div className="avatar unmatched-avatar">?</div>
      <div className="message-content">
        <div className="message-meta">
          <strong>불확실 항목</strong>
          <span>{block.sourceLines.join(", ")}행</span>
        </div>
        <div className="bubble-stack">
          <p>{block.text}</p>
        </div>
      </div>
    </article>
  );
}

export function PreviewPane({ title, speakers, messages, unmatchedBlocks, options, onMessageSelect }: PreviewPaneProps) {
  const messageItems: PreviewItem[] = buildDisplayBlocks(messages, options).map((block) => ({
    kind: "message",
    block,
    firstLine: getFirstLine(block.messages.flatMap((message) => message.sourceLines)),
  }));
  const unmatchedItems: PreviewItem[] = unmatchedBlocks.map((block) => ({
    kind: "unmatched",
    block,
    firstLine: getFirstLine(block.sourceLines),
  }));
  const blocks = [...messageItems, ...unmatchedItems].sort((a, b) => a.firstLine - b.firstLine);

  return (
    <main
      className={`preview-pane theme-${options.theme} ${options.darkMode ? "dark-mode" : ""} font-${options.fontSize} width-${options.bubbleWidth}`}
      style={{ "--font-size-delta": `${options.fontSizeDelta}pt` } as React.CSSProperties}
    >
      <div className="preview-document">
        <h1>{title || "새 대화 백업"}</h1>
        {blocks.length ? (
          blocks.map((item) =>
            item.kind === "message" ? (
              <MessageBlock key={item.block.id} block={item.block} speakers={speakers} options={options} onMessageSelect={onMessageSelect} />
            ) : (
              <UnmatchedPreviewBlock key={item.block.id} block={item.block} onSelect={onMessageSelect} />
            ),
          )
        ) : (
          <div className="empty-state">화자와 원문을 준비한 뒤 파싱하면 미리보기가 여기에 표시됩니다.</div>
        )}
      </div>
    </main>
  );
}

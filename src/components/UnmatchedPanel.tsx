import type { Speaker, UnmatchedBlock } from "../types/project";

type UnmatchedPanelProps = {
  blocks: UnmatchedBlock[];
  speakers: Speaker[];
  getContext: (block: UnmatchedBlock) => {
    previousMessageId?: string;
    previousLabel: string;
    nextMessageId?: string;
    nextLabel: string;
  };
  onChange: (blocks: UnmatchedBlock[]) => void;
  onAppendToRaw: (text: string) => void;
  onAddAsMessage: (block: UnmatchedBlock, speakerId: string) => void;
  onGoToRawLine: (lineNumber: number) => void;
  onGoToPreviewMessage: (messageId: string) => void;
};

export function UnmatchedPanel({ blocks, speakers, getContext, onChange, onAppendToRaw, onAddAsMessage, onGoToRawLine, onGoToPreviewMessage }: UnmatchedPanelProps) {
  if (!blocks.length) {
    return (
      <section className="panel-section">
        <h2>제외/불확실 항목</h2>
        <p className="subtle">현재 파싱에서 제외된 항목이 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="panel-section">
      <h2>제외/불확실 항목</h2>
      {blocks.map((block) => {
        const context = getContext(block);
        const firstLine = block.sourceLines[0];

        return (
        <div className="unmatched-card" key={block.id}>
          <div className="unmatched-nav">
            <small>{block.reason}</small>
            <div className="unmatched-shortcuts">
              {firstLine ? <button type="button" onClick={() => onGoToRawLine(firstLine)}>원문 {block.sourceLines.join(", ")}행</button> : null}
              {context.previousMessageId ? <button type="button" onClick={() => onGoToPreviewMessage(context.previousMessageId!)}>{context.previousLabel}</button> : null}
              {context.nextMessageId ? <button type="button" onClick={() => onGoToPreviewMessage(context.nextMessageId!)}>{context.nextLabel}</button> : null}
            </div>
          </div>
          <textarea
            value={block.text}
            onChange={(event) => onChange(blocks.map((item) => (item.id === block.id ? { ...item, text: event.target.value } : item)))}
          />
          <label>
            메시지로 추가
            <select defaultValue="" onChange={(event) => {
              if (!event.target.value) return;
              onAddAsMessage(block, event.target.value);
            }}>
              <option value="">화자 선택</option>
              {speakers.map((speaker) => (
                <option key={speaker.id} value={speaker.id}>{speaker.displayName || "이름 없음"}</option>
              ))}
            </select>
          </label>
          <div className="row-actions">
            <button type="button" onClick={() => onAppendToRaw(block.text)}>원문 끝에 붙이기</button>
            <button type="button" onClick={() => onChange(blocks.filter((item) => item.id !== block.id))}>목록에서 제거</button>
          </div>
        </div>
      );
      })}
    </section>
  );
}

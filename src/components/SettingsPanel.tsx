import { createSpeaker, getDefaultRenderOptions } from "../data/defaults";
import type { Platform, RenderOptions, Speaker, UnmatchedBlock } from "../types/project";
import { SpeakerForm } from "./SpeakerForm";
import { UnmatchedPanel } from "./UnmatchedPanel";

type UnmatchedContext = {
  previousMessageId?: string;
  previousLabel: string;
  nextMessageId?: string;
  nextLabel: string;
};

type SettingsPanelProps = {
  platform: Platform;
  onPlatformChange: (platform: Platform) => void;
  speakers: Speaker[];
  onSpeakersChange: (speakers: Speaker[]) => void;
  rawText: string;
  invalidSpeakerIds: string[];
  diagnostics: Array<{ speakerId: string; label: string; count: number }>;
  options: RenderOptions;
  onOptionsChange: (options: RenderOptions) => void;
  unmatchedBlocks: UnmatchedBlock[];
  onUnmatchedChange: (blocks: UnmatchedBlock[]) => void;
  onAppendToRaw: (text: string) => void;
  onAddUnmatchedAsMessage: (block: UnmatchedBlock, speakerId: string) => void;
  getUnmatchedContext: (block: UnmatchedBlock) => UnmatchedContext;
  onGoToRawLine: (lineNumber: number) => void;
  onGoToPreviewMessage: (messageId: string) => void;
};

export function SettingsPanel(props: SettingsPanelProps) {
  const updateOptions = (patch: Partial<RenderOptions>) => props.onOptionsChange({ ...props.options, ...patch });
  const isStackTheme = props.options.theme !== "minimal";
  const changeTheme = (theme: RenderOptions["theme"]) => {
    updateOptions({ theme });
    if (theme === "minimal") {
      props.onSpeakersChange(props.speakers.map((speaker) => ({ ...speaker, position: "auto" })));
    }
  };
  const changeFontDelta = (amount: number) => {
    updateOptions({ fontSizeDelta: Math.max(-5, Math.min(5, props.options.fontSizeDelta + amount)) });
  };

  return (
    <aside className="settings-panel">
      <section className="panel-section">
        <h2>플랫폼</h2>
        <div className="segmented">
          {(["x", "discord"] as Platform[]).map((platform) => (
            <button
              type="button"
              className={props.platform === platform ? "active" : ""}
              key={platform}
              onClick={() => {
                props.onPlatformChange(platform);
                props.onOptionsChange(getDefaultRenderOptions(platform));
              }}
            >
              {platform === "x" ? "X" : "Discord"}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <h2>화자</h2>
        <SpeakerForm
          speakers={props.speakers}
          isStackTheme={isStackTheme}
          showHandle={props.platform === "x"}
          invalidSpeakerIds={props.invalidSpeakerIds}
          onAddSpeaker={() => props.onSpeakersChange([...props.speakers, createSpeaker(props.speakers.length)])}
          onChange={props.onSpeakersChange}
        />
      </section>

      <section className="panel-section">
        <h2>파싱 진단</h2>
        {props.rawText.trim() ? (
          <div className="diagnostic-list">
            {props.diagnostics.map((item) => (
              <div className={item.count > 0 ? "diagnostic-item" : "diagnostic-item warning"} key={item.speakerId}>
                <span>{item.label}</span>
                <strong>{item.count}회</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="subtle">원문을 붙여넣으면 등록 화자 발견 횟수를 보여줍니다.</p>
        )}
      </section>

      <section className="panel-section compact-grid">
        <h2>표시 정보</h2>
        <label><input type="checkbox" checked={props.options.showTime} onChange={(event) => updateOptions({ showTime: event.target.checked })} /> 시간</label>
        <label><input type="checkbox" checked={props.options.showName} onChange={(event) => updateOptions({ showName: event.target.checked })} /> 이름</label>
        {props.platform === "x" ? (
          <label><input type="checkbox" checked={props.options.showHandle} onChange={(event) => updateOptions({ showHandle: event.target.checked })} /> 아이디</label>
        ) : null}
        <label><input type="checkbox" checked={props.options.showAvatar} onChange={(event) => updateOptions({ showAvatar: event.target.checked })} /> 프로필</label>
      </section>

      <section className="panel-section">
        <h2>익명 처리</h2>
        <select value={props.options.anonymizeMode} onChange={(event) => updateOptions({ anonymizeMode: event.target.value as RenderOptions["anonymizeMode"] })}>
          <option value="off">꺼짐</option>
          <option value="letters">A/B/C/D</option>
        </select>
      </section>

      <section className="panel-section">
        <div className="section-head">
          <h2>표시 스타일</h2>
          <label className="switch-line">
            <input type="checkbox" checked={props.options.darkMode} onChange={(event) => updateOptions({ darkMode: event.target.checked })} />
            다크
          </label>
        </div>
        <div className="style-grid">
          <label>
            테마
            <select value={props.options.theme} onChange={(event) => changeTheme(event.target.value as RenderOptions["theme"])}>
              <option value="minimal">좌우형</option>
              <option value="chatlog">스택형</option>
            </select>
          </label>
          <label>
            연속 발화
            <select value={props.options.mergeMode} onChange={(event) => updateOptions({ mergeMode: event.target.value as RenderOptions["mergeMode"] })}>
              <option value="none">개별 표시</option>
              <option value="groupVisual">시각적 묶음</option>
              <option value="mergeText">텍스트 병합</option>
            </select>
          </label>
          <label className="font-stepper-field">
            글자 크기
            <div className="font-stepper">
              <button type="button" disabled={props.options.fontSizeDelta <= -5} onClick={() => changeFontDelta(-1)}>-</button>
              <span>{props.options.fontSizeDelta > 0 ? `+${props.options.fontSizeDelta}` : props.options.fontSizeDelta}pt</span>
              <button type="button" disabled={props.options.fontSizeDelta >= 5} onClick={() => changeFontDelta(1)}>+</button>
            </div>
          </label>
          <label>
            말풍선 폭
            <select value={props.options.bubbleWidth} onChange={(event) => updateOptions({ bubbleWidth: event.target.value as RenderOptions["bubbleWidth"] })}>
              <option value="narrow">좁게</option>
              <option value="normal">보통</option>
              <option value="wide">넓게</option>
            </select>
          </label>
        </div>
      </section>

      <UnmatchedPanel
        blocks={props.unmatchedBlocks}
        speakers={props.speakers}
        getContext={props.getUnmatchedContext}
        onChange={props.onUnmatchedChange}
        onAppendToRaw={props.onAppendToRaw}
        onAddAsMessage={props.onAddUnmatchedAsMessage}
        onGoToRawLine={props.onGoToRawLine}
        onGoToPreviewMessage={props.onGoToPreviewMessage}
      />
    </aside>
  );
}

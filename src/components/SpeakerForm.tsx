import type { Speaker } from "../types/project";

type SpeakerFormProps = {
  speakers: Speaker[];
  isStackTheme: boolean;
  showHandle: boolean;
  invalidSpeakerIds: string[];
  onAddSpeaker: () => void;
  onChange: (speakers: Speaker[]) => void;
};

const positions: Speaker["position"][] = ["auto", "left", "right"];
const positionLabels: Record<Speaker["position"], string> = {
  auto: "자동",
  left: "왼쪽",
  right: "오른쪽",
};

export function SpeakerForm({ speakers, isStackTheme, showHandle, invalidSpeakerIds, onAddSpeaker, onChange }: SpeakerFormProps) {
  const updateSpeaker = (id: string, patch: Partial<Speaker>) => {
    onChange(speakers.map((speaker) => (speaker.id === id ? { ...speaker, ...patch } : speaker)));
  };

  const handleAvatar = (speaker: Speaker, file?: File) => {
    if (!file) return;
    if (file.size > 1024 * 1024 && !window.confirm("이미지가 1MB보다 큽니다. HTML/작업 파일 용량이 커질 수 있어요. 그래도 사용할까요?")) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateSpeaker(speaker.id, { avatarDataUrl: String(reader.result || "") });
    reader.readAsDataURL(file);
  };

  return (
    <div className="speaker-list">
      {speakers.map((speaker, index) => (
        <section
          className={`speaker-card ${invalidSpeakerIds.includes(speaker.id) ? "invalid" : ""}`}
          key={speaker.id}
          style={{ "--speaker-swatch": speaker.color || "#5B7CFA" } as React.CSSProperties}
        >
          <div className="speaker-card-head">
            <button type="button" disabled={speakers.length <= 1} onClick={() => onChange(speakers.filter((item) => item.id !== speaker.id))}>
              삭제
            </button>
          </div>
          <div className="speaker-profile-row">
            <label className="avatar-picker" title="프로필 이미지 선택">
              {speaker.avatarDataUrl ? <img src={speaker.avatarDataUrl} alt="" /> : <span>+</span>}
              <input type="file" accept="image/*" onChange={(event) => handleAvatar(speaker, event.target.files?.[0])} />
            </label>
            <div className="speaker-identity">
              <label>
                이름
                <input
                  value={speaker.displayName}
                  onChange={(event) => updateSpeaker(speaker.id, { displayName: event.target.value })}
                  placeholder={`화자 ${String.fromCharCode(65 + index)}`}
                />
              </label>
              {showHandle ? (
                <label>
                  아이디
                  <input
                    value={speaker.handle || ""}
                    onChange={(event) => updateSpeaker(speaker.id, { handle: event.target.value })}
                    placeholder="@임의아이디"
                  />
                </label>
              ) : null}
            </div>
          </div>
          <div className="speaker-card-controls">
            <label className="speaker-color-field">
              색상
              <input type="color" value={speaker.color || "#5B7CFA"} onChange={(event) => updateSpeaker(speaker.id, { color: event.target.value })} />
            </label>
            <label className="speaker-position-field">
              위치
              {isStackTheme ? (
                <input value="스택형" disabled />
              ) : (
                <select value={speaker.position} onChange={(event) => updateSpeaker(speaker.id, { position: event.target.value as Speaker["position"] })}>
                  {positions.map((position) => (
                    <option key={position} value={position}>{positionLabels[position]}</option>
                  ))}
                </select>
              )}
            </label>
          </div>
          {invalidSpeakerIds.includes(speaker.id) ? (
            <p className="field-error">{showHandle ? "이름과 아이디를 입력해주세요." : "이름을 입력해주세요."}</p>
          ) : null}
          {speaker.avatarDataUrl ? <button type="button" onClick={() => updateSpeaker(speaker.id, { avatarDataUrl: undefined })}>이미지 제거</button> : null}
        </section>
      ))}
      <button type="button" className="primary full" disabled={speakers.length >= 4} onClick={onAddSpeaker}>
        화자 추가
      </button>
    </div>
  );
}

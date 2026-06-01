import type { RefObject } from "react";

type RawTextInputProps = {
  rawText: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  error?: string;
  onChange: (rawText: string) => void;
  onParse: () => void;
};

export function RawTextInput({ rawText, inputRef, error, onChange, onParse }: RawTextInputProps) {
  return (
    <section className="raw-panel">
      <h2>원문</h2>
      <textarea
        ref={inputRef}
        className="raw-input"
        value={rawText}
        onChange={(event) => onChange(event.target.value)}
        placeholder="X 타래나 Discord 대화 복사본을 붙여넣으세요."
      />
      <button type="button" className="primary full" onClick={onParse}>파싱하기</button>
      {error ? <p className="field-error">{error}</p> : null}
    </section>
  );
}

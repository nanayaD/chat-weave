import { useEffect, useRef, useState } from "react";

type TopBarProps = {
  title: string;
  onTitleChange: (title: string) => void;
  onNew: () => void;
  onLoadProject: (file: File) => void;
  onExportJson: () => void;
  onExportHtml: () => void;
  onCopyTistoryHtml: () => void;
  editorDarkMode: boolean;
  onToggleEditorDarkMode: () => void;
};

export function TopBar({ title, onTitleChange, onNew, onLoadProject, onExportJson, onExportHtml, onCopyTistoryHtml, editorDarkMode, onToggleEditorDarkMode }: TopBarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [exportOpen]);

  const runExportAction = (action: () => void) => {
    action();
    setExportOpen(false);
  };

  return (
    <header className="top-bar">
      <div className="brand">
        <span className="brand-mark">CW</span>
        <label className="title-edit" title="백업 제목을 편집합니다.">
          <span className="title-edit-icon" aria-hidden="true">✎</span>
          <input
            value={title}
            maxLength={20}
            size={Math.min(Math.max(title.length || 1, 6), 20)}
            onChange={(event) => onTitleChange(event.target.value.slice(0, 20))}
            aria-label="백업 제목"
          />
        </label>
      </div>
      <div className="top-actions">
        <button
          type="button"
          className="icon-button"
          title={editorDarkMode ? "편집기 밝은 모드로 바꿉니다." : "편집기 다크모드로 바꿉니다."}
          aria-pressed={editorDarkMode}
          aria-label="편집기 다크모드"
          onClick={onToggleEditorDarkMode}
        >
          ☀
        </button>
        <button type="button" title="현재 작업을 비우고 새 백업을 시작합니다." onClick={onNew}>새 백업</button>
        <label className="button-like" title="작업 JSON 파일을 불러와 이어서 편집합니다.">
          작업 불러오기
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onLoadProject(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <div className="export-menu" ref={exportMenuRef}>
          <button
            type="button"
            className="primary export-summary"
            title="HTML 파일, 티스토리 코드, 작업 JSON 저장 메뉴를 엽니다."
            aria-expanded={exportOpen}
            onClick={() => setExportOpen((open) => !open)}
          >
            내보내기
          </button>
          {exportOpen ? (
          <div className="export-menu-list">
            <button type="button" title="브라우저에서 바로 열 수 있는 완성본 HTML 파일을 저장합니다." onClick={() => runExportAction(onExportHtml)}>HTML 파일</button>
            <button type="button" title="티스토리 HTML 모드에 붙여넣을 코드를 복사합니다." onClick={() => runExportAction(onCopyTistoryHtml)}>티스토리 코드 복사</button>
            <button type="button" title="나중에 이 앱에서 다시 편집할 작업 파일을 저장합니다." onClick={() => runExportAction(onExportJson)}>작업 JSON 저장</button>
          </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

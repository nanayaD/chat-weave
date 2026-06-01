import { useMemo, useRef, useState } from "react";
import { SettingsPanel } from "./components/SettingsPanel";
import { TopBar } from "./components/TopBar";
import { PreviewPane } from "./components/PreviewPane";
import { RawTextInput } from "./components/RawTextInput";
import { createSpeaker, getDefaultRenderOptions } from "./data/defaults";
import { parseRawText } from "./parsers";
import { buildTistoryHtml, buildViewerHtml, downloadTextFile } from "./render/exportHtml";
import type { Message, Platform, Project, RenderOptions, Speaker, UnmatchedBlock } from "./types/project";

const nowIso = () => new Date().toISOString();
const normalizeSpeaker = (speaker: Speaker): Speaker => ({
  ...speaker,
  position: speaker.position === "left" || speaker.position === "right" ? speaker.position : "auto",
});

const normalizeRenderOptions = (options: RenderOptions | undefined, platform: Platform): RenderOptions => {
  const defaults = getDefaultRenderOptions(platform);
  if (!options) return defaults;
  const rawTheme = (options as unknown as { theme?: string }).theme;
  const theme = rawTheme === "minimal" || rawTheme === "chatlog" ? rawTheme : defaults.theme;
  const darkMode = rawTheme === "dark" || Boolean(options.darkMode);
  return {
    ...defaults,
    ...options,
    layoutMode: "stack",
    anonymizeMode: options.anonymizeMode === "letters" ? "letters" : "off",
    theme,
    darkMode,
    fontSizeDelta: Math.max(-5, Math.min(5, Number(options.fontSizeDelta ?? 0))),
  };
};

const comparableSpeakers = (items: Speaker[]) =>
  items.map(({ displayName, handle, avatarDataUrl, position, color, anonymousName }) => ({
    displayName,
    handle,
    avatarDataUrl,
    position,
    color,
    anonymousName,
  }));

const countOccurrences = (text: string, needle = "") => {
  const target = needle.trim().toLowerCase();
  if (!target) return 0;
  return text.toLowerCase().split(target).length - 1;
};

const validateProject = (value: unknown): Project => {
  if (!value || typeof value !== "object") throw new Error("작업 JSON 형식이 아닙니다.");
  const project = value as Partial<Project>;
  if (project.platform !== "x" && project.platform !== "discord") throw new Error("플랫폼 정보가 올바르지 않습니다.");
  if (!Array.isArray(project.speakers) || project.speakers.length < 1) throw new Error("화자 정보가 없습니다.");
  if (typeof project.rawText !== "string") throw new Error("원문 정보가 올바르지 않습니다.");
  if (!Array.isArray(project.messages)) throw new Error("메시지 정보가 올바르지 않습니다.");
  if (!project.renderOptions || typeof project.renderOptions !== "object") throw new Error("표시 옵션 정보가 없습니다.");
  return project as Project;
};

function createInitialProject(): Project {
  const platform: Platform = "x";
  return {
    version: "0.1.0",
    title: "새 대화 백업",
    platform,
    speakers: [createSpeaker(0), createSpeaker(1)],
    rawText: "",
    messages: [],
    unmatchedBlocks: [],
    renderOptions: getDefaultRenderOptions(platform),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function App() {
  const initialProject = useMemo(createInitialProject, []);
  const rawTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [title, setTitle] = useState(initialProject.title);
  const [platform, setPlatform] = useState<Platform>(initialProject.platform);
  const [speakers, setSpeakers] = useState<Speaker[]>(initialProject.speakers);
  const [rawText, setRawText] = useState(initialProject.rawText);
  const [messages, setMessages] = useState<Message[]>(initialProject.messages);
  const [unmatchedBlocks, setUnmatchedBlocks] = useState<UnmatchedBlock[]>(initialProject.unmatchedBlocks || []);
  const [renderOptions, setRenderOptions] = useState<RenderOptions>(initialProject.renderOptions);
  const [codeModalText, setCodeModalText] = useState("");
  const [rawTextError, setRawTextError] = useState("");
  const [invalidSpeakerIds, setInvalidSpeakerIds] = useState<string[]>([]);
  const [editorDarkMode, setEditorDarkMode] = useState(false);

  const project: Project = {
    version: "0.1.0",
    title,
    platform,
    speakers,
    rawText,
    messages,
    unmatchedBlocks,
    renderOptions,
    createdAt: initialProject.createdAt,
    updatedAt: nowIso(),
  };

  const diagnostics = speakers.map((speaker) => {
    const key = platform === "x" ? speaker.handle || speaker.displayName : speaker.displayName;
    return {
      speakerId: speaker.id,
      label: platform === "x" ? `${speaker.displayName || "이름 없음"} ${speaker.handle || ""}`.trim() : speaker.displayName || "이름 없음",
      count: countOccurrences(rawText, key),
    };
  });

  const getSpeakerLabel = (speakerId: string) => speakers.find((speaker) => speaker.id === speakerId)?.displayName || "이름 없음";

  const getUnmatchedContext = (block: UnmatchedBlock) => {
    const firstLine = Math.min(...block.sourceLines);
    const lastLine = Math.max(...block.sourceLines);
    const previous = messages
      .filter((message) => Math.max(...message.sourceLines) < firstLine)
      .sort((a, b) => Math.max(...b.sourceLines) - Math.max(...a.sourceLines))[0];
    const next = messages
      .filter((message) => Math.min(...message.sourceLines) > lastLine)
      .sort((a, b) => Math.min(...a.sourceLines) - Math.min(...b.sourceLines))[0];

    return {
      previousMessageId: previous?.id,
      previousLabel: previous ? `앞: ${getSpeakerLabel(previous.speakerId)}` : "",
      nextMessageId: next?.id,
      nextLabel: next ? `뒤: ${getSpeakerLabel(next.speakerId)}` : "",
    };
  };

  const scrollToRawLines = (sourceLines: number[]) => {
    const textarea = rawTextareaRef.current;
    if (!textarea || !sourceLines.length) return;
    const lines = rawText.split(/\r?\n/);
    const firstLine = Math.max(1, Math.min(Math.min(...sourceLines), lines.length));
    const lastLine = Math.max(firstLine, Math.min(Math.max(...sourceLines), lines.length));
    const selectionStart = lines.slice(0, firstLine - 1).join("\n").length + (firstLine > 1 ? 1 : 0);
    const selectionEnd = lines.slice(0, lastLine).join("\n").length;
    textarea.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 20;
      textarea.scrollTop = Math.max(0, (firstLine - 1) * lineHeight - textarea.clientHeight / 2);
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
      textarea.classList.remove("raw-jump-highlight");
      window.setTimeout(() => textarea.classList.add("raw-jump-highlight"), 0);
      window.setTimeout(() => textarea.classList.remove("raw-jump-highlight"), 1300);
    }, 180);
  };

  const scrollToRawLine = (lineNumber: number) => scrollToRawLines([lineNumber]);

  const scrollToPreviewMessage = (messageId: string) => {
    const target =
      document.querySelector<HTMLElement>(`[data-block-message-ids~="${CSS.escape(messageId)}"]`) ||
      document.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(messageId)}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.classList.remove("jump-highlight");
    window.setTimeout(() => target?.classList.add("jump-highlight"), 0);
    window.setTimeout(() => target?.classList.remove("jump-highlight"), 1400);
  };

  const getInvalidSpeakerIds = () =>
    speakers
      .filter((speaker) => {
        const missingName = !speaker.displayName.trim();
        const missingHandle = platform === "x" && !speaker.handle?.trim();
        return missingName || missingHandle;
      })
      .map((speaker) => speaker.id);

  const parse = () => {
    const nextInvalidSpeakerIds = getInvalidSpeakerIds();
    const nextRawTextError = rawText.trim() ? "" : "원문을 붙여넣은 뒤 파싱해주세요.";
    setInvalidSpeakerIds(nextInvalidSpeakerIds);
    setRawTextError(nextRawTextError);
    if (nextInvalidSpeakerIds.length || nextRawTextError) {
      setMessages([]);
      setUnmatchedBlocks([]);
      return;
    }
    const result = parseRawText(platform, rawText, speakers);
    setMessages(result.messages);
    setUnmatchedBlocks(result.unmatchedBlocks);
  };

  const hasWork = () =>
    title !== initialProject.title ||
    platform !== initialProject.platform ||
    rawText !== initialProject.rawText ||
    messages.length > 0 ||
    unmatchedBlocks.length > 0 ||
    JSON.stringify(comparableSpeakers(speakers)) !== JSON.stringify(comparableSpeakers(initialProject.speakers)) ||
    JSON.stringify(renderOptions) !== JSON.stringify(initialProject.renderOptions);

  const reset = () => {
    if (hasWork() && !window.confirm("현재 작업 내용을 지우고 새 백업을 시작할까요?")) {
      return;
    }
    const fresh = createInitialProject();
    setTitle(fresh.title);
    setPlatform(fresh.platform);
    setSpeakers(fresh.speakers);
    setRawText(fresh.rawText);
    setMessages([]);
    setUnmatchedBlocks([]);
    setRenderOptions(fresh.renderOptions);
    setRawTextError("");
    setInvalidSpeakerIds([]);
  };

  const loadProject = async (file: File) => {
    try {
      const text = await file.text();
      const loaded = validateProject(JSON.parse(text));
      setTitle(loaded.title || "불러온 대화 백업");
      setPlatform(loaded.platform || "x");
      setSpeakers(loaded.speakers?.length ? loaded.speakers.map(normalizeSpeaker) : [createSpeaker(0)]);
      setRawText(loaded.rawText || "");
      setMessages(loaded.messages || []);
      setUnmatchedBlocks(loaded.unmatchedBlocks || []);
      setRenderOptions(normalizeRenderOptions(loaded.renderOptions, loaded.platform || "x"));
      setRawTextError("");
      setInvalidSpeakerIds([]);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "작업 JSON을 불러오지 못했습니다.");
    }
  };

  const addUnmatchedAsMessage = (block: UnmatchedBlock, speakerId: string) => {
    const speaker = speakers.find((item) => item.id === speakerId);
    if (!speaker) return;
    setMessages((current) => [
      ...current,
      {
        id: `manual-${crypto.randomUUID()}`,
        speakerId,
        rawSpeakerName: speaker.displayName,
        text: block.text,
        sourcePlatform: platform,
        sourceLines: block.sourceLines,
        confidence: 0.4,
      },
    ]);
    setUnmatchedBlocks((current) => current.filter((item) => item.id !== block.id));
  };

  const exportJson = () => {
    downloadTextFile(`${title || "chat-weave"}-project.json`, JSON.stringify(project, null, 2), "application/json;charset=utf-8");
  };

  const exportHtml = () => {
    downloadTextFile(`${title || "chat-weave"}.html`, buildViewerHtml(project), "text/html;charset=utf-8");
  };

  const copyTistoryHtml = async () => {
    const html = buildTistoryHtml(project);
    try {
      await navigator.clipboard.writeText(html);
      window.alert("티스토리용 HTML 코드를 복사했습니다.");
    } catch {
      setCodeModalText(html);
    }
  };

  const retryCopyCode = async () => {
    if (!codeModalText) return;
    try {
      await navigator.clipboard.writeText(codeModalText);
      window.alert("코드를 복사했습니다.");
      setCodeModalText("");
    } catch {
      window.alert("브라우저가 자동 복사를 막았습니다. 코드 영역을 직접 전체 선택해서 복사해주세요.");
    }
  };

  return (
    <div className={`app-shell ${editorDarkMode ? "editor-dark" : ""}`}>
      <TopBar
        title={title}
        onTitleChange={setTitle}
        onNew={reset}
        onLoadProject={loadProject}
        onExportJson={exportJson}
        onExportHtml={exportHtml}
        onCopyTistoryHtml={copyTistoryHtml}
        editorDarkMode={editorDarkMode}
        onToggleEditorDarkMode={() => setEditorDarkMode((current) => !current)}
      />
      <div className="workspace">
        <SettingsPanel
          platform={platform}
          onPlatformChange={setPlatform}
          speakers={speakers}
          onSpeakersChange={(nextSpeakers) => {
            setSpeakers(nextSpeakers);
            setInvalidSpeakerIds((current) =>
              current.filter((id) => {
                const speaker = nextSpeakers.find((item) => item.id === id);
                if (!speaker) return false;
                return !speaker.displayName.trim() || (platform === "x" && !speaker.handle?.trim());
              }),
            );
          }}
          rawText={rawText}
          invalidSpeakerIds={invalidSpeakerIds}
          diagnostics={diagnostics}
          options={renderOptions}
          onOptionsChange={setRenderOptions}
          unmatchedBlocks={unmatchedBlocks}
          onUnmatchedChange={setUnmatchedBlocks}
          onAppendToRaw={(text) => setRawText((current) => `${current.trim()}\n\n${text}`.trim())}
          onAddUnmatchedAsMessage={addUnmatchedAsMessage}
          getUnmatchedContext={getUnmatchedContext}
          onGoToRawLine={scrollToRawLine}
          onGoToPreviewMessage={scrollToPreviewMessage}
        />
        <PreviewPane
          title={title}
          speakers={speakers}
          messages={messages}
          unmatchedBlocks={unmatchedBlocks}
          options={renderOptions}
          onMessageSelect={scrollToRawLines}
        />
        <aside className="raw-column">
          <RawTextInput
            rawText={rawText}
            inputRef={rawTextareaRef}
            error={rawTextError}
            onChange={(text) => {
              setRawText(text);
              if (text.trim()) setRawTextError("");
            }}
            onParse={parse}
          />
        </aside>
      </div>
      {codeModalText ? (
        <div className="code-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="code-modal-title">
          <section className="code-modal">
            <div className="code-modal-head">
              <div>
                <h2 id="code-modal-title">티스토리용 HTML 코드</h2>
                <p>아래 코드를 전체 선택해서 티스토리 HTML 모드에 붙여넣으세요.</p>
              </div>
              <button type="button" onClick={() => setCodeModalText("")}>닫기</button>
            </div>
            <textarea
              className="code-modal-textarea"
              value={codeModalText}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
            />
            <div className="code-modal-actions">
              <button type="button" onClick={() => setCodeModalText("")}>닫기</button>
              <button type="button" onClick={retryCopyCode}>다시 복사 시도</button>
              <button type="button" className="primary" onClick={() => downloadTextFile(`${title || "chat-weave"}-tistory.html`, codeModalText, "text/html;charset=utf-8")}>
                파일로 저장
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default App;

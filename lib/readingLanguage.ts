export type ReadingLanguage = "en" | "zh-CN";
export type ReadingLanguagePreference = ReadingLanguage | "auto";

export const READING_LANGUAGE_STORAGE_KEY = "reading-language";
const READING_LANGUAGE_CHANGE_EVENT = "reading-language-change";

const CJK_CHARACTER_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;

export function getReadingLanguage(
  text: string,
  preference: ReadingLanguagePreference = "auto",
): ReadingLanguage {
  if (preference !== "auto") return preference;
  return CJK_CHARACTER_PATTERN.test(text) ? "zh-CN" : "en";
}

export function getReadingLanguageInstruction(
  text: string,
  preference: ReadingLanguagePreference = "auto",
): string {
  return getReadingLanguage(text, preference) === "zh-CN"
    ? "Write every user-facing JSON string in natural Simplified Chinese. Do not use Spanish or any other language."
    : "Write every user-facing JSON string in natural English. Do not use Spanish or any other language.";
}

export function getStoredReadingLanguage(): ReadingLanguagePreference {
  if (typeof window === "undefined") return "en";

  const value = window.localStorage.getItem(READING_LANGUAGE_STORAGE_KEY);
  return value === "zh-CN" || value === "auto" ? value : "en";
}

export function saveStoredReadingLanguage(
  preference: ReadingLanguagePreference,
) {
  window.localStorage.setItem(READING_LANGUAGE_STORAGE_KEY, preference);
  window.dispatchEvent(new Event(READING_LANGUAGE_CHANGE_EVENT));
}

export function subscribeToReadingLanguage(callback: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === READING_LANGUAGE_STORAGE_KEY) callback();
  }

  window.addEventListener(READING_LANGUAGE_CHANGE_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(READING_LANGUAGE_CHANGE_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getClarificationCopy(
  focus: string,
  preference: ReadingLanguagePreference = "auto",
) {
  if (getReadingLanguage(focus, preference) === "zh-CN") {
    return {
      content: "让我们再抽一张牌，看看还能获得什么启示。",
      reason: "当你想了解更多细节或换一个角度时，可以使用一张补充牌。",
      question: `关于“${focus}”，还有什么信息能让答案更清晰？`,
    };
  }

  return {
    content: "Let's draw one more card for an additional layer of insight.",
    reason: "Use an extra card whenever you want more detail or a fresh perspective.",
    question: `What additional insight can clarify: ${focus}`,
  };
}

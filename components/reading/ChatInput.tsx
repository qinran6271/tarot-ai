import Link from "next/link";

type ChatInputProps = {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
};

export default function ChatInput({
  input,
  setInput,
  onSend,
}: ChatInputProps) {
  return (
    <footer className="shrink-0 border-t border-gray-100 bg-white px-6 pb-6 pt-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up..."
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />

        <button
          type="submit"
          disabled={!input.trim()}
          className="cursor-pointer rounded-full bg-black px-4 py-2 text-xs text-white disabled:bg-gray-300"
        >
          Send
        </button>
      </form>

      <Link
        href="/question"
        className="mt-3 flex h-11 items-center justify-center rounded-full border border-black text-sm text-black"
      >
        Start New Reading
      </Link>
    </footer>
  );
}
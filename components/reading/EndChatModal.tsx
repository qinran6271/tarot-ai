type EndChatModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function EndChatModal({
  open,
  onCancel,
  onConfirm,
}: EndChatModalProps) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/30 px-5 pb-5">
      <div className="w-full rounded-[32px] bg-white px-6 py-6 shadow-xl">
        <h2 className="text-lg font-medium text-gray-900">End chat?</h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          This reading will be saved to your history. You can still review it
          later.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="h-12 cursor-pointer rounded-full bg-black text-sm text-white transition active:scale-[0.98]"
          >
            End Chat
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="h-12 cursor-pointer rounded-full border border-gray-300 text-sm text-gray-900 transition hover:bg-gray-50 active:scale-[0.98]"
          >
            Continue Reading
          </button>
        </div>
      </div>
    </div>
  );
}
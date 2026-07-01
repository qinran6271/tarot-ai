type TarotCardProps = {
  position: string;
};

export default function TarotCard({ position }: TarotCardProps) {
  return (
    <button className="flex flex-col items-center gap-2">
      <div className="h-36 w-24 rounded-xl bg-yellow-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md" />

      <span className="text-xs text-gray-500">{position}</span>
    </button>
  );
}
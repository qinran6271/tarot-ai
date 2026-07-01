import { DrawnCard } from "@/types/tarot";
import Image from "next/image";

type TarotCardProps = {
  card: DrawnCard;
  revealed: boolean;
  onClick: () => void;
};

export default function TarotCard({
  card,
  revealed,
  onClick,
}: TarotCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2"
    >
      <div className="overflow-hidden rounded-xl shadow-sm transition hover:-translate-y-1 hover:shadow-md">
        {revealed ? (
            <Image
            src={card.img}
            alt={card.name}
            width={120}
            height={200}
            className={`h-36 w-24 object-cover ${
                card.isReversed ? "rotate-180" : ""
            }`}
            />
        ) : (
          <div className="flex h-36 w-24 items-center justify-center bg-yellow-200">
            {/* <span className="text-3xl"></span> */}
          </div>
        )}
      </div>
    </button>
  );
}
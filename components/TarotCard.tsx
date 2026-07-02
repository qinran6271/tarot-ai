import { DrawnCard } from "@/types/tarot";
import Image from "next/image";

type TarotCardProps = {
  card?: DrawnCard;
  revealed: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: "small" | "large";
};

export default function TarotCard({
  card,
  revealed,
  onClick,
  disabled = false,
  size = "small",
}: TarotCardProps) {
  const sizeClass = size === "large" ? "w-44 h-64" : "w-24 h-36";

  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`flex flex-col items-center gap-2 ${
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      }`}
    >
      <div
        className={`overflow-hidden rounded-xl shadow-sm transition ${
          disabled ? "" : "hover:-translate-y-1 hover:shadow-md"
        }`}
      >
        {revealed && card ? (
          <Image
            src={card.img}
            alt={card.name}
            width={120}
            height={200}
            className={`${sizeClass} object-cover ${
              card.isReversed ? "rotate-180" : ""
            }`}
          />
        ) : (
          <div
            className={`flex ${sizeClass} items-center justify-center bg-yellow-200`}
          />
        )}
      </div>
    </button>
  );
}
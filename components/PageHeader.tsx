import { ChevronLeft } from "lucide-react";

type PageHeaderProps = {
  title?: string;
  onBack?: () => void;
};

export default function PageHeader({
  title,
  onBack,
}: PageHeaderProps) {
  return (
    <header className="flex items-center">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 cursor-pointer p-1 text-gray-500 transition hover:text-black active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft
            size={24}
            strokeWidth={2.3}
          />
        </button>
      ) : null}

      {title ? (
        <h1 className="ml-3 text-base font-medium text-gray-900">
          {title}
        </h1>
      ) : null}
    </header>
  );
}
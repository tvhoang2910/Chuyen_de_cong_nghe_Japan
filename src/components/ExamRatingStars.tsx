import { Star } from "lucide-react";

type ExamRatingStarsProps = {
  value: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  valueLabel?: string;
  countLabel?: string;
  className?: string;
};

const sizeClassMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const ExamRatingStars = ({
  value,
  maxStars = 5,
  size = "md",
  disabled = false,
  onChange,
  showValue = false,
  valueLabel,
  countLabel,
  className = "",
}: ExamRatingStarsProps) => {
  const activeStars = Math.round(value);
  const starSizeClass = sizeClassMap[size];
  const interactive = typeof onChange === "function" && !disabled;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      <div className="flex items-center gap-1">
        {Array.from({ length: maxStars }, (_, index) => {
          const starValue = index + 1;
          const active = starValue <= activeStars;
          const star = (
            <Star
              className={`${starSizeClass} ${active ? "fill-amber-400 text-amber-400" : "text-slate-300"} transition`}
            />
          );

          if (interactive && onChange) {
            return (
              <button
                key={starValue}
                type="button"
                onClick={() => onChange(starValue)}
                className="rounded-full transition hover:scale-110 disabled:cursor-not-allowed"
                aria-label={`Đánh giá ${starValue} sao`}
                disabled={disabled}
              >
                {star}
              </button>
            );
          }

          return (
            <span key={starValue} aria-hidden="true" className="inline-flex">
              {star}
            </span>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm font-semibold text-slate-700">
          {valueLabel ?? value.toFixed(1)}
        </span>
      )}

      {countLabel && (
        <span className="text-xs text-slate-500">{countLabel}</span>
      )}
    </div>
  );
};

export default ExamRatingStars;

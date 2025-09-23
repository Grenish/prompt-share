import Image from "next/image";
import { Card, CardContent, CardHeader } from "../ui/card";

type HashTagsProps = {
  hashtag: string;
  photos: string[]; // image URLs
  className?: string;
};

export default function HashTags({
  hashtag,
  photos,
  className,
}: HashTagsProps) {
  const moreCount = Math.max(0, photos.length - 4);
  const showMore = moreCount > 0;

  // If more than 4 photos: show first 3 + "+X" tile using the 4th photo as background.
  const tiles = showMore ? photos.slice(0, 3) : photos.slice(0, 4);

  return (
    <Card
      className={[
        "w-full max-w-sm h-[350px] flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm p-2 gap-0",
        className || "",
      ].join(" ")}
    >
      {/* Minimal header for a single hashtag */}
      <CardHeader className="pt-1 px-0 mb-1">
        <span className="inline-flex w-fit text-xl items-center rounded-full px-2 py-0.5 font-medium text-muted-foreground leading-none">
          #{hashtag}
        </span>
      </CardHeader>

      <CardContent className="flex-1 px-2 pb-2 ">
        <div className="grid h-full grid-cols-2 grid-rows-2 gap-2">
          {tiles.map((src, idx) => (
            <div
              key={idx}
              className="group relative h-full w-full overflow-hidden rounded-xl border border-border"
            >
              <Image
                src={src}
                alt={`#${hashtag} photo ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 45vw, 180px"
                className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                draggable={false}
              />
            </div>
          ))}

          {showMore && (
            <div className="relative h-full w-full overflow-hidden rounded-xl border border-border">
              <Image
                src={photos[3]}
                alt={`+${moreCount} more for #${hashtag}`}
                fill
                sizes="(max-width: 640px) 45vw, 180px"
                className="object-cover scale-105 brightness-[0.75]"
                draggable={false}
              />
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-semibold text-white">
                  +{moreCount}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

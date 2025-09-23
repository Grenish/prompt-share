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

  // If there are more than 4 photos, show the first 3 + a "+X" tile using the 4th photo as background.
  const tiles = showMore ? photos.slice(0, 3) : photos.slice(0, 4);

  return (
    <Card
      className={[
        "w-full max-w-sm h-[350px] overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md",
        className || "",
      ].join(" ")}
    >
      <CardHeader className="p-3">
        <span className="inline-flex items-center rounded-full bg-muted/70 px-2.5 text-xs font-medium text-muted-foreground">
          #{hashtag}
        </span>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-2 gap-1.5">
          {tiles.map((src, idx) => (
            <div
              key={idx}
              className="group relative aspect-square overflow-hidden rounded-md ring-1 ring-border/50"
            >
              <Image
                src={src}
                alt={`#${hashtag} photo ${idx + 1}`}
                fill
                sizes="120px"
                className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                draggable={false}
              />
            </div>
          ))}

          {showMore && (
            <div className="relative aspect-square overflow-hidden rounded-md ring-1 ring-border/50">
              {/* Use the 4th photo as a blurred, dimmed background for a nicer +X tile */}
              <Image
                src={photos[3]}
                alt={`+${moreCount} more for #${hashtag}`}
                fill
                sizes="120px"
                className="object-cover scale-105 blur-[1px] brightness-[0.75]"
                draggable={false}
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
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

import { cn } from "@/lib/utils";
import { Card, CardContent } from "../ui/card";

type ModelName = "gemini" | "chatgpt" | "grok" | "midjourney";

// Explicit class tokens so Tailwind can see and include them in the build
const MODEL_BG_CLASS: Record<ModelName, string> = {
  gemini: "bg-gemini",
  chatgpt: "bg-chatgpt",
  grok: "bg-grok",
  midjourney: "bg-midjourney",
};

interface ModelCardProps {
  model?: ModelName;
  modelName: string;
  icon?: React.ReactNode;
}



export default function ModelCard({ model, modelName, icon }: ModelCardProps) {
  return (
    <Card
      className={cn(
        "w-full max-w-sm h-14 flex flex-col justify-center items-center overflow-hidden rounded-full border shadow-sm p-3 gap-0 group",
        model ? MODEL_BG_CLASS[model] : undefined,
        "bg-cover bg-center",
        "transition-all duration-300 ease-in-out",
        "group-hover:scale-105 group-hover:shadow-lg group-hover:brightness-110",
        "cursor-pointer"
      )}
    >
      <CardContent
        className={cn(
          "w-full flex items-center justify-center p-2 rounded-full transition-all duration-200 ease-in-out",
          "opacity-0 scale-95 bg-card/0",
          "group-hover:opacity-100 group-hover:scale-100 group-hover:bg-card/50",
          "backdrop-blur-sm"
        )}
      >
        <h2 className="text-lg font-semibold tracking-wide">{modelName}</h2>
        {icon}
      </CardContent>
    </Card>
  );
}

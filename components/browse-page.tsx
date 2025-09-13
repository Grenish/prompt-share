import { prompts } from "@/util/prompt";
import PromptCardShow from "./promptCard-show";

export default function BrowsePage() {
  return (
    <div className="min-h-fit w-full px-6 sm:px-10 md:px-16 lg:px-24 py-12 bg-background">
      <div className="mb-5 space-y-2">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-gray-900 dark:text-gray-100 text-center">
          Explore{" "}
          <span className="font-semibold text-black dark:text-white">
            Prompts
          </span>
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Discover a curated library of powerful AI prompts, organized by
          category to spark ideas and boost creativity.
        </p>
      </div>

      <div className="grid items-stretch gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {prompts.map((prompt) => (
          <PromptCardShow key={prompt.id} {...prompt} />
        ))}
      </div>
    </div>
  );
}

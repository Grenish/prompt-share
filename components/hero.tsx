import { ChevronRight } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative min-h-screen flex flex-col ">
      <main className="flex flex-1 flex-col items-center justify-center text-center px-6 py-20 md:py-32">
        <h1 className="text-5xl md:text-6xl font-light tracking-tight text-gray-900 dark:text-gray-100 max-w-3xl">
          Swap Prompts, Spark Ideas, <br />
          <span className="font-normal text-gray-900 dark:text-white">
            Build Together.
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed font-light">
          Swap prompts, save time, and unlock fresh ideas with a global
          community of AI creators.
        </p>

        <div className="mt-5 flex flex-col sm:flex-row gap-4">
          <button className="px-8 py-3 rounded-full border-2 border-gray-900 dark:border-gray-100 text-black dark:text-white hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-black font-medium hover:shadow-lg transform cursor-pointer transition-all duration-200 flex items-center justify-center">
            Get Started Free
          </button>
          <button className="px-8 py-3 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-white/60 dark:hover:bg-gray-800/60 backdrop-blur-sm hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transform cursor-pointer transition-all ease-in-out duration-200 flex items-center justify-center gap-2">
            Explore Prompts <ChevronRight size={16} />
          </button>
        </div>
      </main>
    </div>
  );
}

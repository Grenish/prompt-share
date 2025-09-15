import BrowsePage from "@/components/browse-page";
import Hero from "@/components/hero";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#fefcff] dark:bg-gray-950 relative">
      <div
        className="absolute inset-0 z-0 dark:hidden"
        style={{
          backgroundImage: `
            radial-gradient(circle at 30% 70%, rgba(173, 216, 230, 0.35), transparent 60%),
            radial-gradient(circle at 70% 30%, rgba(255, 182, 193, 0.4), transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0 z-0 hidden dark:block"
        style={{
          backgroundColor: "#020617",
          backgroundImage: `
      /* vignette on top for contrast */
      radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.45) 100%),

      /* nebula glows (responsive sizes using vmax) */
      radial-gradient(60vmax 40vmax at 15% 20%, rgba(56, 189, 248, 0.14), transparent 60%),  /* sky */
      radial-gradient(50vmax 35vmax at 85% 25%, rgba(168, 85, 247, 0.16), transparent 60%),  /* violet */
      radial-gradient(65vmax 45vmax at 70% 85%, rgba(34, 197, 94, 0.10), transparent 65%),   /* emerald */
      radial-gradient(90vmax 60vmax at 50% 100%, rgba(99, 102, 241, 0.07), transparent 70%)  /* indigo base */
    `,
          backgroundBlendMode: "normal, screen, screen, screen, screen",
        }}
      />
      <div className="relative min-h-screen">
        <Hero />
        <BrowsePage />
      </div>
    </div>
  );
}

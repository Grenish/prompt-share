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
          backgroundImage: `
            radial-gradient(circle at 30% 70%, rgba(25, 25, 112, 0.3), transparent 60%),
            radial-gradient(circle at 70% 30%, rgba(75, 0, 130, 0.3), transparent 60%)`,
        }}
      />
      <div className="relative min-h-screen">
        <Hero />
        <BrowsePage />
      </div>
    </div>
  );
}

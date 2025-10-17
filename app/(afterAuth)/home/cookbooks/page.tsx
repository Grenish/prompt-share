import Folder from "@/components/Folder";

export default function CookbooksPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-lg font-semibold">Browse Cookbooks</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 mt-20 lg:px-8 py-6 space-y-6">
        {/*<Folder size={2} color="#5227FF" className="custom-folder" />
        <Folder color="blue-500" />

        <Folder color="#5227FF" />

        <Folder color="destructive" />*/}
        <h2>Coming Soon</h2>
      </main>
    </div>
  );
}

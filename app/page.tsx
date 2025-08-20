export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-6">
      <header className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Your App
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          A clean, modern starting point. Minimal, responsive, and ready to grow
          with your ideas.
        </p>
      </header>

      <main className="flex gap-4">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Get Started
        </button>
        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors">
          Learn More
        </button>
      </main>

      <footer className="absolute bottom-6 text-sm text-gray-400">
        © {new Date().getFullYear()} Your Company. All rights reserved.
      </footer>
    </div>
  );
}

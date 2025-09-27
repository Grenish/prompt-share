# AI Cookbook: A Collaborative Hub for Prompt Engineering

[](https://opensource.org/licenses/MIT)

AI Cookbook is a modern, open-source platform designed for the AI community to share, discover, and collaborate on high-quality prompts for various AI models. Whether you're a seasoned prompt engineer or just starting, AI Cookbook provides the tools to enhance your creativity and productivity with AI.

## 🌟 Key Features

- **Explore & Discover:** Browse a rich library of prompts for models like ChatGPT, Gemini, and Midjourney, organized by tags and categories.
- **Create & Share:** Easily create and share your own prompts, complete with text, images, and metadata.
- **User Profiles:** Build your own profile, showcase your prompts, and connect with other creators in the community.
- **Community Engagement:** Follow other users, like their posts, and engage in a collaborative environment.
- **Modern Tech Stack:** Built with Next.js, React, and Supabase for a fast, secure, and scalable experience.
- **Theming & Customization:** Personalize your experience with multiple themes and appearance settings.

## 🛠️ Built With

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **Authentication & Database:** [Supabase](https://supabase.io/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later)
- A package manager like npm, yarn, or bun

### Installation

1.  **Clone the repo**

    ```sh
    git clone https://github.com/your-username/your-repository-name.git
    ```

2.  **Install dependencies**

    ```sh
    npm install
    # or
    yarn install
    # or
    bun install
    ```

3.  **Set up your environment variables**

    Create a `.env.local` file in the root of your project and add your Supabase credentials:

    ```env
    NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

4.  **Run the development server**

    ```sh
    npm run dev
    ```

## 📂 Project Structure

The project follows a standard Next.js App Router structure:

- `/app`: Contains all the routes and UI logic.
  - `/(home)`: Publicly accessible pages.
  - `/(afterAuth)`: Routes protected by authentication.
  - `/api`: API routes for handling server-side logic.
- `/components`: Shared React components.
  - `/ui`: Reusable UI components from shadcn/ui.
- `/lib`: Utility functions and type definitions.
- `/util`: Supabase clients and server actions.
- `/public`: Static assets like images and fonts.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

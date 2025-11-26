import React from "react";
import {
  Share2,
  BookText,
  Search,
  Save,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: <Share2 className="w-12 h-12 text-primary" />,
    title: "Community Sharing",
    description: "Share your prompts with the community and discover new ideas.",
  },
  {
    icon: <BookText className="w-12 h-12 text-primary" />,
    title: "Real-World Prompt Examples",
    description:
      "Browse a curated collection of prompts for various use cases.",
  },
  {
    icon: <Search className="w-12 h-12 text-primary" />,
    title: "Fast Search and Discovery",
    description: "Quickly find the perfect prompt with our powerful search.",
  },
  {
    icon: <Save className="w-12 h-12 text-primary" />,
    title: "Save and Remix Tools",
    description: "Save your favorite prompts and remix them to create your own.",
  },
  {
    icon: <Lock className="w-12 h-12 text-primary" />,
    title: "Privacy-Focused and Open Source",
    description:
      "Your data is your own. We are committed to open source and transparency.",
  },
];

const Features = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to create amazing content
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md"
            >
              <div className="flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

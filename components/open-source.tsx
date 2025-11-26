import React from "react";
import Link from "next/link";
import { Button } from "./ui/button";

const OpenSource = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Proudly Open Source
        </h2>
        <p className="text-lg mb-8">
          AI Cookbook is fully open source, transparent, and community-driven.
          We encourage you to explore the code and contribute.
        </p>
        <Link href="https://github.com/Grenish/prompt-share" target="_blank">
          <Button variant="outline" size="lg">
            View on GitHub
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default OpenSource;

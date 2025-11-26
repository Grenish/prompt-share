import React from "react";
import Link from "next/link";
import { Button } from "./ui/button";

const CTA = () => {
  return (
    <section className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to start creating amazing content?
        </h2>
        <p className="text-lg mb-8">
          Join our community and start exploring a world of prompts.
        </p>
        <Link href="/auth/signin">
          <Button variant="secondary" size="lg">
            Explore Prompts
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CTA;

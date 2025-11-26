import React from "react";
import Link from "next/link";
import { Github, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-8 border-t">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <p className="text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
          &copy; {new Date().getFullYear()} AI Cookbook. All rights reserved.
        </p>
        <div className="flex items-center space-x-6">
          <Link
            href="https://github.com/Grenish/prompt-share"
            target="_blank"
            className="text-gray-600 dark:text-gray-400 hover:text-primary"
          >
            <Github className="w-6 h-6" />
          </Link>
          <Link
            href="https://twitter.com"
            target="_blank"
            className="text-gray-600 dark:text-gray-400 hover:text-primary"
          >
            <Twitter className="w-6 h-6" />
          </Link>
          <Link
            href="/privacy-policy"
            className="text-gray-600 dark:text-gray-400 hover:text-primary"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-and-conditions"
            className="text-gray-600 dark:text-gray-400 hover:text-primary"
          >
            Terms of Service
          </Link>
          <Link
            href="/contact"
            className="text-gray-600 dark:text-gray-400 hover:text-primary"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import DisplayPromptBox from "@/components/display-prompt-box";
import { SignupForm } from "@/components/signup-form";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src="/signup.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <DisplayPromptBox
          prompt="A surreal lone figure stands in a vast barren landscape, gazing upward at ethereal floating letters suspended in the air. The scene feels muted, dreamlike, and otherworldly, with soft desaturated tones and a quiet, abstract atmosphere. Perfect for conceptual, symbolic imagery."
          className="absolute p-3 border border-foreground/20 rounded-xl backdrop-blur-sm bg-background/5 bottom-24 left-1/2 transform -translate-x-1/2 "
        />
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center relative">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-lg z-10 rounded-xl border p-6">
            <div className="flex h-full flex-col items-center justify-center text-center space-y-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="150"
                height="150"
                fill="currentColor"
                viewBox="0 0 256 256"
                className="text-primary/50"
              >
                <path
                  d="M224,128a95.63,95.63,0,0,1-24.44,64H56.44A95.67,95.67,0,0,1,32,126.06C33,74.58,75.15,32.73,126.63,32A96,96,0,0,1,224,128Z"
                  opacity="0.2"
                ></path>
                <path d="M176,140a12,12,0,1,1-12-12A12,12,0,0,1,176,140ZM128,92a12,12,0,1,0-12,12A12,12,0,0,0,128,92Zm73-38A103.24,103.24,0,0,0,128,24h-1.49a104,104,0,0,0-76,173.32A8,8,0,1,0,62.4,186.67a88,88,0,1,1,131.19,0,8,8,0,0,0,11.93,10.66A104,104,0,0,0,201,54ZM152,168H136c-21.74,0-48-17.84-48-40a41.33,41.33,0,0,1,.55-6.68,8,8,0,1,0-15.78-2.64A56.9,56.9,0,0,0,72,128c0,14.88,7.46,29.13,21,40.15C105.4,178.22,121.07,184,136,184h16a8,8,0,0,1,0,16H96a24,24,0,0,0,0,48,8,8,0,0,0,0-16,8,8,0,0,1,0-16h56a24,24,0,0,0,0-48Z"></path>
              </svg>

              <h2 className="text-2xl font-semibold text-primary">
                We're Currently Invite-Only
              </h2>

              <p className="text-sm text-muted-background max-w-xs">
                Access to the AI Cookbook is currently restricted. To use the
                app, please join our waitlist first.
              </p>

              <div className="flex gap-3 mt-2">
                <Link
                  href="/login"
                  className="rounded-md border border-primary/40 px-5 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition"
                >
                  Login
                </Link>
                <Link
                  href="/waitlist"
                  className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-background hover:bg-primary/90 transition"
                >
                  Join the Waitlist
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

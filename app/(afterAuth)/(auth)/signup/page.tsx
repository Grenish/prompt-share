import DisplayPromptBox from "@/components/display-prompt-box";
import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src="/signup.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <DisplayPromptBox className="absolute p-3 border border-foreground/20 rounded-xl backdrop-blur-sm bg-background/5 bottom-24 left-1/2 transform -translate-x-1/2 " />
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
}

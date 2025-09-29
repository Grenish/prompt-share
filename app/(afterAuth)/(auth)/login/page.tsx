import DisplayPromptBox from "@/components/display-prompt-box";
import { LoginForm } from "@/components/login-form";
import { Book } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/login.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <DisplayPromptBox
          prompt="A surreal abstract digital painting of swirling clouds, illuminated with vibrant streaks of orange and soft white, set against a deep dark background. The composition should feel dynamic and atmospheric, with flowing textures and dramatic contrasts, evoking a sense of movement and dreamlike energy."
          className="absolute p-3 border border-foreground/20 rounded-xl backdrop-blur-sm bg-background/5 bottom-24 left-1/2 transform -translate-x-1/2 "
        />
      </div>
    </div>
  );
}

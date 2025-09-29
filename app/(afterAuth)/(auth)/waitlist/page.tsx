import WaitlistForm from "@/components/waitlist-form";

export default function WaitlistPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-waitlist bg-cover bg-center">
      <WaitlistForm className="bg-card/30 backdrop-blur-sm"/>
    </div>
  );
}

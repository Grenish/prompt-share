"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog";

export default function ProfileEditTrigger({
  initialBio,
  initialBackgroundUrl,
}: {
  initialBio: string;
  initialBackgroundUrl: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="rounded-md w-full sm:w-auto"
        onClick={() => setOpen(true)}
      >
        Edit Profile
      </Button>
      <ProfileEditDialog
        open={open}
        onOpenChange={setOpen}
        initialBio={initialBio}
        initialBackgroundUrl={initialBackgroundUrl}
      />
    </>
  );
}

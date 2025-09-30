import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { SectionHeader } from "./section-header";

function Card({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      {action}
    </div>
  );
}

export default function UserSettingsCard() {
  return (
    <>
      <section className="space-y-6">
        <SectionHeader
          title="Security"
          description="Manage your account security"
        />

        <div className="space-y-4">
          <Card
            title="Password"
            description="Change your password"
            action={
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[420px]">
                  <DialogHeader>
                    <DialogTitle>Change password</DialogTitle>
                    <DialogDescription>
                      Keep your account secure by using a strong password.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                      <Label htmlFor="current-password">Current password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="new-password">New password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="At least 8 characters"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">
                        Confirm new password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Re-enter new password"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button>Save changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            }
          />
        </div>
      </section>
    </>
  );
}

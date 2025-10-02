import { SectionHeader } from "./section-header";

export default function SettingsNotificationCard() {
  return (
    <>
      <section className="space-y-6">
        <SectionHeader
          title="Notifications"
          description="Choose how you receive updates"
        />

        <div className="space-y-4">
          <p className="text-sm text-foreground">
            We respect your inbox. You will never receive marketing emails,
            promotional content, or spam. Emails will only be sent for:
          </p>

          <ul className="list-disc list-inside space-y-2 text-sm text-foreground">
            <li>
              <span className="font-medium">Account security</span> - password
              changes, login alerts, and other critical actions.
            </li>
            <li>
              <span className="font-medium">Product updates</span> - only when
              introducing significant new features or improvements that directly
              enhance your experience.
            </li>
          </ul>

          <p className="text-sm text-muted-foreground">
            We have no intention of sending unnecessary emails beyond these
            purposes.
          </p>
        </div>
      </section>
    </>
  );
}

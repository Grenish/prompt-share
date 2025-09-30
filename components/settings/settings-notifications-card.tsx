import { SectionHeader } from "./section-header";

export default function SettingsNotificationCard() {
  return (
    <>
      <section className="space-y-6">
        <SectionHeader
          title="Notifications"
          description="Choose how you receive updates"
        />

        <div className="space-y-2">
          <p className="text-sm text-foreground">
            We currently do not send emails regarding product updates or
            marketing. However, we may send you important emails related to your
            account, such as security alerts, password changes, or other
            critical actions.
          </p>
        </div>
      </section>
    </>
  );
}

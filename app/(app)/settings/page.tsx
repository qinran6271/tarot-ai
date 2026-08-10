import {
  ChevronRight,
  CircleUserRound,
  MoonStar,
  Palette,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type SettingsSectionProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
};

type SettingsRowProps = {
  label: string;
  description?: string;
  value?: string;
  trailing?: ReactNode;
  href?: string;
};

function SettingsSection({ icon, title, children }: SettingsSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="text-gray-400">{icon}</span>
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
          {title}
        </h2>
      </div>
      <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  label,
  description,
  value,
  trailing,
  href,
}: SettingsRowProps) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-gray-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {value ? <span className="text-sm text-gray-400">{value}</span> : null}
        {trailing ?? <ChevronRight size={17} className="text-gray-300" />}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex min-h-16 items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3.5">
      {content}
    </div>
  );
}

function ComingSoonRow({
  icon,
  label,
  description,
}: {
  icon: ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-gray-400">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">
          {description}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        Soon
      </span>
    </div>
  );
}

/* function StaticSwitch({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`relative h-7 w-12 rounded-full transition-colors ${
        enabled ? "bg-yellow-400" : "bg-gray-200"
      }`}
      aria-hidden="true"
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </span>
  );
} */

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Make your tarot experience feel more personal.
        </p>
      </div>

      <div className="space-y-8">
        <SettingsSection
          icon={<CircleUserRound size={15} />}
          title="Account"
        >
          <SettingsRow
            label="Account"
            description="Manage your sign-in and security settings."
            href="/settings/account"
          />
        </SettingsSection>

        <section>
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
            Coming soon
          </h2>
          <div className="divide-y divide-white overflow-hidden rounded-2xl bg-gray-50">
            <ComingSoonRow
              icon={<Sparkles size={17} />}
              label="Reading preferences"
              description="Choose card and reading defaults."
            />
            <ComingSoonRow
              icon={<Palette size={17} />}
              label="Appearance"
              description="Personalize theme and text size."
            />
          </div>
        </section>

        {/* <SettingsSection icon={<Sparkles size={15} />} title="Reading">
          <SettingsRow label="Reading style" value="Balanced" />
          <SettingsRow
            label="Reversed cards"
            description="Allow reversed meanings when drawing cards."
            trailing={<StaticSwitch enabled />}
          />
          <SettingsRow
            label="Gentle guidance"
            description="Keep interpretations warm and supportive."
            trailing={<StaticSwitch enabled />}
          />
        </SettingsSection>

        <SettingsSection icon={<Palette size={15} />} title="Appearance">
          <SettingsRow label="Theme" value="Light" />
          <SettingsRow label="Text size" value="Standard" />
        </SettingsSection>

        <SettingsSection icon={<Bell size={15} />} title="Notifications">
          <SettingsRow
            label="Daily reading reminder"
            description="A gentle reminder to draw your daily card."
            trailing={<StaticSwitch enabled={false} />}
          />
          <SettingsRow
            label="Weekly reflection"
            description="Look back on the themes from your week."
            trailing={<StaticSwitch enabled={false} />}
          />
        </SettingsSection>

        <SettingsSection icon={<ShieldCheck size={15} />} title="Data & privacy">
          <SettingsRow label="Reading history" />
          <SettingsRow label="Export readings" />
          <SettingsRow label="Privacy" />
        </SettingsSection>

        <SettingsSection icon={<Info size={15} />} title="About">
          <SettingsRow label="About WALAWALA Tarot" />
          <SettingsRow label="Terms of use" />
          <SettingsRow
            label="Version"
            value="0.1.0"
            trailing={<span className="w-[17px]" />}
          />
        </SettingsSection> */}
      </div>

      <footer className="mt-auto pt-16 text-center text-xs text-gray-300">
        <p className="flex items-center justify-center gap-2">
          <MoonStar size={14} />
          <span>Made for quiet moments of reflection</span>
        </p>
        <p className="mt-3">WALAWALA Tarot · v0.1.0</p>
      </footer>
    </main>
  );
}

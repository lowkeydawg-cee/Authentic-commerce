import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";
import { PageHeader } from "@/components/editorial/PageHeader";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default function AccountPage() {
  return (
    <>
      <PageHeader eyebrow="Account" title="Your account" intro="Orders placed on this device appear here. Sign-in and order history across devices are coming soon." />
      <div className="page-x mx-auto max-w-page pb-24 lg:pb-32">
        <AccountView />
      </div>
    </>
  );
}

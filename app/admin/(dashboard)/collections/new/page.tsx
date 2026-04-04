import { CollectionForm } from "@/components/admin/collections/collection-form";
import { PageHeader } from "@/components/admin/shared/page-header";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Collection" };

export default function NewCollectionPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="New Collection" description="Group products into a curated set" />
      <CollectionForm />
    </div>
  );
}

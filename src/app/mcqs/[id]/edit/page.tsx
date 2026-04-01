import { notFound } from "next/navigation";
import { getDatabase } from "@/lib/d1-client";
import { requireAuth } from "@/lib/auth-middleware";
import { getMCQWithChoices, verifyMCQOwnership } from "@/lib/services/mcq-service";
import MCQForm from "../../components/MCQForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditMCQPage({ params }: Props) {
  const user = await requireAuth();
  const { id } = await params;
  const db = await getDatabase();

  const mcq = await getMCQWithChoices(db, id);
  if (!mcq) {
    notFound();
  }

  const isOwner = await verifyMCQOwnership(db, id, user.id);
  if (!isOwner) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit MCQ</h1>
          <p className="text-muted-foreground mt-2">
            Update your multiple choice question.
          </p>
        </header>
        <MCQForm mode="edit" mcq={mcq} />
      </div>
    </main>
  );
}

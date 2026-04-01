import { notFound } from "next/navigation";
import { getDatabase } from "@/lib/d1-client";
import { requireAuth } from "@/lib/auth-middleware";
import { getMCQWithChoices } from "@/lib/services/mcq-service";
import { getUserAttemptForMCQ } from "@/lib/services/mcq-attempt-service";
import MCQAttemptClient from "./MCQAttemptClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MCQAttemptPage({ params }: Props) {
  const user = await requireAuth();
  const { id } = await params;
  const db = await getDatabase();

  const mcq = await getMCQWithChoices(db, id);
  if (!mcq) {
    notFound();
  }

  const previousAttempts = await getUserAttemptForMCQ(db, id, user.id);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <MCQAttemptClient mcq={mcq} previousAttempts={previousAttempts} />
      </div>
    </main>
  );
}

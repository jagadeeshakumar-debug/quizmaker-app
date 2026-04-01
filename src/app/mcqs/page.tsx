import { getDatabase } from "@/lib/d1-client";
import { requireAuth } from "@/lib/auth-middleware";
import { listAllMCQsWithChoices } from "@/lib/services/mcq-service";
import AppHeader from "@/components/AppHeader";
import MCQListClient from "./MCQListClient";

export default async function McqListPage() {
  const user = await requireAuth();
  const db = await getDatabase();
  const mcqs = await listAllMCQsWithChoices(db, user.id);

  return (
    <>
      <AppHeader user={user} />
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <MCQListClient initialMCQs={mcqs} user={user} />
        </div>
      </main>
    </>
  );
}


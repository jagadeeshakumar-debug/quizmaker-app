import { requireAuth } from "@/lib/auth-middleware";
import MCQForm from "../components/MCQForm";

export default async function CreateMCQPage() {
  await requireAuth();

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create MCQ</h1>
          <p className="text-muted-foreground mt-2">
            Create a new multiple choice question with 2-4 answer choices.
          </p>
        </header>
        <MCQForm mode="create" />
      </div>
    </main>
  );
}

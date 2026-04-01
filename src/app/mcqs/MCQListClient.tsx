"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { MCQWithChoices } from "@/lib/services/mcq-service";
import type { User } from "@/lib/services/user-service";

type Props = {
  initialMCQs: MCQWithChoices[];
  user: User;
};

export default function MCQListClient({ initialMCQs, user }: Props) {
  const [mcqs, setMCQs] = useState(initialMCQs);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(mcqId: string) {
    if (!confirm("Are you sure you want to delete this MCQ? This action cannot be undone.")) {
      return;
    }

    setDeleting(mcqId);
    try {
      const response = await fetch(`/api/mcq/${mcqId}`, {
        method: "DELETE",
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (data.success) {
        setMCQs((prev) => prev.filter((mcq) => mcq.id !== mcqId));
        toast.success("MCQ deleted successfully");
      } else {
        toast.error(data.error || "Failed to delete MCQ");
      }
    } catch (err) {
      toast.error("Failed to delete MCQ");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Multiple Choice Questions</h1>
        <Link href="/mcqs/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create MCQ
          </Button>
        </Link>
      </header>

      {mcqs.length === 0 ? (
        <section className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            No MCQs yet. Create your first one to get started.
          </p>
          <Link href="/mcqs/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First MCQ
            </Button>
          </Link>
        </section>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead className="w-[30%]">Question</TableHead>
                <TableHead className="w-[15%]">Choices</TableHead>
                <TableHead className="w-[10%]">Created</TableHead>
                <TableHead className="w-[5%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mcqs.map((mcq) => (
                <TableRow key={mcq.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/mcqs/${mcq.id}`}
                      className="hover:underline text-primary"
                    >
                      {mcq.title}
                    </Link>
                    {mcq.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {mcq.description.slice(0, 80)}
                        {mcq.description.length > 80 ? "..." : ""}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {mcq.question.slice(0, 60)}
                    {mcq.question.length > 60 ? "..." : ""}
                  </TableCell>
                  <TableCell className="text-sm">
                    {mcq.choices.length} choices
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(mcq.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 disabled:pointer-events-none disabled:opacity-50"
                        disabled={deleting === mcq.id}
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/mcqs/${mcq.id}/edit`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(mcq.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

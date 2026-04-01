"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { MCQWithChoices } from "@/lib/services/mcq-service";

type Choice = {
  id: string;
  choiceText: string;
  isCorrect: boolean;
};

type Props = {
  mode: "create" | "edit";
  mcq?: MCQWithChoices;
};

export default function MCQForm({ mode, mcq }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(mcq?.title ?? "");
  const [description, setDescription] = useState(mcq?.description ?? "");
  const [question, setQuestion] = useState(mcq?.question ?? "");
  const [choices, setChoices] = useState<Choice[]>(
    mcq?.choices.map((c) => ({
      id: c.id,
      choiceText: c.choiceText,
      isCorrect: c.isCorrect,
    })) ?? [
      { id: crypto.randomUUID(), choiceText: "", isCorrect: false },
      { id: crypto.randomUUID(), choiceText: "", isCorrect: false },
    ]
  );
  const [submitting, setSubmitting] = useState(false);

  function addChoice() {
    if (choices.length >= 4) {
      toast.error("Maximum 4 choices allowed");
      return;
    }
    setChoices([
      ...choices,
      { id: crypto.randomUUID(), choiceText: "", isCorrect: false },
    ]);
  }

  function removeChoice(id: string) {
    if (choices.length <= 2) {
      toast.error("Minimum 2 choices required");
      return;
    }
    setChoices(choices.filter((c) => c.id !== id));
  }

  function updateChoice(id: string, field: "choiceText" | "isCorrect", value: string | boolean) {
    setChoices(
      choices.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!question.trim()) {
      toast.error("Question is required");
      return;
    }

    if (choices.some((c) => !c.choiceText.trim())) {
      toast.error("All choices must have text");
      return;
    }

    if (!choices.some((c) => c.isCorrect)) {
      toast.error("At least one choice must be marked as correct");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        question: question.trim(),
        choices: choices.map((c) => ({
          choiceText: c.choiceText.trim(),
          isCorrect: c.isCorrect,
        })),
      };

      const url = mode === "create" ? "/api/mcq" : `/api/mcq/${mcq?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (data.success) {
        toast.success(
          mode === "create" ? "MCQ created successfully" : "MCQ updated successfully"
        );
        router.push("/mcqs");
        router.refresh();
      } else {
        toast.error(data.error || `Failed to ${mode} MCQ`);
      }
    } catch (err) {
      toast.error(`Failed to ${mode} MCQ`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    router.push("/mcqs");
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>MCQ Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., JavaScript Basics Quiz"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this MCQ..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Question *</Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question here..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Answer Choices * (2-4 choices)</Label>
              {choices.length < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChoice}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Choice
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {choices.map((choice, index) => (
                <div
                  key={choice.id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/50"
                >
                  <div className="flex items-center pt-2">
                    <button
                      type="button"
                      onClick={() => updateChoice(choice.id, "isCorrect", !choice.isCorrect)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        choice.isCorrect
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      title={choice.isCorrect ? "Correct answer" : "Mark as correct"}
                    >
                      {choice.isCorrect && <Check className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`choice-${choice.id}`} className="text-sm">
                      Choice {index + 1}
                    </Label>
                    <Input
                      id={`choice-${choice.id}`}
                      value={choice.choiceText}
                      onChange={(e) =>
                        updateChoice(choice.id, "choiceText", e.target.value)
                      }
                      placeholder={`Enter choice ${index + 1}...`}
                      required
                    />
                  </div>

                  {choices.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChoice(choice.id)}
                      className="mt-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              Click the checkbox to mark correct answer(s). At least one choice must be correct.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting
                ? mode === "create"
                  ? "Creating..."
                  : "Updating..."
                : mode === "create"
                ? "Create MCQ"
                : "Update MCQ"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { MCQWithChoices } from "@/lib/services/mcq-service";
import type { MCQAttempt } from "@/lib/services/mcq-attempt-service";

type Props = {
  mcq: MCQWithChoices;
  previousAttempts: MCQAttempt[];
};

type AttemptResult = {
  isCorrect: boolean;
  correctChoiceIds: string[];
  explanation: string;
};

export default function MCQAttemptClient({ mcq, previousAttempts }: Props) {
  const router = useRouter();
  const [selectedChoices, setSelectedChoices] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [showPreviousAttempts, setShowPreviousAttempts] = useState(false);

  function toggleChoice(choiceId: string) {
    const newSelected = new Set(selectedChoices);
    if (newSelected.has(choiceId)) {
      newSelected.delete(choiceId);
    } else {
      newSelected.add(choiceId);
    }
    setSelectedChoices(newSelected);
  }

  async function handleSubmit() {
    if (selectedChoices.size === 0) {
      toast.error("Please select at least one answer");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/mcq/${mcq.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedChoiceIds: Array.from(selectedChoices),
        }),
      });

      const data = await response.json() as {
        success: boolean;
        attempt?: { isCorrect: boolean };
        correctChoiceIds?: string[];
        explanation?: string;
        error?: string;
      };

      if (data.success) {
        setResult({
          isCorrect: data.attempt?.isCorrect ?? false,
          correctChoiceIds: data.correctChoiceIds ?? [],
          explanation: data.explanation ?? "",
        });
        toast.success("Attempt submitted successfully");
      } else {
        toast.error(data.error || "Failed to submit attempt");
      }
    } catch (err) {
      toast.error("Failed to submit attempt");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setSelectedChoices(new Set());
    setResult(null);
  }

  function getChoiceStyle(choiceId: string) {
    if (!result) {
      return selectedChoices.has(choiceId)
        ? "border-primary bg-primary/10"
        : "border-border hover:border-primary/50";
    }

    const isSelected = selectedChoices.has(choiceId);
    const isCorrect = result.correctChoiceIds.includes(choiceId);

    if (isSelected && isCorrect) {
      return "border-green-500 bg-green-50";
    }
    if (isSelected && !isCorrect) {
      return "border-red-500 bg-red-50";
    }
    if (!isSelected && isCorrect) {
      return "border-green-500 bg-green-50/50";
    }
    return "border-border";
  }

  function getChoiceIcon(choiceId: string) {
    if (!result) return null;

    const isSelected = selectedChoices.has(choiceId);
    const isCorrect = result.correctChoiceIds.includes(choiceId);

    if (isSelected && isCorrect) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (isSelected && !isCorrect) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    if (!isSelected && isCorrect) {
      return <CheckCircle2 className="h-5 w-5 text-green-600 opacity-50" />;
    }
    return null;
  }

  return (
    <>
      <header className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/mcqs")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to MCQs
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{mcq.title}</h1>
        {mcq.description && (
          <p className="text-muted-foreground mt-2">{mcq.description}</p>
        )}
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Question</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{mcq.question}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Answer Choices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mcq.choices.map((choice, index) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => !result && toggleChoice(choice.id)}
                disabled={!!result || submitting}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${getChoiceStyle(
                  choice.id
                )} ${!result && !submitting ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center pt-0.5">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedChoices.has(choice.id)
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedChoices.has(choice.id) && (
                        <div className="w-3 h-3 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {String.fromCharCode(65 + index)}. {choice.choiceText}
                    </p>
                  </div>
                  {getChoiceIcon(choice.id)}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {result && (
          <Card className={result.isCorrect ? "border-green-500" : "border-red-500"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.isCorrect ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    Correct!
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-600" />
                    Incorrect
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-4">{result.explanation}</p>
              <Button onClick={handleReset}>Try Again</Button>
            </CardContent>
          </Card>
        )}

        {!result && (
          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={submitting || selectedChoices.size === 0}>
              {submitting ? "Submitting..." : "Submit Answer"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={submitting || selectedChoices.size === 0}
            >
              Clear Selection
            </Button>
          </div>
        )}

        {previousAttempts.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Previous Attempts</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreviousAttempts(!showPreviousAttempts)}
                >
                  {showPreviousAttempts ? "Hide" : "Show"} ({previousAttempts.length})
                </Button>
              </div>
            </CardHeader>
            {showPreviousAttempts && (
              <CardContent>
                <div className="space-y-3">
                  {previousAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {attempt.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">
                            {attempt.isCorrect ? "Correct" : "Incorrect"}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(attempt.completedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={attempt.isCorrect ? "default" : "secondary"}>
                        Score: {attempt.score}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </>
  );
}

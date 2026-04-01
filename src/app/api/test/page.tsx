"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TestPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function runIntegrationTest() {
    setLoading(true);
    setResults([]);
    
    try {
      const response = await fetch("/api/test/integration");
      const data = await response.json() as { results?: string[]; error?: string };
      
      if (data.results) {
        setResults(data.results);
      } else {
        setResults([`Error: ${data.error || "Unknown error"}`]);
      }
    } catch (err) {
      setResults([`Failed to run test: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setLoading(false);
    }
  }

  async function testCurrentUser() {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json() as unknown;
      setResults([JSON.stringify(data, null, 2)]);
    } catch (err) {
      setResults([`Failed: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setLoading(false);
    }
  }

  async function testLogout() {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const data = await response.json() as unknown;
      setResults([JSON.stringify(data, null, 2)]);
    } catch (err) {
      setResults([`Failed: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Authentication System Test</h1>
      
      <div className="flex gap-4 mb-6">
        <Button onClick={runIntegrationTest} disabled={loading}>
          Run Integration Test
        </Button>
        <Button onClick={testCurrentUser} disabled={loading} variant="outline">
          Test Current User
        </Button>
        <Button onClick={testLogout} disabled={loading} variant="outline">
          Test Logout
        </Button>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
        {loading ? (
          <p className="text-gray-500">Running tests...</p>
        ) : results.length > 0 ? (
          <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
            {results.join("\n")}
          </pre>
        ) : (
          <p className="text-gray-500">Click a button to run tests</p>
        )}
      </Card>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Manual API Testing:</h2>
        <Card className="p-6">
          <ul className="space-y-2 text-sm">
            <li><strong>POST /api/auth/signup</strong> - Create new user</li>
            <li><strong>POST /api/auth/login</strong> - Login user</li>
            <li><strong>POST /api/auth/logout</strong> - Logout user</li>
            <li><strong>GET /api/auth/me</strong> - Get current user</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

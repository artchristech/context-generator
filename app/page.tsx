/* eslint-disable @next/next/no-img-element */
"use client";

import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function Page() {
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [codebaseFiles, setCodebaseFiles] = useState<File[]>([]);
  const [contextJson, setContextJson] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [copied, setCopied] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setCodebaseFiles(files);
  };

  const handleSubmit = async () => {
    if (!projectDescription.trim() || codebaseFiles.length === 0) return;

    setStatus("loading");

    const formData = new FormData();
    formData.append("projectDescription", projectDescription);
    
    codebaseFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("/api/generateContext", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate context");
      }

      const context = await response.json();
      setContextJson(context);
      setStatus("success");
    } catch (error) {
      console.error("Error generating context:", error);
      setStatus("idle");
    }
  };

  const copyToClipboard = async () => {
    if (contextJson) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(contextJson, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
      }
    }
  };

  const removeFile = (indexToRemove: number) => {
    setCodebaseFiles(files => files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="mx-auto my-12 grid max-w-7xl grid-cols-1 gap-8 px-4 lg:grid-cols-2">
      <Card className="mx-auto w-full max-w-xl p-6">
        <h2 className="mb-1 text-center text-2xl font-bold">
          Context Generator for Vibe Coders
        </h2>
        <p className="mb-6 text-balance text-center text-sm text-gray-500">
          Upload your codebase and provide a project description to generate a comprehensive context file for AI understanding.
        </p>
        
        <div className="space-y-6">
          {/* Project Description Input */}
          <div>
            <Label htmlFor="project-description" className="text-sm font-medium">
              Project Description
            </Label>
            <Textarea
              id="project-description"
              placeholder="Describe your project, its purpose, key features, and any important context..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="mt-2 min-h-[120px] resize-none"
            />
          </div>

          {/* Codebase Upload */}
          <div>
            <Label htmlFor="codebase-upload" className="text-sm font-medium">
              Codebase Files
            </Label>
            <div className="mt-2">
              <Label
                htmlFor="codebase-upload"
                className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-primary"
              >
                <div className="flex flex-col items-center">
                  <Upload className="mb-2 h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Upload codebase files
                  </span>
                  <span className="mt-1 text-xs text-gray-400">
                    Select multiple files (JS, TS, JSON, etc.)
                  </span>
                </div>
                <input
                  id="codebase-upload"
                  type="file"
                  multiple
                  accept=".js,.ts,.jsx,.tsx,.json,.md,.txt,.py,.java,.cpp,.c,.html,.css,.scss,.vue,.php,.rb,.go,.rs,.swift,.kt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </Label>
            </div>

            {/* Display Selected Files */}
            {codebaseFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Selected Files ({codebaseFiles.length}):
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {codebaseFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded bg-gray-50 px-3 py-2"
                    >
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700 truncate">
                          {file.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="text-right">
            <Button
              onClick={handleSubmit}
              disabled={
                !projectDescription.trim() || 
                codebaseFiles.length === 0 || 
                status === "loading"
              }
              className="relative"
            >
              <span
                className={`${
                  status === "loading" ? "opacity-0" : "opacity-100"
                } whitespace-pre-wrap text-center font-semibold leading-none tracking-tight text-white`}
              >
                Generate Context
              </span>

              {status === "loading" && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <Spinner className="size-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Panel */}
      {status === "idle" ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-gray-50 lg:h-auto">
          <FileText className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-center text-xl text-gray-500">
            Your generated context file will appear here
          </p>
          <p className="mt-2 text-center text-sm text-gray-400">
            Upload your codebase and describe your project to get started
          </p>
        </div>
      ) : (
        <Card className="mx-auto w-full max-w-xl p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Generated Context File</h3>
              {status === "success" && contextJson && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy JSON
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {status === "loading" ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              contextJson && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 overflow-x-auto">
                    <code>{JSON.stringify(contextJson, null, 2)}</code>
                  </pre>
                </div>
              )
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
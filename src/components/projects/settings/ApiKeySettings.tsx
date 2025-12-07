"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { toastManager } from "@/components/ui/toast";
import {
  Key,
  Copy,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff,
  Code,
  AlertTriangle,
} from "lucide-react";
import type { Project } from "./ProjectSettings";

interface ApiKeySettingsProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
  canManage: boolean;
}

export function ApiKeySettings({
  project,
  onProjectUpdate,
  canManage,
}: ApiKeySettingsProps) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toastManager.add({ type: "success", title: "Copied to clipboard" });
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const response = await fetch(
        `/api/v1/projects/${project.id}/regenerate-key`,
        { method: "POST" },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to regenerate API key");
      }

      onProjectUpdate(result.data);
      setConfirmOpen(false);
      toastManager.add({
        type: "success",
        title: "API key regenerated",
        description: "Make sure to update your integration code",
      });
    } catch (error) {
      toastManager.add({
        type: "error",
        title:
          error instanceof Error ? error.message : "Failed to regenerate key",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const maskedKey = project.publicKey.replace(
    /^(indeks_pk_live_)(.{4})(.*)(.{4})$/,
    "$1$2••••••••••••••••$4",
  );

  const scriptTag = `<script src="https://cdn.indeks.io/sdk.js" data-api-key="${project.publicKey}" async></script>`;

  const npmInstall = "npm install @indeks/sdk";

  const jsCode = `import Indeks from '@indeks/sdk';

Indeks.init('${project.publicKey}');`;

  return (
    <div className="space-y-6">
      {/* API Key Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-[var(--color-indeks-blue)]" />
          <h3 className="font-semibold">API Key</h3>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
          <code className="flex-1 text-sm font-mono truncate">
            {showKey ? project.publicKey : maskedKey}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKey(!showKey)}
            className="h-8 w-8 p-0 shrink-0"
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(project.publicKey, "key")}
            className="h-8 w-8 p-0 shrink-0"
          >
            {copied === "key" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {canManage && (
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger
              render={(props) => (
                <Button {...props} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Key
                </Button>
              )}
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Regenerate API Key?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    This will invalidate your current API key immediately. Any
                    integrations using the old key will stop working.
                  </p>
                  <p className="font-medium text-foreground">
                    Make sure to update your integration code after
                    regenerating.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose
                  render={(props) => (
                    <Button
                      {...props}
                      variant="outline"
                      disabled={regenerating}
                    >
                      Cancel
                    </Button>
                  )}
                />
                <Button
                  variant="destructive"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                >
                  {regenerating && <Spinner className="h-4 w-4 mr-2" />}
                  Regenerate
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Installation Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-[var(--color-indeks-green)]" />
          <h3 className="font-semibold">Installation</h3>
        </div>

        {/* Script Tag */}
        <div className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Script Tag</span>
            <Badge variant="outline">Easiest</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Add this script to your HTML, before the closing{" "}
            <code className="px-1 py-0.5 rounded bg-muted">&lt;/body&gt;</code>{" "}
            tag.
          </p>
          <div className="relative">
            <pre className="p-3 rounded-lg bg-muted text-xs overflow-x-auto">
              <code>{scriptTag}</code>
            </pre>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(scriptTag, "script")}
              className="absolute top-2 right-2 h-7 w-7 p-0"
            >
              {copied === "script" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          {/* Coming Soon Overlay */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Badge variant="secondary" className="text-sm px-4 py-1.5">
                Coming Soon
              </Badge>
            </div>
          </div>
        </div>

        {/* NPM Package */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">NPM Package</span>
            <Badge variant="outline">React / Next.js</Badge>
          </div>
          <div className="relative">
            <pre className="p-3 rounded-lg bg-muted text-xs overflow-x-auto">
              <code>{npmInstall}</code>
            </pre>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(npmInstall, "npm")}
              className="absolute top-2 right-2 h-7 w-7 p-0"
            >
              {copied === "npm" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <div className="relative">
            <pre className="p-3 rounded-lg bg-muted text-xs overflow-x-auto">
              <code>{jsCode}</code>
            </pre>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(jsCode, "js")}
              className="absolute top-2 right-2 h-7 w-7 p-0"
            >
              {copied === "js" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
        <h4 className="text-sm font-medium">API Key Security</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• This is a public key, safe to use in frontend code</li>
          <li>• Data is filtered by domain to prevent misuse</li>
          <li>• Regenerate your key if you suspect it&apos;s compromised</li>
        </ul>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { WorkspaceSwitcherPresenter } from "./workspace-switcher-presenter";
import { toast } from "sonner";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro";
}

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  onCreateWorkspace: (
    name: string,
    slug: string
  ) => Promise<{ id: string; slug: string }>;
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspace,
  onCreateWorkspace,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    setLoading(true);
    try {
      const res = await onCreateWorkspace(name, slug);
      setIsDialogOpen(false);
      setName("");
      setSlug("");
      toast.success("Workspace created successfully");
      router.push(`/dashboard/${res.slug}`);
    } catch {
      toast.error(
        "Failed to create workspace. The URL slug might already be taken."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkspace = (targetSlug: string) => {
    router.push(`/dashboard/${targetSlug}`);
  };

  return (
    <WorkspaceSwitcherPresenter
      workspaces={workspaces}
      currentWorkspace={currentWorkspace}
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      name={name}
      setName={setName}
      slug={slug}
      setSlug={setSlug}
      loading={loading}
      onSelectWorkspace={handleSelectWorkspace}
      onSubmitCreate={handleCreate}
    />
  );
}

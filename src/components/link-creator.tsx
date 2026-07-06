"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { QuotaGatekeeper } from "@/components/quota-gatekeeper";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { LinkCreatorForm } from "./link-creator-form";

interface LinkCreatorProps {
  workspaceId: string;
  isPro: boolean;
  onCreateLink: (data: {
    workspaceId: string;
    originalUrl: string;
    shortCode: string;
    title?: string;
    password?: string;
    expiresAt?: string;
    maxClicks?: number;
    iosUrl?: string;
    androidUrl?: string;
    desktopUrl?: string;
    geoRouting?: Record<string, string>;
  }) => Promise<{ success: boolean; error?: string; linkId?: string }>;
}

export function LinkCreator({
  workspaceId,
  isPro,
  onCreateLink,
}: LinkCreatorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [originalUrl, setOriginalUrl] = React.useState("");
  const [shortCode, setShortCode] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [maxClicks, setMaxClicks] = React.useState<number | undefined>(
    undefined
  );

  const [iosUrl, setIosUrl] = React.useState("");
  const [androidUrl, setAndroidUrl] = React.useState("");

  const [geoCountry, setGeoCountry] = React.useState("");
  const [geoUrl, setGeoUrl] = React.useState("");
  const [geoRouting, setGeoRouting] = React.useState<Record<string, string>>(
    {}
  );

  const handleAddGeo = () => {
    if (!geoCountry || !geoUrl) return;
    setGeoRouting({ ...geoRouting, [geoCountry.toUpperCase()]: geoUrl });
    setGeoCountry("");
    setGeoUrl("");
  };

  const handleRemoveGeo = (country: string) => {
    const next = { ...geoRouting };
    delete next[country];
    setGeoRouting(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl || !shortCode) return;

    if (
      !isPro &&
      (iosUrl ||
        androidUrl ||
        Object.keys(geoRouting).length > 0 ||
        password ||
        expiresAt ||
        maxClicks)
    ) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await onCreateLink({
        workspaceId,
        originalUrl,
        shortCode,
        title,
        password: password || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        maxClicks: maxClicks || undefined,
        iosUrl: iosUrl || undefined,
        androidUrl: androidUrl || undefined,
        geoRouting: Object.keys(geoRouting).length > 0 ? geoRouting : undefined,
      });

      if (!res.success) {
        if (res.error === "LIMIT_REACHED") {
          setShowUpgradeModal(true);
        } else if (res.error === "SHORT_CODE_EXISTS") {
          toast.error("Short code is already taken in this workspace");
        } else if (res.error === "RESERVED_SHORT_CODE") {
          toast.error("This short code is reserved for system use");
        } else if (res.error === "FORBIDDEN") {
          toast.error("You do not have permission to create links here");
        } else {
          toast.error(
            res.error ? res.error.replace(/_/g, " ") : "Failed to create link"
          );
        }
        return;
      }

      toast.success("Link generated successfully!");
      setIsOpen(false);
      setOriginalUrl("");
      setShortCode("");
      setTitle("");
      setPassword("");
      setExpiresAt("");
      setMaxClicks(undefined);
      setIosUrl("");
      setAndroidUrl("");
      setGeoRouting({});
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="cursor-pointer gap-2">
        <Plus className="size-4" />
        Create Link
      </Button>

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <LinkCreatorForm
          isPro={isPro}
          loading={loading}
          originalUrl={originalUrl}
          setOriginalUrl={setOriginalUrl}
          shortCode={shortCode}
          setShortCode={setShortCode}
          title={title}
          setTitle={setTitle}
          password={password}
          setPassword={setPassword}
          expiresAt={expiresAt}
          setExpiresAt={setExpiresAt}
          maxClicks={maxClicks}
          setMaxClicks={setMaxClicks}
          iosUrl={iosUrl}
          setIosUrl={setIosUrl}
          androidUrl={androidUrl}
          setAndroidUrl={setAndroidUrl}
          geoCountry={geoCountry}
          setGeoCountry={setGeoCountry}
          geoUrl={geoUrl}
          setGeoUrl={setGeoUrl}
          geoRouting={geoRouting}
          onAddGeo={handleAddGeo}
          onRemoveGeo={handleRemoveGeo}
          onUpgradePrompt={() => setShowUpgradeModal(true)}
          onSubmit={handleSubmit}
          onCancel={() => setIsOpen(false)}
        />
      </Dialog>

      <QuotaGatekeeper
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        workspaceId={workspaceId}
      />
    </>
  );
}

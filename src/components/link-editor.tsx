"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { QuotaGatekeeper } from "@/components/quota-gatekeeper";
import { toast } from "sonner";
import { LinkItem } from "@/lib/validations";
import { LinkEditorForm } from "./link-editor-form";

interface LinkEditorProps {
  workspaceId: string;
  isPro: boolean;
  link: LinkItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
}

export function LinkEditor({
  workspaceId,
  isPro,
  link,
  isOpen,
  onClose,
  onUpdate,
}: LinkEditorProps) {
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [originalUrl, setOriginalUrl] = React.useState(link.originalUrl);
  const [title, setTitle] = React.useState(link.title || "");
  const [password, setPassword] = React.useState(link.password || "");

  const getSafeLocalDateString = (
    dateInput: string | Date | null | undefined
  ): string => {
    if (!dateInput) return "";
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  const [expiresAt, setExpiresAt] = React.useState(
    getSafeLocalDateString(link.expiresAt)
  );
  const [maxClicks, setMaxClicks] = React.useState<number | undefined>(
    link.maxClicks ?? undefined
  );

  const [iosUrl, setIosUrl] = React.useState(link.iosUrl || "");
  const [androidUrl, setAndroidUrl] = React.useState(link.androidUrl || "");

  const [geoCountry, setGeoCountry] = React.useState("");
  const [geoUrl, setGeoUrl] = React.useState("");
  const [geoRouting, setGeoRouting] = React.useState<Record<string, string>>(
    link.geoRouting || {}
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
    if (!originalUrl) return;

    if (
      !isPro &&
      (iosUrl ||
        androidUrl ||
        Object.keys(geoRouting).length > 0 ||
        password ||
        expiresAt)
    ) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    try {
      const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;
      const validExpiresAt =
        parsedExpiresAt && !isNaN(parsedExpiresAt.getTime())
          ? parsedExpiresAt.toISOString()
          : undefined;

      await onUpdate({
        linkId: link.id,
        workspaceId,
        originalUrl,
        title,
        password: password || undefined,
        expiresAt: validExpiresAt,
        maxClicks: maxClicks || undefined,
        iosUrl: iosUrl || undefined,
        androidUrl: androidUrl || undefined,
        geoRouting: Object.keys(geoRouting).length > 0 ? geoRouting : undefined,
      });

      toast.success("Link configurations updated successfully");
      onClose();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose}>
        <LinkEditorForm
          isPro={isPro}
          shortCode={link.shortCode}
          loading={loading}
          originalUrl={originalUrl}
          setOriginalUrl={setOriginalUrl}
          title={title}
          setTitle={setTitle}
          password={password}
          setPassword={setPassword}
          expiresAt={expiresAt}
          maxClicks={maxClicks}
          setMaxClicks={setMaxClicks}
          setExpiresAt={setExpiresAt}
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
          onCancel={onClose}
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

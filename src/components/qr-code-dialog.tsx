"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, QrCode } from "lucide-react";
import { toast } from "sonner";

interface QrCodeDialogProps {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QrCodeDialog({
  url,
  title,
  isOpen,
  onClose,
}: QrCodeDialogProps) {
  const [svgString, setSvgString] = React.useState("");
  const [pngDataUrl, setPngDataUrl] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    QRCode.toString(url, {
      type: "svg",
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((svg) => setSvgString(svg))
      .catch(() => toast.error("Failed to render vector QR code"));

    QRCode.toDataURL(url, {
      margin: 2,
      scale: 10,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((dataUrl) => setPngDataUrl(dataUrl))
      .catch(() => toast.error("Failed to generate raster QR code"));
  }, [url, isOpen]);

  const downloadPng = () => {
    if (!pngDataUrl) return;
    const link = document.createElement("a");
    link.href = pngDataUrl;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded as PNG");
  };

  const downloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-qrcode.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("QR Code downloaded as SVG");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Campaign link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center">
          <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-xl">
            <QrCode className="size-6" />
          </div>
          <h3 className="mt-4 text-lg font-bold">Dynamic QR Code</h3>
          <p className="text-muted-foreground mt-1 max-w-[280px] text-xs leading-relaxed">
            Generate high-resolution vector and raster QR representations for
            offline campaigns.
          </p>
        </div>

        <div className="bg-muted/30 border-border/60 mx-auto flex size-48 items-center justify-center overflow-hidden rounded-2xl border bg-white p-4">
          {pngDataUrl ? (
            <img
              src={pngDataUrl}
              alt="QR Code Preview"
              className="size-full object-contain"
            />
          ) : (
            <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
          )}
        </div>

        <div className="bg-muted border-border/40 flex items-center justify-between rounded-lg p-2.5 text-xs">
          <span className="text-muted-foreground max-w-[200px] truncate font-mono">
            {url}
          </span>
          <button
            onClick={copyLink}
            className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
          >
            {copied ? (
              <Check className="size-4 text-emerald-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            onClick={downloadPng}
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1.5 text-xs font-semibold"
          >
            <Download className="size-3.5" />
            Raster PNG
          </Button>
          <Button
            onClick={downloadSvg}
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1.5 text-xs font-semibold"
          >
            <Download className="size-3.5" />
            Vector SVG
          </Button>
        </div>

        <div className="border-border/60 border-t pt-4">
          <Button onClick={onClose} className="w-full cursor-pointer text-xs">
            Close Generator
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

import type React from "react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, QrCode, Loader2 } from "lucide-react";
import { generateNavigationQR, getNavigationUrl } from "@/lib/qrGenerator";

interface QRDialogProps {
  isOpen: boolean;
  onClose: () => void;
  destinationId?: string | null;
  destinationName?: string;
}

export const QRDialog: React.FC<QRDialogProps> = ({ 
  isOpen, 
  onClose, 
  destinationId,
  destinationName 
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate QR code when dialog opens with a destination
  useEffect(() => {
    if (isOpen && destinationId) {
      setIsGenerating(true);
      setError(null);
      
      generateNavigationQR(destinationId)
        .then((dataUrl) => {
          setQrCodeUrl(dataUrl);
          setIsGenerating(false);
        })
        .catch((err) => {
          console.error('[QRDialog] Failed to generate QR:', err);
          setError('Failed to generate QR code');
          setIsGenerating(false);
        });
    } else if (!isOpen) {
      // Reset when dialog closes
      setQrCodeUrl(null);
      setError(null);
    }
  }, [isOpen, destinationId]);

  const navigationUrl = destinationId ? getNavigationUrl(destinationId) : '';
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm border-2 border-blue-200/50 bg-white/95 p-0 backdrop-blur-xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-slate-100/80 p-1.5 transition-all hover:bg-slate-200 hover:scale-110 active:scale-95"
        >
          <X className="h-4 w-4 text-slate-600" />
        </button>

        <div className="p-6">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-flex rounded-full bg-blue-500/10 p-3 ring-2 ring-blue-400/30">
              <QrCode className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-orbitron text-lg font-semibold text-slate-800">
              Open Map in Phone
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {destinationName ? `Navigate to ${destinationName}` : 'Scan QR code to view on mobile'}
            </p>
          </div>

          <div className="mb-6 flex justify-center">
            <div className="rounded-2xl border-2 border-blue-200/50 bg-white p-4 shadow-lg shadow-blue-200/30">
              <div className="h-48 w-48 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 p-4 ring-1 ring-slate-200 flex items-center justify-center">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-xs text-slate-500">Generating QR...</p>
                  </div>
                ) : error ? (
                  <div className="text-center">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                ) : qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Navigation QR Code"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Select a destination first</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/30 p-4">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                1
              </div>
              <p className="text-sm text-slate-700">
                Open your phone's camera app
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                2
              </div>
              <p className="text-sm text-slate-700">
                Point camera at the QR code
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                3
              </div>
              <p className="text-sm text-slate-700">
                Tap the notification to open map
              </p>
            </div>
          </div>

          {navigationUrl && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Direct Link:</p>
              <p className="text-xs text-slate-700 font-mono break-all">{navigationUrl}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
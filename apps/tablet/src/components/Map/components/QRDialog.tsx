import type React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, QrCode } from "lucide-react";

interface QRDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRDialog: React.FC<QRDialogProps> = ({ isOpen, onClose }) => {
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
              Scan QR code to view on mobile
            </p>
          </div>

          <div className="mb-6 flex justify-center">
            <div className="rounded-2xl border-2 border-blue-200/50 bg-white p-4 shadow-lg shadow-blue-200/30">
              <div className="h-48 w-48 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 p-4 ring-1 ring-slate-200">
                <img
                  src="/qr-code-sample.jpg"
                  alt="QR Code"
                  className="h-full w-full object-contain"
                />
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
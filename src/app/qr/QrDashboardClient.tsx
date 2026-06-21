"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PrintableQr } from "@/components/profile/PrintableQr";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function QrDashboardClient({
  initialToken,
  handle,
}: {
  initialToken: string;
  handle: string;
}) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRegenerate = async () => {
    setIsDialogOpen(false);
    setLoading(true);
    try {
      const res = await fetch("/api/profile/qr", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "QR yenilenemedi");
      }

      setToken(data.qrToken);
      toast.success("Yeni QR kodunuz başarıyla oluşturuldu.");
      router.refresh();
    } catch (e) {
      const error = e as Error;
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-md">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Your Battle QR Code</h2>
        <p className="text-muted-foreground text-sm">
          You can print this QR code or share it digitally. Anyone who scans it
          will directly challenge you to a battle!
        </p>
      </div>

      <PrintableQr token={token} handle={handle} />

      <div className="border-t pt-6 mt-4 flex flex-col gap-4">
        <div className="flex flex-col">
          <h3 className="font-bold text-lg">
            Security & Regeneration
          </h3>
          <p className="text-sm text-muted-foreground">
            If you think your QR code has fallen into the wrong hands, you can
            invalidate it and generate a new one.
          </p>
        </div>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={loading}
              className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/30"
            >
              {loading ? "Regenerating..." : "Regenerate QR (Invalidate Old)"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border text-card-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are You Sure You Want to Regenerate?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Your old QR code will become invalid. Any previously shared or
                printed codes will no longer work. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-muted hover:bg-muted/80 text-muted-foreground border-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRegenerate}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Yes, Regenerate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Link href="/profile" className="mt-4">
        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          Back to Profile
        </Button>
      </Link>
    </div>
  );
}

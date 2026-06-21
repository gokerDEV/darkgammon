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
        <h2 className="text-2xl font-bold text-white">Davet QR Kodun</h2>
        <p className="text-white/60 text-sm">
          Bu QR kodu fiziksel olarak bastırabilir veya dijital ortamda
          paylaşabilirsin. Okutan kişiler doğrudan sana meydan okuyacaktır!
        </p>
      </div>

      <PrintableQr token={token} handle={handle} />

      <div className="border-t border-white/10 pt-6 mt-4 flex flex-col gap-4">
        <div className="flex flex-col">
          <h3 className="font-bold text-white text-lg">Güvenlik & Yenileme</h3>
          <p className="text-sm text-white/50">
            Eğer mevcut QR kodunun başkalarının eline geçtiğini düşünüyorsan
            iptal edip yenisini oluşturabilirsin.
          </p>
        </div>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={loading}
              className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/30"
            >
              {loading ? "Yenileniyor..." : "Yeni QR Üret (Eskisini İptal Et)"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-neutral-900 border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>
                QR Kodunu Yenilemek İstediğine Emin misin?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/70">
                Eski QR kodunuz tamamen geçersiz olacaktır. Önceden
                paylaştığınız veya yazdırdığınız eski kodlar artık
                çalışmayacaktır. Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/10 hover:bg-white/20 text-white border-0">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRegenerate}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Evet, Yenile
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Link href="/profile" className="mt-4">
        <Button
          variant="ghost"
          className="w-full text-white/50 hover:text-white hover:bg-white/10"
        >
          Profile Geri Dön
        </Button>
      </Link>
    </div>
  );
}

import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/mongodb";
import BgClientPage from "./BgClientPage";
import { PublicProfileView } from "./PublicProfileView";

export default async function NiPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = await params;
  const decoded = decodeURIComponent(resolvedParams.sessionId);
  const session = await auth();

  if (session?.user?.id) {
    const db = await getDb();
    const profile = await db
      .collection("profiles")
      .findOne({ userId: new ObjectId(session.user.id) });
    if (!profile) {
      redirect(
        `/profile/setup?callbackUrl=${encodeURIComponent(`/ni/${resolvedParams.sessionId}`)}`,
      );
    }
  }

  if (decoded.startsWith("@")) {
    const handle = decoded.slice(1);
    return <PublicProfileView handle={handle} />;
  }

  if (decoded.startsWith("!")) {
    const token = decoded.slice(1);
    return <PublicProfileView qrToken={token} />;
  }

  // Session route -> enforce auth
  if (!session?.user?.id) {
    redirect(`/?callbackUrl=/ni/${resolvedParams.sessionId}`);
  }

  return <BgClientPage />;
}

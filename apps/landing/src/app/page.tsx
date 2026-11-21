import LandingClient from "@/components/LandingClient";
import { getLandingContent } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getLandingContent();
  return <LandingClient content={content} />;
}

"use client"
import ModulePlaceholder from "@/components/dashboard/ModulePlaceholder";
import { useParams } from "next/navigation";

export default function CatchAllDashboardPage() {
  const params = useParams();
  const slug = params.slug as string[];
  const title = slug[slug.length - 1].split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return <ModulePlaceholder title={title} />;
}

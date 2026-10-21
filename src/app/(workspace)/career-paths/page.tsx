import type { Metadata } from "next";
import { CareerPaths } from "@/features/curriculum/career-paths";

export const metadata: Metadata = { title: "Career Paths" };

export default function CareerPathsPage() {
  return <CareerPaths />;
}

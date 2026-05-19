import type { Metadata } from "next";
import { AiJobMatchClient } from "@/components/ai/ai-job-match-client";

export const metadata: Metadata = {
  title: "AI Job Match",
  description: "Gemini ашиглан байгалийн хэлээр ажлын зарын тааруулгыг олно.",
};

export default function AiJobMatchPage() {
  return <AiJobMatchClient />;
}

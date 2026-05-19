import { redirect } from "next/navigation";

/** Хуучин холбоос — AI хэрэгслүүд цэсийг /ai-job-match руу чиглүүлнэ */
export default function AiToolsRedirectPage() {
  redirect("/ai-job-match");
}

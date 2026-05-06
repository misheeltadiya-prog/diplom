import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  calculateCvCompletion,
  getCvProfileOrDefault,
  saveCvProfile,
  type CvProfile,
} from "@/lib/profile-cv";

type CvPayload = Omit<CvProfile, "userId" | "updatedAt">;

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const profile = await getCvProfileOrDefault(currentUser);

  return NextResponse.json({
    ok: true,
    profile,
    completion: calculateCvCompletion(profile),
  });
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<CvPayload>;

    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();

    if (!fullName || !email || !phone) {
      return NextResponse.json({ error: "Name, email, and phone are required." }, { status: 400 });
    }

    const saved = await saveCvProfile(currentUser.id, {
      fullName,
      email,
      phone,
      headline: body.headline?.trim() ?? "",
      location: body.location?.trim() ?? "",
      professionalSummary: body.professionalSummary?.trim() ?? "",
      coreSkills: body.coreSkills?.trim() ?? "",
      workExperience: body.workExperience?.trim() ?? "",
      education: body.education?.trim() ?? "",
      certifications: body.certifications?.trim() ?? "",
      languages: body.languages?.trim() ?? "",
      portfolioUrl: body.portfolioUrl?.trim() ?? "",
      linkedinUrl: body.linkedinUrl?.trim() ?? "",
      githubUrl: body.githubUrl?.trim() ?? "",
      preferredRole: body.preferredRole?.trim() ?? "",
      salaryExpectation: body.salaryExpectation?.trim() ?? "",
      availability: body.availability?.trim() ?? "",
      achievements: body.achievements?.trim() ?? "",
    });

    if (!saved) {
      return NextResponse.json({ error: "Could not save your CV right now." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      profile: saved,
      completion: calculateCvCompletion(saved),
    });
  } catch (error: unknown) {
    const dbError = error as { code?: string; message?: string };

    if (dbError.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
    }

    return NextResponse.json(
      { error: dbError.message ?? "Could not save your CV right now." },
      { status: 500 },
    );
  }
}

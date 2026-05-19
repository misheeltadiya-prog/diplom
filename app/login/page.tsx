import { AuthSlider } from "./auth-slider";

type Props = {
  searchParams: Promise<{ role?: string; next?: string; panel?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { role, next, panel } = await searchParams;
  const initialSignup = panel === "signup";

  return <AuthSlider initialSignup={initialSignup} next={next} role={role} />;
}

import { AuthSlider } from "../login/auth-slider";

type Props = {
  searchParams: Promise<{ role?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const { role } = await searchParams;
  return <AuthSlider initialSignup role={role} />;
}

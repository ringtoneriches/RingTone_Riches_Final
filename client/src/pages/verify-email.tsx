import { useSearch } from "wouter";
import { Link } from "wouter";
import { VerificationForm } from "@/pages/verification-form";
import AuthShell from "@/components/auth/AuthShell";

export default function VerifyEmailPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const email = params.get("email");

  if (!email) {
    return (
      <AuthShell
        kicker="Verify email"
        title="EMAIL MISSING"
        sub="We need the address this code was sent to."
      >
        <div className="rr-auth-form">
          <div className="rr-auth-note rr-auth-note--warn">
            Register first, or open the verification link from your email.
          </div>
          <Link href="/register">
            <span className="rr-cta inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl text-sm font-black uppercase tracking-[0.12em]">
              Go to registration
            </span>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return <VerificationForm email={decodeURIComponent(email)} />;
}

import { useSearch } from "wouter";
import { VerificationForm } from "@/pages/verification-form";

export default function VerifyEmailPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const email = params.get("email");

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-black/40 border-ringtone-900/20 backdrop-blur-sm shadow-2xl rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Email Not Found</h1>
            <p className="text-gray-300 mb-6">
              Please register first or check your verification link.
            </p>
            <a 
              href="/register" 
              className="inline-block bg-yellow-600 hover:bg-ringtone-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Registration
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <VerificationForm email={decodeURIComponent(email)} />;
}
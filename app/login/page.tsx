import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign In | Rookie Draft" };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background grid pattern */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/20 border border-brand/30 mb-4 glow-brand">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-8 h-8 text-brand-light"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6.75v6.75" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gradient">Rookie Draft</h1>
          <p className="text-gray-400 mt-2 text-sm">Dynasty Fantasy Football Command Center</p>
        </div>

        {/* Login card */}
        <div className="card glow-brand">
          <h2 className="text-xl font-semibold text-gray-100 mb-6">Sign in to your league</h2>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Private league — contact your commissioner for access.
        </p>
      </div>
    </div>
  );
}

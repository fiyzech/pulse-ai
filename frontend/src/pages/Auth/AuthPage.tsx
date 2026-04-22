import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050816] px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="mb-2 text-3xl font-bold">Create account</h1>
        <p className="mb-6 text-white/60">
          Sign up to continue to PulseAI
        </p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          />
        </div>

        <button
          onClick={() => navigate("/pricing")}
          className="mt-6 w-full rounded-2xl bg-white px-6 py-3 font-medium text-black"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
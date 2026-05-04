import { useState } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider } from "../../utils/firebase";
import { Button } from "../ui/button";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative flex items-center justify-center bg-white px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-base font-semibold text-white shadow-sm">
                  FB
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    FinBuddy
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    AI Financial Assistant
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">
                  {mode === "signin" ? "Welcome back" : "Create your account"}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {mode === "signin"
                    ? "Sign in to access your personalized financial workspace."
                    : "Sign up to start tracking your finances in one place."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="space-y-1 text-sm">
                    <label className="text-sm font-medium text-slate-600">
                      Email address
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1 text-sm">
                    <label className="text-sm font-medium text-slate-600">
                      Password
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="••••••••"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={
                        mode === "signin" ? "current-password" : "new-password"
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="h-3 w-3" disabled />
                      Remember for 30 days
                    </label>
                    <span className="text-blue-600">Forgot password</span>
                  </div>
                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      {error}
                    </div>
                  )}
                  <button
                    onClick={handleEmailAuth}
                    className="w-full rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? mode === "signin"
                        ? "Signing in..."
                        : "Creating account..."
                      : mode === "signin"
                        ? "Sign in"
                        : "Sign up"}
                  </button>
                  <div className="relative py-2 text-xs text-slate-400">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-2">or</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {isLoading ? "Signing in..." : "Continue with Google"}
                  </Button>
                  <p className="text-center text-xs text-slate-500">
                    {mode === "signin" ? (
                      <>
                        Don’t have an account?{" "}
                        <button
                          onClick={() => setMode("signup")}
                          className="text-blue-600"
                        >
                          Sign up
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <button
                          onClick={() => setMode("signin")}
                          className="text-blue-600"
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-10 lg:flex">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/30" />
            <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-white/20" />
          </div>
          <div className="relative z-10 max-w-lg text-white">
            <h2 className="text-3xl font-semibold">Smarter money decisions.</h2>
            <p className="mt-3 text-sm text-white/80">
              Track budgets, bills, goals, and investments in one secure place.
            </p>
            <div className="mt-10 rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur">
              <div className="aspect-[5/4] w-full overflow-hidden rounded-2xl bg-white/10 p-4">
                <div className="flex h-full items-center justify-center text-sm text-white/70">
                  <img
                    src="/loginpageImg.png"
                    alt="Login illustration"
                    className="h-full w-full rounded-2xl object-contain drop-shadow-xl"
                  />
                </div>
              </div>
            </div>
          
          </div>
        </div>
      </div>
    </div>
  );
}

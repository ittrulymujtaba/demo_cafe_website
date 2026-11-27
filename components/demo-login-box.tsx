"use client";

// Shows the demo login and fills the sign-in fields when tapped.
export default function DemoLoginBox({ email, password }: { email: string; password: string }) {
  function useDemoLogin() {
    const emailInput = document.getElementById("login-email") as HTMLInputElement | null;
    const passwordInput = document.getElementById("login-password") as HTMLInputElement | null;
    if (emailInput) emailInput.value = email;
    if (passwordInput) passwordInput.value = password;
  }

  return (
    <div className="rounded-2xl border border-coffee/30 bg-latte/60 p-4 text-sm">
      <p className="font-semibold">Try it</p>
      <p className="mt-1 text-espresso/80">
        Email <span className="font-mono">{email}</span>
        <br />
        Password <span className="font-mono">{password}</span>
      </p>
      <button
        type="button"
        onClick={useDemoLogin}
        className="mt-3 rounded-lg border border-coffee px-3 py-1.5 font-semibold text-coffee hover:bg-coffee hover:text-cream"
      >
        Use demo login
      </button>
      <p className="mt-2 text-xs text-espresso/60">Changes you make here reset every night.</p>
    </div>
  );
}

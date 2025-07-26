"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export function Header() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur border-b border-orange-100 shadow-sm">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 select-none">
          <span className="text-2xl font-extrabold text-orange-600 tracking-tight">TastyShare</span>
        </Link>
        <div className="flex gap-2">
          {user ? (
            <>
              <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-md border border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold px-4 py-2 text-sm shadow-sm transition-colors"
              >
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-md border border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold px-4 py-2 text-sm shadow-sm transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md border border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold px-4 py-2 text-sm shadow-sm transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 text-sm shadow transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
} 
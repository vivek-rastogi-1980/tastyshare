"use client";

import Image from "next/image";
import Link from "next/link";
import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { SignupPopup } from "./components/signup-popup";
import { LoginPopup } from "./components/login-popup";

export default function Home() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [latestRecipes, setLatestRecipes] = useState<any[]>([]);
  const [featuredRecipes, setFeaturedRecipes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Check auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    async function fetchLatest() {
      const { data } = await supabase
        .from("recipes")
        .select("id, title, image_url")
        .order("created_at", { ascending: false })
        .limit(4);
      setLatestRecipes(data || []);
    }
    fetchLatest();
    async function fetchFeatured() {
      const { data } = await supabase
        .from("recipes")
        .select("id, title, image_url, recipe_categories:recipe_categories(category_id, categories:categories(name))")
        .order("created_at", { ascending: false })
        .limit(8);
      const featured = (data || []).filter((r: any) =>
        r.recipe_categories?.some((rc: any) => rc.categories?.name?.toLowerCase() === "featured")
      ).slice(0, 4);
      setFeaturedRecipes(featured);
    }
    fetchFeatured();
  }, []);
  // Keen Slider setup
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: {
      perView: 1,
      spacing: 16,
    },
    breakpoints: {
      "(min-width: 640px)": {
        slides: { perView: 2, spacing: 20 },
      },
      "(min-width: 1024px)": {
        slides: { perView: 3, spacing: 24 },
      },
    },
  });

  // Carousel navigation handlers
  const prev = () => instanceRef.current?.prev();
  const next = () => instanceRef.current?.next();

  return (
    <div
      className="min-h-screen flex flex-col font-sans relative"
      style={{
        backgroundImage: "url('/food-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-0" />
      <div className="relative z-10">
      {/* Header */}
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
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setUser(null);
                    router.push("/");
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 text-sm shadow transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsLoginOpen(true)}
                  className="inline-flex items-center justify-center rounded-md border border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold px-4 py-2 text-sm shadow-sm transition-colors"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignupOpen(true)}
                  className="inline-flex items-center justify-center rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 text-sm shadow transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center gap-6 px-6 py-16 md:py-24 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-orange-600 tracking-tight drop-shadow-sm">Find your next favorite recipe</h1>
        <p className="text-lg sm:text-xl text-gray-700 max-w-xl">Browse hundreds of easy, delicious recipes from cooks around the world.</p>
        <form className="w-full max-w-md mx-auto flex gap-2 mt-4">
          <input type="text" placeholder="Search recipes..." className="flex-1 rounded-l-md border border-orange-500 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-600" />
          <button type="submit" className="rounded-r-md bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 transition-colors">Search</button>
        </form>
      </section>

      {/* Recipe Listings */}
      <section className="max-w-6xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Popular Recipes */}
        <div>
          <h2 className="text-xl font-bold text-orange-500 mb-4">Popular Recipes</h2>
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow p-3 flex flex-col items-center border border-orange-100 hover:shadow-md transition">
                <div className="w-full h-28 bg-orange-100 rounded mb-2" />
                <div className="font-semibold text-sm text-gray-800 mb-1">Popular Recipe {i}</div>
                <div className="text-xs text-orange-400">Category</div>
              </div>
            ))}
          </div>
        </div>
        {/* Featured Recipes */}
        <div>
          <h2 className="text-xl font-bold text-orange-500 mb-4">Featured Recipes</h2>
          <div className="grid grid-cols-2 gap-4">
            {featuredRecipes.length === 0 ? (
              <div className="col-span-2 text-center text-gray-400">No featured recipes yet.</div>
            ) : (
              featuredRecipes.map((recipe: any) => (
                <a
                  key={recipe.id}
                  href={"/recipe/" + recipe.id}
                  className="bg-white rounded-xl shadow p-3 flex flex-col items-center border border-orange-100 hover:shadow-md transition group"
                >
                  {recipe.image_url ? (
                    <Image src={recipe.image_url} alt={recipe.title} width={160} height={112} className="w-full h-28 object-cover rounded mb-2" />
                  ) : (
                    <div className="w-full h-28 bg-orange-100 rounded mb-2 flex items-center justify-center text-orange-300">No Image</div>
                  )}
                  <div className="font-semibold text-sm text-gray-800 mb-1 group-hover:text-orange-600 transition-colors">{recipe.title}</div>
                </a>
              ))
            )}
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Latest Recipes */}
        <div>
          <h2 className="text-xl font-bold text-orange-500 mb-4">Latest Recipes</h2>
          <div className="grid grid-cols-2 gap-4">
            {latestRecipes.length === 0 ? (
              <div className="col-span-2 text-center text-gray-400">No recipes yet.</div>
            ) : (
              latestRecipes.map((recipe) => (
                <a
                  key={recipe.id}
                  href={"/recipe/" + recipe.id}
                  className="bg-white rounded-xl shadow p-3 flex flex-col items-center border border-orange-100 hover:shadow-md transition group"
                >
                  {recipe.image_url ? (
                    <Image src={recipe.image_url} alt={recipe.title} width={160} height={112} className="w-full h-28 object-cover rounded mb-2" />
                  ) : (
                    <div className="w-full h-28 bg-orange-100 rounded mb-2 flex items-center justify-center text-orange-300">No Image</div>
                  )}
                  <div className="font-semibold text-sm text-gray-800 mb-1 group-hover:text-orange-600 transition-colors">{recipe.title}</div>
                </a>
              ))
            )}
          </div>
        </div>
        {/* Seasonal Recipes */}
        <div>
          <h2 className="text-xl font-bold text-orange-500 mb-4">Seasonal Recipes</h2>
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow p-3 flex flex-col items-center border border-orange-100 hover:shadow-md transition">
                <div className="w-full h-28 bg-orange-100 rounded mb-2" />
                <div className="font-semibold text-sm text-gray-800 mb-1">Seasonal Recipe {i}</div>
                <div className="text-xs text-orange-400">Category</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Author Intro */}
      <section className="max-w-3xl mx-auto w-full px-6 py-10 flex flex-col md:flex-row items-center gap-8 bg-white/80 rounded-xl shadow border border-orange-100 mb-12">
        <Image src="/window.svg" alt="Author" width={96} height={96} className="rounded-full border-4 border-orange-200 shadow" />
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-bold text-orange-600 mb-1">Hi, I'm Jamie!</h3>
          <p className="text-gray-700 mb-2">Welcome to TastyShare, your go-to place for delicious, easy-to-follow recipes. I love sharing food that brings people together. Let’s cook something amazing!</p>
          <Link href="#" className="text-orange-500 font-semibold hover:underline">Learn more about me →</Link>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="max-w-xl mx-auto w-full px-6 py-8 bg-gradient-to-r from-orange-100 via-white to-amber-100 rounded-xl shadow border border-orange-200 mb-12 text-center">
        <h4 className="text-lg font-bold text-orange-600 mb-2">Get the best recipes in your inbox</h4>
        <p className="text-gray-600 mb-4">Sign up for our newsletter and never miss a tasty recipe!</p>
        <form className="flex flex-col sm:flex-row gap-2 justify-center">
          <input type="email" placeholder="Your email address" className="flex-1 rounded-md border border-orange-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <button type="submit" className="rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 transition-colors">Subscribe</button>
        </form>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 mt-auto text-center text-xs text-gray-400 border-t border-orange-100 bg-white/90">
        <div className="flex flex-col md:flex-row justify-center items-center gap-2">
          <span>&copy; {new Date().getFullYear()} TastyShare.</span>
          <span>Made with <span className="text-orange-500">&#10084;</span> for food lovers.</span>
        </div>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="#" className="hover:text-orange-500">Instagram</Link>
          <Link href="#" className="hover:text-orange-500">Pinterest</Link>
          <Link href="#" className="hover:text-orange-500">Contact</Link>
        </div>
      </footer>
      <SignupPopup isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </div>
    </div>
  );
}

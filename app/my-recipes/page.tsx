"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { Header } from "../components/header";
import { RecipeVotes } from "../components/recipe-votes";

const PAGE_SIZE = 6;

export default function MyRecipesPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Fetch user id on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Fetch recipes
  const fetchRecipes = useCallback(async () => {
    if (!userId || loading || !hasMore) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("recipes")
      .select("id, title, image_url")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(recipes.length, recipes.length + PAGE_SIZE - 1);
    if (error) {
      setLoading(false);
      return;
    }
    setRecipes(prev => [...prev, ...(data || [])]);
    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoading(false);
  }, [userId, loading, hasMore, recipes.length]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) fetchRecipes();
      },
      { threshold: 1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [fetchRecipes, hasMore, loading]);

  // Initial fetch when userId is set
  useEffect(() => {
    if (userId) {
      setRecipes([]);
      setHasMore(true);
    }
  }, [userId]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 via-white to-amber-100 font-sans">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto py-10 px-4 w-full">
        <h1 className="text-2xl font-bold mb-6 text-orange-600">My Recipes</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {recipes.length === 0 && !loading && (
            <div className="col-span-3 text-center text-gray-400">No recipes found.</div>
          )}
          {recipes.map(recipe => (
            <div
              key={recipe.id}
              className="bg-white rounded-xl shadow p-3 flex flex-col items-center border border-orange-100 hover:shadow-md transition group relative"
            >
              <Link href={`/recipe/${recipe.id}`} className="w-full flex flex-col items-center">
                {recipe.image_url ? (
                  <Image src={recipe.image_url} alt={recipe.title} width={160} height={112} className="w-full h-28 object-cover rounded mb-2" />
                ) : (
                  <div className="w-full h-28 bg-orange-100 rounded mb-2 flex items-center justify-center text-orange-300">No Image</div>
                )}
                <div className="font-semibold text-sm text-gray-800 mb-1 group-hover:text-orange-600 transition-colors text-center w-full truncate">{recipe.title}</div>
              </Link>
              
              {/* Voting Section */}
              <div className="mt-2 mb-2">
                <RecipeVotes recipeId={recipe.id} userId={userId || undefined} />
              </div>
              
              <div className="flex gap-2 mt-2">
                <Link
                  href={`/edit-recipe/${recipe.id}`}
                  className="px-3 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200 text-xs font-semibold transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this recipe?')) {
                      await supabase.from('recipes').delete().eq('id', recipe.id);
                      setRecipes(recipes => recipes.filter(r => r.id !== recipe.id));
                    }
                  }}
                  className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div ref={loaderRef} className="h-12 flex items-center justify-center">
          {loading && <span className="text-orange-500">Loading...</span>}
          {!hasMore && recipes.length > 0 && <span className="text-gray-400">No more recipes.</span>}
        </div>
      </main>

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
    </div>
  );
} 
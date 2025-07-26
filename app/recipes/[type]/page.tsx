"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { Header } from "../../components/header";
import { RecipeVotes } from "../../components/recipe-votes";

interface Recipe {
  id: string;
  title: string;
  image_url?: string;
  user_id?: string;
  username?: string;
}

const typeToCategory = {
  popular: "popular",
  featured: "featured",
  seasonal: "seasonal",
};

export default function RecipesTypePage() {
  const { type } = useParams<{ type: string }>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Decode the category name from URL
  const decodedType = type ? decodeURIComponent(type).replace(/-/g, ' ') : '';

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    async function fetchRecipes() {
      setLoading(true);
      setError(null);
      let data: any[] = [];
      if (type === "latest") {
        // Latest: just order by created_at
        const { data: latest, error } = await supabase
          .from("recipes")
          .select("id, title, image_url, user_id")
          .order("created_at", { ascending: false });
        if (error) {
          setError("Failed to fetch recipes");
          setLoading(false);
          return;
        }
        data = latest || [];
      } else {
        // Filter by category (including generic categories)
        const { data: all, error } = await supabase
          .from("recipes")
          .select(`
            id,
            title,
            image_url,
            user_id,
            recipe_categories:recipe_categories(category_id, categories:categories(name))
          `)
          .order("created_at", { ascending: false });
        if (error) {
          setError("Failed to fetch recipes");
          setLoading(false);
          return;
        }
        
        // Check if it's a special category or generic category
        const specialCategories = ["popular", "featured", "seasonal"];
        if (specialCategories.includes(decodedType)) {
          data = (all || []).filter((r: any) =>
            r.recipe_categories?.some((rc: any) => rc.categories?.name?.toLowerCase() === decodedType)
          );
        } else {
          // Generic category - filter by exact category name
          data = (all || []).filter((r: any) =>
            r.recipe_categories?.some((rc: any) => rc.categories?.name?.toLowerCase() === decodedType.toLowerCase())
          );
        }
      }
      // Fetch usernames
      const recipesWithUsername = await Promise.all(
        data.map(async (recipe) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", recipe.user_id)
            .single();
          return {
            ...recipe,
            username: profile?.full_name || "Unknown",
            user_id: recipe.user_id,
          };
        })
      );
      setRecipes(recipesWithUsername);
      setLoading(false);
    }
    fetchRecipes();
  }, [decodedType]);

  let heading = "";
  if (decodedType === "popular") heading = "Popular Recipes";
  else if (decodedType === "featured") heading = "Featured Recipes";
  else if (decodedType === "seasonal") heading = "Seasonal Recipes";
  else if (decodedType === "latest") heading = "Latest Recipes";
  else heading = `${decodedType.charAt(0).toUpperCase() + decodedType.slice(1)} Recipes`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-100 font-sans">
      <Header />
      <main className="max-w-6xl mx-auto py-10 px-4 w-full">
        <h1 className="text-2xl font-bold mb-8 text-orange-600">{heading}</h1>
        {loading ? (
          <div className="text-center text-orange-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : recipes.length === 0 ? (
          <div className="text-center text-gray-400">No recipes found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipe/${recipe.id}`}
                className="bg-white rounded-xl shadow p-4 flex flex-col border border-orange-100 hover:shadow-md transition group"
              >
                {recipe.image_url ? (
                  <img src={recipe.image_url} alt={recipe.title} width={200} height={150} className="w-full h-32 object-cover rounded mb-3" />
                ) : (
                  <div className="w-full h-32 bg-orange-100 rounded mb-3 flex items-center justify-center text-orange-300">No Image</div>
                )}
                <div className="font-semibold text-sm text-gray-800 mb-1 group-hover:text-orange-600 transition-colors line-clamp-2">{recipe.title}</div>
                {recipe.username && (
                  <div className="text-xs text-gray-500 text-center">
                    By <Link href={`/user/${recipe.user_id}`} className="text-orange-600 hover:text-orange-700 hover:underline transition-colors" onClick={e => e.stopPropagation()}>{recipe.username}</Link>
                  </div>
                )}
                
                {/* Voting Section */}
                <div className="mt-2">
                  <RecipeVotes recipeId={recipe.id} userId={user?.id} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 
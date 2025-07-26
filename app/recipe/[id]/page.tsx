"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [instructions, setInstructions] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecipe() {
      setLoading(true);
      // Fetch recipe
      const { data: recipeData } = await supabase.from("recipes").select("*", { count: "exact" }).eq("id", id).single();
      setRecipe(recipeData);
      // Fetch ingredients
      const { data: ingData } = await supabase.from("ingredients").select("name, quantity").eq("recipe_id", id);
      setIngredients(ingData || []);
      // Fetch instructions
      const { data: instData } = await supabase.from("instructions").select("step_number, description").eq("recipe_id", id).order("step_number");
      setInstructions(instData || []);
      // Fetch tags (categories)
      const { data: tagData } = await supabase
        .from("recipe_categories")
        .select("categories(name)")
        .eq("recipe_id", id);
      setTags(tagData?.map((t: any) => t.categories?.name).filter(Boolean) || []);
      setLoading(false);
    }
    if (id) fetchRecipe();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-500">Loading...</div>;
  if (!recipe) return <div className="min-h-screen flex items-center justify-center text-gray-400">Recipe not found.</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 via-white to-amber-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur border-b border-orange-100 shadow-sm">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 select-none">
            <span className="text-2xl font-extrabold text-orange-600 tracking-tight">TastyShare</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/profile" className="inline-flex items-center justify-center rounded-md border border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold px-4 py-2 text-sm shadow-sm transition-colors">Profile</Link>
            <Link href="/add-recipe" className="inline-flex items-center justify-center rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 text-sm shadow transition-colors">Add Recipe</Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-2xl mx-auto py-10 px-4 w-full">
        <h1 className="text-3xl font-extrabold text-orange-600 mb-4">{recipe.title}</h1>
        {recipe.image_url && (
          <Image src={recipe.image_url} alt={recipe.title} width={480} height={320} className="w-full h-64 object-cover rounded-xl border mb-6" />
        )}
        <div className="mb-4 text-gray-700 text-lg">{recipe.description}</div>
        {tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className="bg-orange-100 text-orange-700 rounded-full px-3 py-1 text-xs font-semibold">{tag}</span>
            ))}
          </div>
        )}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-orange-500 mb-2">Ingredients</h2>
          <ul className="list-disc pl-6 space-y-1">
            {ingredients.map((ing, idx) => (
              <li key={idx} className="text-gray-800">{ing.quantity} {ing.name}</li>
            ))}
          </ul>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-orange-500 mb-2">Instructions</h2>
          <ol className="list-decimal pl-6 space-y-2">
            {instructions.map((inst, idx) => (
              <li key={idx} className="text-gray-800">{inst.description}</li>
            ))}
          </ol>
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
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { Header } from "../../components/header";
import { RecipeVotes } from "../../components/recipe-votes";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [instructions, setInstructions] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

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
      <Header />

      {/* Social Share Links */}
      <div className="flex justify-end max-w-2xl mx-auto mt-4 px-4 gap-3">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
          className="text-blue-600 hover:text-blue-800 text-xl"
        >
          <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"/></svg>
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
          className="text-black hover:text-gray-700 text-xl"
        >
          <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24"><path d="M22.162 0H1.838C.822 0 0 .822 0 1.838v20.324C0 23.178.822 24 1.838 24h20.324A1.84 1.84 0 0 0 24 22.162V1.838A1.84 1.84 0 0 0 22.162 0zM7.19 20.452H3.548V9.048H7.19v11.404zm-1.821-13.01a2.09 2.09 0 1 1 0-4.18 2.09 2.09 0 0 1 0 4.18zm15.083 13.01h-3.642v-5.604c0-1.336-.025-3.057-1.864-3.057-1.864 0-2.15 1.454-2.15 2.956v5.705h-3.642V9.048h3.497v1.561h.05c.487-.922 1.677-1.894 3.453-1.894 3.693 0 4.372 2.43 4.372 5.59v6.147z"/></svg>
        </a>
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
          className="text-green-500 hover:text-green-700 text-xl"
        >
          <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.363.709.306 1.262.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.617h-.001a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.987c-.003 5.45-4.437 9.884-9.88 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05.001C5.495.001.001 5.495.001 12.053c0 2.123.555 4.199 1.607 6.032L.057 23.778a1.18 1.18 0 0 0 1.451 1.451l5.717-1.548a11.888 11.888 0 0 0 5.825 1.482h.005c6.557 0 11.95-5.494 11.952-12.051a11.87 11.87 0 0 0-3.487-8.413"/></svg>
        </a>
        <a
          href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Pinterest"
          className="text-red-600 hover:text-red-800 text-xl"
        >
          <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.396 7.627 11.093-.105-.943-.2-2.392.042-3.423.219-.956 1.408-6.096 1.408-6.096s-.36-.719-.36-1.781c0-1.668.968-2.915 2.172-2.915 1.024 0 1.519.769 1.519 1.691 0 1.03-.655 2.567-.993 3.997-.283 1.2.601 2.178 1.782 2.178 2.138 0 3.782-2.254 3.782-5.507 0-2.882-2.072-4.893-5.034-4.893-3.434 0-5.447 2.574-5.447 5.236 0 1.03.396 2.137.891 2.738.099.12.113.225.083.345-.09.377-.293 1.2-.333 1.367-.05.198-.162.241-.376.146-1.404-.573-2.278-2.37-2.278-3.818 0-3.108 2.527-6.84 7.537-6.84 4.025 0 6.671 2.91 6.671 6.043 0 4.13-2.292 7.217-5.687 7.217-1.139 0-2.21-.617-2.577-1.312l-.701 2.672c-.201.765-.597 1.719-.889 2.304.67.206 1.377.318 2.116.318 6.627 0 12-5.373 12-12S18.627 0 12 0"/></svg>
        </a>
        <a
          href={`https://www.instagram.com/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Instagram"
          className="text-pink-500 hover:text-pink-700 text-xl"
        >
          <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.069 1.646.069 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.069-4.85.069s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.241-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.771.131 4.659.425 3.678 1.406c-.98.98-1.274 2.092-1.334 3.374C2.013 5.668 2 6.077 2 12c0 5.923.013 6.332.072 7.612.06 1.282.354 2.394 1.334 3.374.98.98 2.092 1.274 3.374 1.334C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.072c1.282-.06 2.394-.354 3.374-1.334.98-.98 1.274-2.092 1.334-3.374.059-1.28.072-1.689.072-7.612 0-5.923-.013-6.332-.072-7.612-.06-1.282-.354-2.394-1.334-3.374-.98-.98-2.092-1.274-3.374-1.334C15.668.013 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
        </a>
      </div>

      <main className="flex-1 max-w-2xl mx-auto py-10 px-4 w-full">
        <h1 className="text-3xl font-extrabold text-orange-600 mb-4">{recipe.title}</h1>
        {recipe.image_url && (
          <Image src={recipe.image_url} alt={recipe.title} width={480} height={320} className="w-full h-64 object-cover rounded-xl border mb-6" />
        )}
        <div className="mb-4 text-gray-700 text-lg">{recipe.description}</div>
        
        {/* Voting Section */}
        <div className="mb-6">
          <RecipeVotes recipeId={recipe.id} userId={user?.id} />
        </div>
        
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
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { Header } from "../../components/header";

interface Ingredient {
  name: string;
  quantity: string;
}
interface Instruction {
  description: string;
}

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch all categories for autocomplete
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from("categories").select("name");
      if (data) setAllCategories(data.map((c: any) => c.name));
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchRecipe() {
      setTagsLoading(true);
      const { data: recipe } = await supabase.from("recipes").select("*").eq("id", id).single();
      if (recipe) {
        setTitle(recipe.title || "");
        setDescription(recipe.description || "");
        setImageUrl(recipe.image_url || null);
      }
      const { data: ingData } = await supabase.from("ingredients").select("name, quantity").eq("recipe_id", id);
      setIngredients(ingData && ingData.length ? ingData : [{ name: "", quantity: "" }]);
      const { data: instData } = await supabase.from("instructions").select("description").eq("recipe_id", id).order("step_number");
      setInstructions(instData && instData.length ? instData : [{ description: "" }]);
      const { data: tagData } = await supabase
        .from("recipe_categories")
        .select("category_id, categories:categories(name)")
        .eq("recipe_id", id);
      if (tagData && Array.isArray(tagData)) {
        const tagNames = tagData.map((t: any) => t.categories?.name).filter(Boolean);
        setTags(tagNames);
      } else {
        setTags([]);
      }
      setTagsLoading(false);
    }
    if (id) fetchRecipe();
  }, [id]);

  function handleTagInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTagInput(e.target.value);
    setShowSuggestions(true);
  }
  function handleTagInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput("");
      setShowSuggestions(false);
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }
  function handleSuggestionClick(suggestion: string) {
    if (!tags.includes(suggestion)) setTags([...tags, suggestion]);
    setTagInput("");
    setShowSuggestions(false);
  }
  function removeTag(idx: number) {
    setTags(tags.filter((_, i) => i !== idx));
  }
  function handleIngredientChange(idx: number, field: keyof Ingredient, value: string) {
    setIngredients(ings => ings.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  }
  function handleInstructionChange(idx: number, value: string) {
    setInstructions(insts => insts.map((inst, i) => i === idx ? { description: value } : inst));
  }
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      // Upload image if present
      let uploadedImageUrl = imageUrl;
      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        const res = await fetch("/api/upload-profile-image", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) uploadedImageUrl = data.url;
      }
      // Update recipe
      await supabase.from("recipes").update({
        title,
        description,
        image_url: uploadedImageUrl,
      }).eq("id", id);
      // Update ingredients
      await supabase.from("ingredients").delete().eq("recipe_id", id);
      for (const ing of ingredients.filter(i => i.name)) {
        await supabase.from("ingredients").insert({
          recipe_id: id,
          name: ing.name,
          quantity: ing.quantity,
        });
      }
      // Update instructions
      await supabase.from("instructions").delete().eq("recipe_id", id);
      for (let i = 0; i < instructions.length; i++) {
        const inst = instructions[i];
        if (inst.description) {
          await supabase.from("instructions").insert({
            recipe_id: id,
            step_number: i + 1,
            description: inst.description,
          });
        }
      }
      // Update tags (categories)
      await supabase.from("recipe_categories").delete().eq("recipe_id", id);
      for (const tag of tags) {
        let { data: catRow } = await supabase.from("categories").select("id").eq("name", tag).single();
        if (!catRow) {
          const { data: newCat } = await supabase.from("categories").insert({ name: tag }).select().single();
          catRow = newCat;
        }
        if (catRow) {
          await supabase.from("recipe_categories").insert({
            recipe_id: id,
            category_id: catRow.id,
          });
        }
      }
      setSuccessMsg("Recipe updated successfully!");
      setErrorMsg(null);
      setTimeout(() => router.push("/my-recipes"), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update recipe");
      setSuccessMsg(null);
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 via-white to-amber-100 font-sans">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto py-10 px-4 w-full">
        <h1 className="text-2xl font-bold mb-6 text-orange-600">Edit Recipe</h1>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {successMsg && <div className="text-green-600 text-center text-sm font-medium">{successMsg}</div>}
          {errorMsg && <div className="text-red-600 text-center text-sm font-medium">{errorMsg}</div>}
          <div>
            <label className="block text-sm font-semibold mb-1 text-orange-700">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full rounded border border-orange-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 placeholder-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-orange-700">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required className="w-full rounded border border-orange-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 placeholder-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-orange-700">Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full" />
            {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 w-32 h-24 object-cover rounded border" />}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-orange-700">Ingredients</label>
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input type="text" placeholder="Name" value={ing.name} onChange={e => handleIngredientChange(idx, "name", e.target.value)} className="flex-1 rounded border border-orange-300 px-2 py-1 text-gray-900 placeholder-gray-400" />
                <input type="text" placeholder="Quantity" value={ing.quantity} onChange={e => handleIngredientChange(idx, "quantity", e.target.value)} className="w-28 rounded border border-orange-300 px-2 py-1 text-gray-900 placeholder-gray-400" />
                {ingredients.length > 1 && <button type="button" onClick={() => setIngredients(ings => ings.filter((_, i) => i !== idx))} className="text-red-500 font-bold">×</button>}
              </div>
            ))}
            <button type="button" onClick={() => setIngredients([...ingredients, { name: "", quantity: "" }])} className="text-orange-500 font-semibold mt-1">+ Add Ingredient</button>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-orange-700">Instructions</label>
            {instructions.map((inst, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <textarea placeholder={`Step ${idx + 1}`} value={inst.description} onChange={e => handleInstructionChange(idx, e.target.value)} className="flex-1 rounded border border-orange-300 px-2 py-1 text-gray-900 placeholder-gray-400" />
                {instructions.length > 1 && <button type="button" onClick={() => setInstructions(insts => insts.filter((_, i) => i !== idx))} className="text-red-500 font-bold">×</button>}
              </div>
            ))}
            <button type="button" onClick={() => setInstructions([...instructions, { description: "" }])} className="text-orange-500 font-semibold mt-1">+ Add Step</button>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-orange-700">Tags (Categories)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tagsLoading ? (
                <span className="text-orange-400 text-xs">Loading tags...</span>
              ) : (
                tags.map((tag, idx) => (
                  <span key={tag} className="flex items-center bg-orange-100 text-orange-700 rounded-full px-3 py-1 text-sm font-medium">
                    {tag}
                    <button type="button" className="ml-2 text-orange-500 hover:text-orange-700" onClick={() => removeTag(idx)}>&times;</button>
                  </span>
                ))
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                onFocus={() => tagInput && setShowSuggestions(true)}
                placeholder="Type a tag and press Enter or comma"
                className="w-full rounded border border-orange-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 placeholder-gray-400"
                autoComplete="off"
              />
              {showSuggestions && tagInput && (
                <div className="absolute left-0 right-0 bg-white border border-orange-200 rounded shadow z-10 max-h-40 overflow-y-auto">
                  {allCategories
                    .filter(cat => cat.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(cat))
                    .slice(0, 8)
                    .map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-orange-50 text-orange-700 text-sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  {allCategories.filter(cat => cat.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(cat)).length === 0 && (
                    <div className="px-4 py-2 text-gray-400 text-sm">No suggestions</div>
                  )}
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 transition-colors self-end" disabled={isLoading}>
            {isLoading ? "Saving..." : "Update Recipe"}
          </button>
        </form>
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
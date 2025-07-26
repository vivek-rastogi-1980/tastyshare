"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "../components/header";

interface Ingredient {
  name: string;
  quantity: string;
}

interface Instruction {
  description: string;
}

export default function AddRecipePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: "", quantity: "" }]);
  const [instructions, setInstructions] = useState<Instruction[]>([{ description: "" }]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  // Tag input handlers
  function handleTagInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTagInput(e.target.value);
  }

  function handleTagInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  function removeTag(idx: number) {
    setTags(tags.filter((_, i) => i !== idx));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    // Optionally, preview image
    setImageUrl(URL.createObjectURL(file));
  }

  function handleIngredientChange(idx: number, field: keyof Ingredient, value: string) {
    setIngredients(ings => ings.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  }

  function handleInstructionChange(idx: number, value: string) {
    setInstructions(insts => insts.map((inst, i) => i === idx ? { description: value } : inst));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      // Upload image if present
      let uploadedImageUrl = null;
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
      // Insert recipe
      const { data: recipe, error: recipeError } = await supabase.from("recipes").insert({
        user_id: user.id,
        title,
        description,
        image_url: uploadedImageUrl,
      }).select().single();
      if (recipeError || !recipe) throw new Error(recipeError?.message || "Failed to create recipe");
      // Insert ingredients
      for (const ing of ingredients.filter(i => i.name)) {
        await supabase.from("ingredients").insert({
          recipe_id: recipe.id,
          name: ing.name,
          quantity: ing.quantity,
        });
      }
      // Insert instructions
      for (let i = 0; i < instructions.length; i++) {
        const inst = instructions[i];
        if (inst.description) {
          await supabase.from("instructions").insert({
            recipe_id: recipe.id,
            step_number: i + 1,
            description: inst.description,
          });
        }
      }
      // Upsert categories and associate with recipe
      for (const tag of tags) {
        // Try to get category
        let { data: catRow } = await supabase.from("categories").select("id").eq("name", tag).single();
        if (!catRow) {
          // Insert new category
          const { data: newCat } = await supabase.from("categories").insert({ name: tag }).select().single();
          catRow = newCat;
        }
        if (catRow) {
          await supabase.from("recipe_categories").insert({
            recipe_id: recipe.id,
            category_id: catRow.id,
          });
        }
      }
      setSuccessMsg("Recipe added successfully!");
      setErrorMsg(null);
      setTimeout(() => router.push("/my-recipes"), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add recipe");
      setSuccessMsg(null);
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 via-white to-amber-100 font-sans">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto py-10 px-4 w-full">
        <h1 className="text-2xl font-bold mb-6 text-orange-600">Add New Recipe</h1>
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
              {tags.map((tag, idx) => (
                <span key={tag} className="flex items-center bg-orange-100 text-orange-700 rounded-full px-3 py-1 text-sm font-medium">
                  {tag}
                  <button type="button" className="ml-2 text-orange-500 hover:text-orange-700" onClick={() => removeTag(idx)}>&times;</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Type a tag and press Enter or comma"
              className="w-full rounded border border-orange-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 placeholder-gray-400"
            />
          </div>
          <button type="submit" className="rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 transition-colors self-end" disabled={isLoading}>
            {isLoading ? "Saving..." : "Add Recipe"}
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
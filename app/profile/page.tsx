"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

interface Profile {
  id: string;
  full_name: string;
  hobbies: string;
  profile_pic: string | null;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      
      // Fetch profile data
      const { data } = await supabase
        .from("profiles")
        .select("full_name, hobbies, profile_pic")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setFullName(data.full_name || "");
        setHobbies(data.hobbies || "");
        setProfilePic(data.profile_pic || null);
      }

      // Fetch user's recipes
      const { data: recipes } = await supabase
        .from("recipes")
        .select("id, title, description, image_url, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setUserRecipes(recipes || []);
    }
    fetchProfile();
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-profile-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) setProfilePic(data.url);
      else setUploadError("Upload failed");
    } catch (err) {
      setUploadError("Image upload failed.");
    }
    setIsUploading(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      hobbies,
      profile_pic: profilePic,
    });
    if (error) {
      setSaveError("Failed to save profile. " + error.message);
      setSaveMessage(null);
    } else {
      setSaveMessage("Profile saved successfully!");
      setSaveError(null);
      setIsEditing(false);
    }
    setTimeout(() => {
      setSaveMessage(null);
      setSaveError(null);
    }, 3000);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-white shadow-sm border-b border-gray-200">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 select-none">
            <span className="text-2xl font-extrabold text-orange-600 tracking-tight">TastyShare</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/profile" className="inline-flex items-center justify-center rounded-md border border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold px-4 py-2 text-sm shadow-sm transition-colors">Profile</Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="inline-flex items-center justify-center rounded-md bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 text-sm shadow transition-colors"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-6xl mx-auto py-8 px-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              {/* Profile Image */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-32 h-32 mb-4">
                  {profilePic ? (
                    <Image 
                      src={profilePic} 
                      alt="Profile" 
                      fill 
                      className="rounded-full object-cover border-4 border-orange-200" 
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center text-4xl text-orange-400 border-4 border-orange-200">
                      <span>?</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </div>
                {isUploading && <div className="text-sm text-gray-500 mb-2">Uploading...</div>}
                {uploadError && <div className="text-sm text-red-500 mb-2">{uploadError}</div>}
              </div>

              {/* Profile Info */}
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {saveMessage && <div className="text-green-600 text-sm font-medium">{saveMessage}</div>}
                  {saveError && <div className="text-red-600 text-sm font-medium">{saveError}</div>}
                  
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700">Hobbies</label>
                    <input
                      type="text"
                      value={hobbies}
                      onChange={e => setHobbies(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900"
                      placeholder="e.g. Cooking, Baking, Photography"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 rounded border border-gray-300 text-gray-700 font-semibold px-4 py-2 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">{fullName || "Your Name"}</h2>
                    <p className="text-gray-600 text-sm">{hobbies || "Add your hobbies"}</p>
                  </div>
                  
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <Link 
                  href="/add-recipe" 
                  className="block w-full rounded bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold px-4 py-2 text-center transition-colors"
                >
                  Add New Recipe
                </Link>
                <Link 
                  href="/my-recipes" 
                  className="block w-full rounded border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 text-center transition-colors"
                >
                  View All Recipes
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side - Recipe Posts */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {userRecipes.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="text-gray-400 text-lg mb-4">No recipes yet</div>
                  <p className="text-gray-500 mb-6">Start sharing your delicious recipes with the community!</p>
                  <Link 
                    href="/add-recipe" 
                    className="inline-block rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 transition-colors"
                  >
                    Add Your First Recipe
                  </Link>
                </div>
              ) : (
                userRecipes.map((recipe) => (
                  <div key={recipe.id} className="bg-white rounded-lg shadow">
                    {/* Post Header */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          {profilePic ? (
                            <Image 
                              src={profilePic} 
                              alt="Profile" 
                              width={40} 
                              height={40} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-400 text-sm font-bold">
                              {fullName ? fullName.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{fullName || "Your Name"}</div>
                          <div className="text-sm text-gray-500">{formatDate(recipe.created_at)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{recipe.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">{recipe.description}</p>
                      
                      {recipe.image_url && (
                        <div className="mb-4">
                          <Image 
                            src={recipe.image_url} 
                            alt={recipe.title} 
                            width={600} 
                            height={400} 
                            className="w-full h-64 object-cover rounded-lg" 
                          />
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <Link 
                          href={`/recipe/${recipe.id}`}
                          className="text-orange-600 hover:text-orange-700 font-semibold text-sm"
                        >
                          View Recipe
                        </Link>
                        <div className="flex gap-4">
                          <Link 
                            href={`/edit-recipe/${recipe.id}`}
                            className="text-gray-500 hover:text-gray-700 text-sm"
                          >
                            Edit
                          </Link>
                          <button 
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this recipe?')) {
                                await supabase.from('recipes').delete().eq('id', recipe.id);
                                setUserRecipes(prev => prev.filter(r => r.id !== recipe.id));
                              }
                            }}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 mt-auto text-center text-xs text-gray-400 border-t border-gray-200 bg-white">
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
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

export default function ProfilePage() {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
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
    }
    setTimeout(() => {
      setSaveMessage(null);
      setSaveError(null);
    }, 3000);
  }

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

      <main className="flex-1 max-w-xl mx-auto py-12 px-4 w-full">
        <h1 className="text-2xl font-bold mb-6 text-orange-600">My Profile</h1>
        <form className="flex flex-col gap-6" onSubmit={handleSaveProfile}>
          {saveMessage && <div className="text-green-600 text-center text-sm font-medium">{saveMessage}</div>}
          {saveError && <div className="text-red-600 text-center text-sm font-medium">{saveError}</div>}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24">
              {profilePic ? (
                <Image src={profilePic} alt="Profile" fill className="rounded-full object-cover border-4 border-orange-200" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-3xl text-orange-400 border-4 border-orange-200">
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
            {isUploading && <div className="text-xs text-gray-500">Uploading...</div>}
            {uploadError && <div className="text-xs text-red-500">{uploadError}</div>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-orange-700">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full rounded border border-orange-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 placeholder-gray-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-orange-700">Hobbies</label>
            <input
              type="text"
              value={hobbies}
              onChange={e => setHobbies(e.target.value)}
              className="w-full rounded border border-orange-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 placeholder-gray-400"
              placeholder="e.g. Cooking, Baking, Photography"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 transition-colors self-end"
          >
            Save Profile
          </button>
        </form>
        <div className="mt-10 flex flex-col gap-4">
          <Link href="/add-recipe" className="rounded bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold px-4 py-2 text-center">Add New Recipe</Link>
          <Link href="/my-recipes" className="rounded bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold px-4 py-2 text-center">View My Recipes</Link>
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
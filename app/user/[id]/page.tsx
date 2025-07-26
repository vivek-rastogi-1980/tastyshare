"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { Header } from "../../components/header";
import { RecipeVotes } from "../../components/recipe-votes";

interface UserProfile {
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

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, hobbies, profile_pic")
          .eq("id", id)
          .single();

        if (profileError) {
          setError("User not found");
          setLoading(false);
          return;
        }

        setProfile(profileData);

        // Fetch user's recipes
        const { data: recipes } = await supabase
          .from("recipes")
          .select("id, title, description, image_url, created_at")
          .eq("user_id", id)
          .order("created_at", { ascending: false });

        setUserRecipes(recipes || []);
      } catch (err) {
        setError("Failed to load user profile");
      }
      setLoading(false);
    }

    fetchUserProfile();
  }, [id]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-orange-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error || "User not found"}</div>
          <Link href="/" className="text-orange-600 hover:text-orange-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto py-8 px-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              {/* Profile Image */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 mb-4">
                  {profile.profile_pic ? (
                    <Image 
                      src={profile.profile_pic} 
                      alt="Profile" 
                      width={128}
                      height={128}
                      className="rounded-full object-cover border-4 border-orange-200" 
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center text-4xl text-orange-400 border-4 border-orange-200">
                      <span>{profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">{profile.full_name}</h2>
                  <p className="text-gray-600 text-sm">{profile.hobbies || "No hobbies listed"}</p>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold">{userRecipes.length}</span> recipe{userRecipes.length !== 1 ? 's' : ''} shared
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Recipe Posts */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {userRecipes.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="text-gray-400 text-lg mb-4">No recipes yet</div>
                  <p className="text-gray-500">This user hasn't shared any recipes yet.</p>
                </div>
              ) : (
                userRecipes.map((recipe) => (
                  <div key={recipe.id} className="bg-white rounded-lg shadow">
                    {/* Post Header */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          {profile.profile_pic ? (
                            <Image 
                              src={profile.profile_pic} 
                              alt="Profile" 
                              width={40} 
                              height={40} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-400 text-sm font-bold">
                              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{profile.full_name}</div>
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
                        <div className="flex items-center gap-4">
                          <RecipeVotes recipeId={recipe.id} userId={currentUser?.id} />
                        </div>
                        <Link 
                          href={`/recipe/${recipe.id}`}
                          className="text-orange-600 hover:text-orange-700 font-semibold text-sm"
                        >
                          View Recipe
                        </Link>
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
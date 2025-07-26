"use client";

import Link from "next/link";
import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { SignupPopup } from "./components/signup-popup";
import { LoginPopup } from "./components/login-popup";
import { RecipeCarousel } from "./components/recipe-carousel";

export default function Home() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [latestRecipes, setLatestRecipes] = useState<any[]>([]);
  const [featuredRecipes, setFeaturedRecipes] = useState<any[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<any[]>([]);
  const [seasonalRecipes, setSeasonalRecipes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<null | "success" | "error" | "duplicate">(null);
  const [subscribeMsg, setSubscribeMsg] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

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
        .select(`
          id, 
          title, 
          image_url,
          user_id
        `)
        .order("created_at", { ascending: false })
        .limit(4);
      
      // Fetch usernames separately to avoid query issues
      const recipesWithUsername = await Promise.all(
        (data || []).map(async (recipe) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", recipe.user_id)
            .single();
          
          return {
            ...recipe,
            username: profile?.full_name || "Unknown",
            user_id: recipe.user_id
          };
        })
      );
      
      setLatestRecipes(recipesWithUsername);
    }
    fetchLatest();
    async function fetchFeatured() {
      const { data } = await supabase
        .from("recipes")
        .select(`
          id, 
          title, 
          image_url, 
          user_id,
          recipe_categories:recipe_categories(category_id, categories:categories(name))
        `)
        .order("created_at", { ascending: false })
        .limit(8);
      const featured = (data || []).filter((r: any) =>
        r.recipe_categories?.some((rc: any) => rc.categories?.name?.toLowerCase() === "featured")
      ).slice(0, 4);
      
      // Fetch usernames separately
      const featuredWithUsername = await Promise.all(
        featured.map(async (recipe) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", recipe.user_id)
            .single();
          
          return {
            ...recipe,
            username: profile?.full_name || "Unknown",
            user_id: recipe.user_id
          };
        })
      );
      
      setFeaturedRecipes(featuredWithUsername);
    }
    fetchFeatured();
    async function fetchPopular() {
      const { data } = await supabase
        .from("recipes")
        .select(`
          id, 
          title, 
          image_url, 
          user_id,
          recipe_categories:recipe_categories(category_id, categories:categories(name))
        `)
        .order("created_at", { ascending: false })
        .limit(8);
      const popular = (data || []).filter((r: any) =>
        r.recipe_categories?.some((rc: any) => rc.categories?.name?.toLowerCase() === "popular")
      ).slice(0, 4);
      
      // Fetch usernames separately
      const popularWithUsername = await Promise.all(
        popular.map(async (recipe) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", recipe.user_id)
            .single();
          
          return {
            ...recipe,
            username: profile?.full_name || "Unknown",
            user_id: recipe.user_id
          };
        })
      );
      
      setPopularRecipes(popularWithUsername);
    }
    fetchPopular();
    async function fetchSeasonal() {
      const { data } = await supabase
        .from("recipes")
        .select(`
          id, 
          title, 
          image_url, 
          user_id,
          recipe_categories:recipe_categories(category_id, categories:categories(name))
        `)
        .order("created_at", { ascending: false })
        .limit(8);
      const seasonal = (data || []).filter((r: any) =>
        r.recipe_categories?.some((rc: any) => rc.categories?.name?.toLowerCase() === "seasonal")
      ).slice(0, 4);
      
      // Fetch usernames separately
      const seasonalWithUsername = await Promise.all(
        seasonal.map(async (recipe) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", recipe.user_id)
            .single();
          
          return {
            ...recipe,
            username: profile?.full_name || "Unknown",
            user_id: recipe.user_id
          };
        })
      );
      
      setSeasonalRecipes(seasonalWithUsername);
    }
    fetchSeasonal();
    
    // Fetch categories
    async function fetchCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      
      // Filter out featured, popular, and seasonal categories
      const filteredCategories = (data || []).filter((category: any) => {
        const categoryName = category.name.toLowerCase();
        return !['featured', 'popular', 'seasonal'].includes(categoryName);
      });
      
      setCategories(filteredCategories);
    }
    fetchCategories();
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

  // Search functionality
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const safeQuery = searchQuery.replace(/[%,()]/g, '').trim();

      // Get all recipes and filter in JavaScript for better control
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          description,
          image_url,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        return;
      }

      // Filter recipes by title and description first
      const filteredRecipes = recipes?.filter(recipe => {
        const titleMatch = recipe.title?.toLowerCase().includes(safeQuery.toLowerCase());
        const descMatch = recipe.description?.toLowerCase().includes(safeQuery.toLowerCase());
        
        return titleMatch || descMatch;
      }) || [];

      // If we have results, fetch additional data for display
      if (filteredRecipes.length > 0) {
        const enrichedRecipes = await Promise.all(
          filteredRecipes.map(async (recipe) => {
            // Get user profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', recipe.user_id)
              .single();

            // Get categories
            const { data: categories } = await supabase
              .from('recipe_categories')
              .select(`
                category_id,
                categories:categories(name)
              `)
              .eq('recipe_id', recipe.id);

            return {
              ...recipe,
              profiles: profile,
              recipe_categories: categories || []
            };
          })
        );

        // Additional filtering by category and username
        const finalResults = enrichedRecipes.filter(recipe => {
          const categoryMatch = recipe.recipe_categories?.some((rc: any) =>
            rc.categories?.name?.toLowerCase().includes(safeQuery.toLowerCase())
          );
          const usernameMatch = recipe.profiles?.full_name?.toLowerCase().includes(safeQuery.toLowerCase());
          
          return categoryMatch || usernameMatch || true; // true because we already filtered by title/desc
        });

        setSearchResults(finalResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
    setIsSearching(false);
  }

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
                  href="/add-recipe"
                  className="inline-flex items-center justify-center rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 text-sm shadow transition-colors"
                >
                  Add Recipe
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setUser(null);
                    router.push("/");
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold px-4 py-2 text-sm shadow-sm transition-colors"
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
      <section className="flex flex-col items-center justify-center text-center gap-6 px-6 py-8 md:py-12 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-orange-600 tracking-tight drop-shadow-sm">Find your next favorite recipe</h1>
        <p className="text-lg sm:text-xl text-gray-700 max-w-xl">Browse hundreds of easy, delicious recipes from cooks around the world.</p>
        <form onSubmit={handleSearch} className="w-full max-w-md mx-auto flex gap-2 mt-4">
          <input 
            type="text" 
            placeholder="Search recipes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-l-md border border-orange-500 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-600 text-gray-900" 
          />
          <button 
            type="submit" 
            disabled={isSearching}
            className="rounded-r-md bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 transition-colors disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
          {(searchQuery || searchResults.length > 0) && (
            <button 
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="rounded-md border border-orange-300 text-orange-600 hover:bg-orange-50 font-semibold px-4 py-2 transition-colors"
            >
              Clear
            </button>
          )}
        </form>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-orange-600 mb-2">Search Results</h2>
              <p className="text-gray-600">Found {searchResults.length} recipe(s) for "{searchQuery}"</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {searchResults.map((recipe: any) => (
                <a
                  key={recipe.id}
                  href={"/recipe/" + recipe.id}
                  className="bg-white rounded-xl shadow p-4 flex flex-col border border-orange-100 hover:shadow-md transition group"
                >
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.title} width={200} height={150} className="w-full h-32 object-cover rounded mb-3" />
                  ) : (
                    <div className="w-full h-32 bg-orange-100 rounded mb-3 flex items-center justify-center text-orange-300">No Image</div>
                  )}
                  <div className="font-semibold text-sm text-gray-800 mb-1 group-hover:text-orange-600 transition-colors line-clamp-2">{recipe.title}</div>
                  <div className="text-xs text-gray-500 mb-2">
                    By {(recipe.profiles as any)?.full_name || "Unknown"}
                  </div>
                  {recipe.recipe_categories && recipe.recipe_categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {recipe.recipe_categories.slice(0, 2).map((rc: any, idx: number) => (
                        <span key={idx} className="bg-orange-100 text-orange-700 rounded-full px-2 py-1 text-xs">
                          {rc.categories?.name}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              ))}
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setSearchResults([]);
                  setSearchQuery("");
                }}
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Clear Search
              </button>
            </div>
          </section>
        )}
      </section>

      {/* Categories Section */}
      {searchResults.length === 0 && categories.length > 0 && (
        <section className="max-w-6xl mx-auto w-full px-6 py-4">
          <h2 className="text-2xl font-bold text-orange-600 mb-6 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/recipes/${encodeURIComponent(category.name.toLowerCase().replace(/\s+/g, '-'))}`}
                className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-orange-100 hover:shadow-md hover:border-orange-300 transition group"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                  <span className="text-orange-600 text-xl font-bold">
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="font-semibold text-sm text-gray-800 text-center group-hover:text-orange-600 transition-colors line-clamp-2">
                  {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular, Featured, Seasonal, Latest sections */}
      {searchResults.length === 0 && (
        <div className="max-w-6xl mx-auto w-full px-6 py-12 flex flex-col gap-10">
          <RecipeCarousel
            title="Popular Recipes"
            recipes={popularRecipes}
            showMore={popularRecipes.length === 4}
            moreLink="/recipes/popular"
            userId={user?.id}
          />
          <RecipeCarousel
            title="Featured Recipes"
            recipes={featuredRecipes}
            showMore={featuredRecipes.length === 4}
            moreLink="/recipes/featured"
            userId={user?.id}
          />
          <RecipeCarousel
            title="Latest Recipes"
            recipes={latestRecipes}
            showMore={latestRecipes.length === 4}
            moreLink="/recipes/latest"
            userId={user?.id}
          />
          <RecipeCarousel
            title="Seasonal Recipes"
            recipes={seasonalRecipes}
            showMore={seasonalRecipes.length === 4}
            moreLink="/recipes/seasonal"
            userId={user?.id}
          />
        </div>
      )}

      {/* Newsletter Signup */}
      <section className="max-w-xl mx-auto w-full px-6 py-8 bg-gradient-to-r from-orange-100 via-white to-amber-100 rounded-xl shadow border border-orange-200 mb-12 text-center">
        <h4 className="text-lg font-bold text-orange-600 mb-2">Get the best recipes in your inbox</h4>
        <p className="text-gray-600 mb-4">Sign up for our newsletter and never miss a tasty recipe!</p>
        <form
          className="flex flex-col sm:flex-row gap-2 justify-center"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubscribeStatus(null);
            setSubscribeMsg("");
            if (!subscribeEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(subscribeEmail)) {
              setSubscribeStatus("error");
              setSubscribeMsg("Please enter a valid email address.");
              return;
            }
            // Check for duplicate
            const { data: existing } = await supabase
              .from("subscribers")
              .select("id")
              .eq("email", subscribeEmail)
              .single();
            if (existing) {
              setSubscribeStatus("duplicate");
              setSubscribeMsg("You are already subscribed!");
              return;
            }
            // Insert new subscriber
            const { error } = await supabase
              .from("subscribers")
              .insert({ email: subscribeEmail });
            if (error) {
              setSubscribeStatus("error");
              setSubscribeMsg("Subscription failed. Please try again.");
            } else {
              setSubscribeStatus("success");
              setSubscribeMsg("Thank you for subscribing!");
              setSubscribeEmail("");
            }
          }}
        >
          <input
            type="email"
            placeholder="Your email address"
            className="flex-1 rounded-md border border-orange-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={subscribeEmail}
            onChange={e => setSubscribeEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 transition-colors"
          >
            Subscribe
          </button>
        </form>
        {subscribeStatus && (
          <div className={`mt-2 text-sm ${subscribeStatus === "success" ? "text-green-600" : "text-red-600"}`}>
            {subscribeMsg}
          </div>
        )}
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

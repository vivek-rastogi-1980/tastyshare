"use client";
import { useKeenSlider } from "keen-slider/react";
import Image from "next/image";
import Link from "next/link";
import "keen-slider/keen-slider.min.css";
import { RecipeVotes } from "./recipe-votes";

interface Recipe {
  id: string;
  title: string;
  image_url?: string;
  username?: string;
  user_id?: string;
}

interface RecipeCarouselProps {
  title: string;
  recipes: Recipe[];
  linkTo?: string; // e.g. "/recipe/"
  showMore?: boolean;
  moreLink?: string;
  userId?: string;
}

export function RecipeCarousel({ title, recipes, linkTo = "/recipe/", showMore = false, moreLink, userId }: RecipeCarouselProps) {
  const [sliderRef] = useKeenSlider<HTMLDivElement>({
    slides: { perView: 1.2, spacing: 16 },
    breakpoints: {
      "(min-width: 640px)": { slides: { perView: 2.2, spacing: 20 } },
      "(min-width: 1024px)": { slides: { perView: 3.2, spacing: 24 } },
      "(min-width: 1280px)": { slides: { perView: 4.2, spacing: 28 } },
    },
  });

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-orange-500 mb-4 px-2 sm:px-0">{title}</h2>
      {recipes.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No recipes yet.</div>
      ) : (
        <>
          <div ref={sliderRef} className="keen-slider">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`${linkTo}${recipe.id}`}
                className="keen-slider__slide bg-white rounded-xl shadow p-3 flex flex-col items-center border border-orange-100 hover:shadow-md transition group min-w-0"
              >
                {recipe.image_url ? (
                  <Image
                    src={recipe.image_url}
                    alt={recipe.title}
                    width={200}
                    height={140}
                    className="w-full h-32 sm:h-36 object-cover rounded mb-2"
                  />
                ) : (
                  <div className="w-full h-32 sm:h-36 bg-orange-100 rounded mb-2 flex items-center justify-center text-orange-300">No Image</div>
                )}
                <div className="font-semibold text-sm text-gray-800 mb-1 group-hover:text-orange-600 transition-colors text-center line-clamp-2">
                  {recipe.title}
                </div>
                {recipe.username && (
                  <div className="text-xs text-gray-500 text-center">
                    By{" "}
                    <Link
                      href={`/user/${recipe.user_id}`}
                      className="text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {recipe.username}
                    </Link>
                  </div>
                )}
                <div className="mt-2">
                  <RecipeVotes recipeId={recipe.id} userId={userId} />
                </div>
              </Link>
            ))}
          </div>
          {showMore && moreLink && (
            <div className="flex justify-end mt-2">
              <Link
                href={moreLink}
                className="text-orange-600 hover:text-orange-700 hover:underline text-sm font-semibold"
              >
                More (See All)
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
} 
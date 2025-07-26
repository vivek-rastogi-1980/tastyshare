# TastyShare 🍲

A modern, full-featured recipe sharing web application built with Next.js, Supabase, Tailwind CSS, and Shadcn UI. Share, discover, and manage recipes with a beautiful, responsive, and social food-blog experience.

---

## Features

- **Modern Homepage** inspired by food blogs (e.g., pinchofyum.com)
- **User Authentication** (Sign Up, Login, Logout) with Supabase Auth
- **Profile Management**: Upload profile picture, edit name/hobbies, Facebook-wall style profile
- **Recipe CRUD**: Add, edit, delete, and view recipes with images and dynamic fields
- **Categories & Tagging**: Flexible tagging system, browse by category
- **Recipe Carousels**: Popular, Featured, Latest, and Seasonal recipes
- **Search**: Find recipes by name, category, or username
- **Voting**: Like, Thumbs Up, Thumbs Down with real-time counts
- **Newsletter Signup**: Subscribe and get notified of new recipes
- **Social Sharing**: Share recipes on Facebook, X, WhatsApp, Pinterest, Instagram
- **Responsive Design**: Mobile-first, fast, and accessible

---

## Tech Stack

- **Framework**: [Next.js App Router](https://nextjs.org/docs/app)
- **Backend/DB/Auth**: [Supabase](https://supabase.com/)
- **UI**: [Shadcn UI](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Tailwind CSS](https://tailwindcss.com/)
- **Carousel**: [Keen Slider](https://keen-slider.io/)
- **State/Params**: [nuqs](https://github.com/47ng/nuqs)

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/tastyshare.git
cd tastyshare
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Locally

```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

---

## Database Schema (Supabase)

- **users** (managed by Supabase Auth)
- **profiles**: id (uuid, PK), full_name, hobbies, profile_pic
- **recipes**: id (uuid, PK), user_id (FK), title, description, image_url, created_at
- **ingredients**: id, recipe_id (FK), name, quantity
- **instructions**: id, recipe_id (FK), step_number, description
- **categories**: id, name
- **recipe_categories**: id, recipe_id (FK), category_id (FK)
- **subscribers**: id, email
- **recipe_votes**: id, recipe_id (FK), user_id (FK), vote_type ('like', 'thumbs_up', 'thumbs_down')

> See `/supabase/migrations` or Supabase dashboard for SQL details.

---

## Usage & Key Pages

- `/` — Homepage: Search, carousels, categories, newsletter
- `/profile` — Your profile: Edit info, see your recipes
- `/add-recipe` — Add a new recipe
- `/edit-recipe/[id]` — Edit your recipe
- `/my-recipes` — All your recipes (infinite scroll)
- `/recipe/[id]` — Recipe detail page
- `/user/[id]` — Public user profile
- `/recipes/[type]` — Recipes by category (e.g., `/recipes/italian-food`)

---

## Essential Scripts

- `npm run dev` — Start local dev server
- `npm run build` — Build for production
- `npm run start` — Start production server

---

## Contributing

Pull requests are welcome! Please open an issue first to discuss major changes.

---

## License

[MIT](LICENSE)

---

## Credits

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Keen Slider](https://keen-slider.io/)
- [Radix UI](https://www.radix-ui.com/)

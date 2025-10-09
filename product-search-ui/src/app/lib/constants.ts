export const NEST_API_BASE = process.env.NEST_API_BASE;
export const NEXTAUTH_URL = process.env.NEXTAUTH_URL;
export const INTERNAL_SHARED_SECRET = process.env.INTERNAL_SHARED_SECRET!;
export const NEXT_PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// if (!API_BASE) {
//   throw new Error(
//     "NEST_API_BASE is not set. Define it in .env.local (e.g. http://localhost:3001 or http://localhost:3001/api).",
//   );
// }

export const CATEGORIES = [
  "Furniture",
  "Office",
  "Lighting",
  "Decor",
  "Storage",
  "Bedroom",
  "Living Room",
  "Dining",
];

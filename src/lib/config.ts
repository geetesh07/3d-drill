/**
 * Product configuration & feature flags.
 *
 * Auth is fully built (UI, routing, context seam) but DISABLED by default.
 * Flip `authEnabled` to true once a backend (Supabase/Clerk/Auth.js) is wired
 * into AuthContext's signIn/signUp/signOut.
 */
export const config = {
  brand: {
    name: "NTS Tool Solutions",
    short: "NTS",
    product: "Drill Designer",
    tagline: "Parametric cutting-tool CAD, in the browser.",
  },
  authEnabled: false,
  contactEmail: "hello@ntstools.com",
} as const;

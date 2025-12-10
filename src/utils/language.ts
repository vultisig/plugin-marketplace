// const languages = ["en", "es", "pt", "it", "de", "hr"] as const;

export type Language = "en" | "es" | "pt" | "it" | "de" | "hr"; // (typeof languages)[number]

export const defaultLanguage: Language = "en";

// export const languageNames: Record<Language, string> = {
//   en: "English",
//   de: "Deutsch",
//   es: "Español",
//   it: "Italiano",
//   hr: "Hrvatski",
//   pt: "Portuguese",
// };

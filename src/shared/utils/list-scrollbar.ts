/** Pairs with `.tajdin-scrollbar-light` / `.tajdin-scrollbar-dark` in `globals.css`. */
export function listScrollbarClass(surface: "light" | "dark"): string {
  return surface === "light" ? "tajdin-scrollbar-light" : "tajdin-scrollbar-dark";
}

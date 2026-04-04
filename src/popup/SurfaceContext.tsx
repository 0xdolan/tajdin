import { createContext, useContext } from "react";

export type Surface = "dark" | "light";

const SurfaceContext = createContext<Surface>("dark");

export const SurfaceProvider = SurfaceContext.Provider;

export function useSurface(): Surface {
  return useContext(SurfaceContext);
}

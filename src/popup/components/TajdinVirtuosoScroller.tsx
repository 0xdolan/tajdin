import { forwardRef } from "react";
import type { ScrollerProps } from "react-virtuoso";
import { listScrollbarClass } from "../../shared/utils/list-scrollbar";
import { useSurface } from "../SurfaceContext";

/** Virtuoso scroll root with Tajdîn-themed scrollbars (light/dark from {@link useSurface}). */
export const TajdinVirtuosoScroller = forwardRef<HTMLDivElement, ScrollerProps>(
  function TajdinVirtuosoScroller({ style, children, tabIndex, ...rest }, ref) {
    const surface = useSurface();
    return (
      <div
        ref={ref}
        {...rest}
        data-virtuoso-scroller=""
        tabIndex={tabIndex}
        style={style}
        className={listScrollbarClass(surface)}
      >
        {children}
      </div>
    );
  },
);

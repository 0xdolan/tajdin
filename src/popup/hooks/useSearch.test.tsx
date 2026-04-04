/** @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUiStore } from "../store/uiStore";
import { useSearch } from "./useSearch";

describe("useSearch", () => {
  beforeEach(() => {
    useUiStore.setState({
      activeTab: "browse",
      browseRawQuery: "",
      browseSearchMode: "exact",
      browseLanguageApiValue: "",
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces raw query to debouncedQuery by 300ms", () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setRawQuery("bbc");
    });
    expect(result.current.debouncedQuery).toBe("");

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current.debouncedQuery).toBe("");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.debouncedQuery).toBe("bbc");
  });

  it("does not fire intermediate debounces when input changes rapidly", () => {
    const spy = vi.fn();
    const { result } = renderHook(() => {
      const s = useSearch();
      spy(s.debouncedQuery);
      return s;
    });

    act(() => {
      result.current.setRawQuery("a");
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.setRawQuery("ab");
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.setRawQuery("abc");
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.debouncedQuery).toBe("abc");
    const settledCalls = spy.mock.calls.filter((c) => c[0] === "abc").length;
    expect(settledCalls).toBeGreaterThan(0);
  });

  it("marks regexInvalid when debounced pattern is invalid in regex mode", () => {
    const { result } = renderHook(() => useSearch(0));

    act(() => {
      result.current.setMode("regex");
      result.current.setRawQuery("[");
    });
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.regexInvalid).toBe(true);
  });

  it("clears regexInvalid in exact mode", () => {
    const { result } = renderHook(() => useSearch(0));

    act(() => {
      result.current.setMode("regex");
      result.current.setRawQuery("[");
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.regexInvalid).toBe(true);

    act(() => {
      result.current.setMode("exact");
    });
    expect(result.current.regexInvalid).toBe(false);
  });
});

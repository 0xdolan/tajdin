/** Queue-with-plus: add station(s) to a playlist. */
export function AddToPlaylistIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h12M8 12h8M8 18h5M5 6v.01M5 12v.01M5 18v.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 15v6M15 18h6" />
    </svg>
  );
}

export function Icon({
  name,
  size = 20,
}: {
  name: "rook" | "undo" | "reset" | "hint" | "check" | "chevron" | "book";
  size?: number;
}) {
  const paths = {
    rook: (
      <>
        <path d="M5 3v5l2 2v8h10v-8l2-2V3h-4v3h-2V3h-2v3H9V3zM5 21h14M6 18h12" />
      </>
    ),
    undo: (
      <>
        <path d="M8 5 3 10l5 5M3 10h11a6 6 0 0 1 0 12" />
      </>
    ),
    reset: (
      <>
        <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" />
      </>
    ),
    hint: (
      <>
        <path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    book: (
      <>
        <path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1ZM12 5v15" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border px-4 py-3">
      <p className="text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Rankstack &mdash;{' '}
        <Link
          href="http://localhost:8000/docs"
          className="underline transition-colors hover:text-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          API Docs
        </Link>
      </p>
    </footer>
  );
}

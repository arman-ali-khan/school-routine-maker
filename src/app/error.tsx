"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-card p-8 rounded-lg shadow-xl max-w-md text-center">
        <h2 className="text-2xl font-semibold text-destructive mb-4">
          Oops! Something went wrong.
        </h2>
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Please try again.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-4 text-left bg-muted p-3 rounded text-xs">
            <summary className="cursor-pointer font-medium">Error Details</summary>
            <p className="mt-2 whitespace-pre-wrap">
              {error.message}
              {error.digest && ` (Digest: ${error.digest})`}
            </p>
            {error.stack && <pre className="mt-2 overflow-auto">{error.stack}</pre>}
          </details>
        )}
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          variant="default"
          size="lg"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

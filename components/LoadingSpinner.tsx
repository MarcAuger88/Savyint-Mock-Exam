"use client";

import React from "react";

type LoadingSpinnerProps = {
  message?: string;
};

export default function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="mt-2 flex items-center gap-3 text-sm text-neutral-300">
      <svg
        className="h-6 w-6 animate-spin text-emerald-500"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
        <path
          d="M22 12a10 10 0 00-10-10v4a6 6 0 016 6h4z"
          fill="currentColor"
          className="opacity-90"
        />
      </svg>

      <div className="flex items-center gap-3">
        <span>{message}</span>
        <span className="flex items-center gap-1">
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: "120ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: "240ms" }}
          />
        </span>
      </div>
    </div>
  );
}

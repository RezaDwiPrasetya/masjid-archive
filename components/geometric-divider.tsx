import * as React from "react";

export function GeometricDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-full h-3 overflow-hidden bg-primary text-primary-fixed select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-3"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="masjid-geometric-lattice"
            width="24"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            {/* Islamic octagonal lattice pattern */}
            <path
              d="M0 6 L6 0 H18 L24 6 L18 12 H6 Z M6 0 L18 12 M6 12 L18 0"
              stroke="currentColor"
              strokeWidth="0.85"
              strokeOpacity="0.45"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="12" fill="url(#masjid-geometric-lattice)" />
      </svg>
    </div>
  );
}

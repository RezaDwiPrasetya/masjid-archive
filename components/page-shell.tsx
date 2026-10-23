import { ReactNode } from "react";
import { GeometricDivider } from "@/components/geometric-divider";

export interface PageShellProps {
  children: ReactNode;
  heroBand?: ReactNode;
  className?: string;
}

export function PageShell({
  children,
  heroBand,
  className = "",
}: PageShellProps) {
  return (
    <div className="w-full min-w-0">
      {heroBand && (
        <section className="w-full bg-primary text-on-primary">
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 pt-6 sm:pt-8 md:pt-10 pb-6 sm:pb-8 md:pb-9">
            {heroBand}
          </div>
          <GeometricDivider />
        </section>
      )}
      <div className={`w-full px-4 sm:px-6 md:px-8 lg:px-10 py-5 sm:py-7 md:py-10 ${className}`}>
        {children}
      </div>
    </div>
  );
}

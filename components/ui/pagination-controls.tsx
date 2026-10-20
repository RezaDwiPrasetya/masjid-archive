"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  itemLabel?: string; // mis. "transaksi" atau "donatur"
}

export function PaginationControls({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className = "",
  itemLabel = "data",
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (safePage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    if (safePage >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-1 border-t border-outline-variant/60 text-xs text-on-surface-variant ${className}`}
    >
      {/* Kiri: Info Jumlah Data & Pilihan Baris per Halaman */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="tabular-nums font-medium">
          Menampilkan <span className="font-semibold text-on-surface">{startItem}</span>
          –<span className="font-semibold text-on-surface">{endItem}</span> dari{" "}
          <span className="font-semibold text-on-surface">{totalItems}</span> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-outline-variant/60">
            <span className="text-[11px] text-muted-foreground hidden md:inline">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                onPageChange(1); // Reset to page 1 on page size change
              }}
              aria-label="Pilih jumlah data per halaman"
              className="h-7 text-xs rounded-md border border-outline-variant bg-surface px-1.5 py-0.5 text-on-surface font-medium focus:outline-hidden focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / hal
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kanan: Navigasi Halaman */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 self-center sm:self-auto">
          {/* Tombol First Page */}
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onPageChange(1)}
            disabled={safePage === 1}
            title="Halaman Pertama"
            aria-label="Ke halaman pertama"
            className="size-7 rounded-md border-outline-variant hover:bg-surface-container-high disabled:opacity-30"
          >
            <ChevronsLeft className="size-3.5" />
          </Button>

          {/* Tombol Previous Page */}
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage === 1}
            title="Halaman Sebelumnya"
            aria-label="Ke halaman sebelumnya"
            className="size-7 rounded-md border-outline-variant hover:bg-surface-container-high disabled:opacity-30"
          >
            <ChevronLeft className="size-3.5" />
          </Button>

          {/* Nomor Halaman di Layar Desktop (sm ke atas) */}
          <div className="hidden sm:flex items-center gap-1">
            {pages.map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="size-7 flex items-center justify-center text-muted-foreground font-semibold"
                  >
                    …
                  </span>
                );
              }

              const isCurrent = p === safePage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`size-7 rounded-md text-xs font-semibold tabular-nums transition-all ${
                    isCurrent
                      ? "bg-primary text-on-primary shadow-2xs font-bold"
                      : "text-on-surface hover:bg-surface-container-high border border-transparent hover:border-outline-variant/60"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Label Halaman di Layar Mobile */}
          <div className="sm:hidden px-2 font-medium text-xs tabular-nums text-on-surface">
            Halaman {safePage} / {totalPages}
          </div>

          {/* Tombol Next Page */}
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage === totalPages}
            title="Halaman Selanjutnya"
            aria-label="Ke halaman selanjutnya"
            className="size-7 rounded-md border-outline-variant hover:bg-surface-container-high disabled:opacity-30"
          >
            <ChevronRight className="size-3.5" />
          </Button>

          {/* Tombol Last Page */}
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onPageChange(totalPages)}
            disabled={safePage === totalPages}
            title="Halaman Terakhir"
            aria-label="Ke halaman terakhir"
            className="size-7 rounded-md border-outline-variant hover:bg-surface-container-high disabled:opacity-30"
          >
            <ChevronsRight className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

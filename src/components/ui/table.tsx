import * as React from "react";
import { twMerge } from "tailwind-merge";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={twMerge("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={twMerge("[&_tr]:border-b border-zinc-800 bg-zinc-900/40", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={twMerge("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={twMerge("border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/30 data-[state=selected]:bg-muted", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={twMerge("h-12 px-4 text-left align-middle font-medium text-zinc-400 [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={twMerge("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />;
}

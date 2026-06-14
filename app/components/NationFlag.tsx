import { getNationFlag } from "../lib/flags";

export function NationFlag({
  nation,
  className = "",
  label = true,
}: {
  nation: string;
  className?: string;
  label?: boolean;
}) {
  const accessibleLabel = label ? `${nation} flag` : undefined;

  if (nation === "England") {
    return (
      <span
        className={`relative inline-block h-[1em] w-[1.35em] shrink-0 overflow-hidden rounded-[0.16em] border border-black/15 bg-white align-[-0.12em] shadow-sm ${className}`}
        role={label ? "img" : undefined}
        aria-label={accessibleLabel}
        aria-hidden={label ? undefined : true}
      >
        <span className="absolute inset-y-0 left-1/2 w-[18%] -translate-x-1/2 bg-[#cf142b]" />
        <span className="absolute inset-x-0 top-1/2 h-[24%] -translate-y-1/2 bg-[#cf142b]" />
      </span>
    );
  }

  if (nation === "Scotland") {
    return (
      <span
        className={`relative inline-block h-[1em] w-[1.35em] shrink-0 overflow-hidden rounded-[0.16em] border border-white/15 bg-[#0065bd] align-[-0.12em] shadow-sm ${className}`}
        role={label ? "img" : undefined}
        aria-label={accessibleLabel}
        aria-hidden={label ? undefined : true}
      >
        <span className="absolute left-1/2 top-1/2 h-[165%] w-[15%] -translate-x-1/2 -translate-y-1/2 rotate-[53deg] bg-white" />
        <span className="absolute left-1/2 top-1/2 h-[165%] w-[15%] -translate-x-1/2 -translate-y-1/2 -rotate-[53deg] bg-white" />
      </span>
    );
  }

  if (nation === "Wales") {
    return (
      <span
        className={`inline-grid h-[1em] min-w-[1.55em] shrink-0 place-items-center rounded-[0.16em] border border-white/15 bg-[linear-gradient(#fff_0_50%,#168b48_50%)] px-[0.16em] align-[-0.12em] text-[0.34em] font-black leading-none tracking-[-0.03em] text-[#c8102e] shadow-sm ${className}`}
        role={label ? "img" : undefined}
        aria-label={accessibleLabel}
        aria-hidden={label ? undefined : true}
      >
        WAL
      </span>
    );
  }

  return (
    <span
      className={`inline-block shrink-0 leading-none ${className}`}
      role={label ? "img" : undefined}
      aria-label={accessibleLabel}
      aria-hidden={label ? undefined : true}
    >
      {getNationFlag(nation)}
    </span>
  );
}

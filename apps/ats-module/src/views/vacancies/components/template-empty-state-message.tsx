const emptyStateImage = new URL(
  '../../../assets/images/templateSearchImg.svg',
  import.meta.url
).href;

const emptyStateGlow = new URL(
  '../../../assets/images/templateEmptyGlow.svg',
  import.meta.url
).href;

interface TemplateEmptyStateMessageProps {
  title: string;
  description: string;
}

/**
 * Shared centred empty-state figure (ambient glow + avatar) with a title and
 * description. Used by both the "no templates" and "no search results" states so
 * the visual stays in one place.
 */
export default function TemplateEmptyStateMessage({
  title,
  description,
}: TemplateEmptyStateMessageProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden text-center">
      {/* Soft ambient glow behind the content (decorative, from Figma). */}
      <img
        src={emptyStateGlow}
        aria-hidden
        alt=""
        className="pointer-events-none absolute top-1/2 left-1/2 w-248 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Circle gradient matches the rendered Figma Ellipse 764 (green diagonal). */}
        <div className="relative size-32.5 shrink-0 overflow-hidden rounded-full">
          <img src={emptyStateImage} alt="" className="" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-4xl/10 font-bold tracking-[-0.75px] text-slate-900">
            {title}
          </p>
          <p className="max-w-119.5 text-lg/6 font-semibold text-[#334155]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@cgp/ui-kit/components/ui/tooltip';

interface VacancyMultiValueCellProps {
  values: string[];
  countLabel: string;
}

function VacancyMultiValueCell({
  values,
  countLabel,
}: Readonly<VacancyMultiValueCellProps>) {
  if (values.length <= 1) {
    return <span className="text-sm text-slate-600">{values[0] ?? ''}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-sm font-medium text-blue-600 underline decoration-blue-600/40 underline-offset-2 hover:decoration-blue-600"
        >
          {countLabel}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="max-w-64">
        <ul className="list-disc space-y-0.5 pl-4">
          {values.map((value, index) => (
            <li key={`${value}-${index}`}>{value}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

export default VacancyMultiValueCell;

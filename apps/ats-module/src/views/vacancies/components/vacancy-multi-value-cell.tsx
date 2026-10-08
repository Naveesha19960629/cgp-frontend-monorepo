import { TABLE_TOOLTIP_CLASS_NAME } from '@/views/vacancies/utils/constants';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@cgp/ui-kit/components/ui/tooltip';
import { cn } from '@cgp/ui-kit/lib/utils';

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
          className="text-brand-primary-500 hover:text-brand-primary-700 cursor-default text-sm font-semibold underline underline-offset-2"
        >
          {countLabel}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className={cn('max-w-64 p-3', TABLE_TOOLTIP_CLASS_NAME)}
      >
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

import type { StepProps } from '@/views/vacancies/types';

import { Button } from '@cgp/ui-kit/components/ui/button';

export default function ProjectsRequirementsStep({
  onNext,
  onBack,
}: StepProps) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-slate-900">
        Projects Requirements
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Form fields for Projects Requirements will go here.
      </p>
      <div className="mt-8 flex justify-end gap-4">
        <Button variant="secondary" className="h-12 w-44" onClick={onBack}>
          Back
        </Button>
        <Button className="h-12 w-44" onClick={() => onNext()}>
          Next
        </Button>
      </div>
    </div>
  );
}

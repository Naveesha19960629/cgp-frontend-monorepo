import { Add } from 'iconsax-reactjs';

import { useState } from 'react';

import { Slider } from '@cgp/ui-kit/components/skill-slider';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { cn } from '@cgp/ui-kit/lib/utils';

interface SkillRating {
  id?: string;
  pendingId?: string;
  source?: string;
  label: string;
  rating: number;
}

interface SkillRatingCardProps {
  skill: SkillRating;
  onRatingChange: (idOrPendingId: string, rating: number) => void;
  onRemove: (idOrPendingId: string) => void;
  canRemove?: boolean;
  hideRemoveButton?: boolean;
}

const getLevelFromRating = (
  rating: number
):
  | 'Expert'
  | 'Competent'
  | 'Intermediate'
  | 'Beginner'
  | 'Not Skilled'
  | 'Unrated' => {
  if (rating < 0) return 'Unrated'; // -1 or negative = Unrated
  if (rating === 0) return 'Not Skilled'; // 0 = Not Skilled
  if (rating >= 9 && rating <= 10) return 'Expert';
  if (rating >= 7 && rating <= 8) return 'Competent';
  if (rating >= 4 && rating <= 6) return 'Intermediate';
  if (rating >= 1 && rating <= 3) return 'Beginner';
  return 'Unrated';
};

const getSliderColor = (
  level:
    | 'Expert'
    | 'Competent'
    | 'Intermediate'
    | 'Beginner'
    | 'Not Skilled'
    | 'Unrated'
): string => {
  switch (level) {
    case 'Expert':
      return '[&_.slider-track]:bg-[#047857]';
    case 'Competent':
      return '[&_.slider-track]:bg-[#34D399]';
    case 'Intermediate':
      return '[&_.slider-track]:bg-[#E4A440]';
    case 'Beginner':
      return '[&_.slider-track]:bg-[#FB923C]';
    case 'Not Skilled':
      return '';
    default:
      return '';
  }
};

export default function SkillRatingCard({
  skill,
  onRatingChange,
  onRemove,
  canRemove = true,
  hideRemoveButton = false,
}: Readonly<SkillRatingCardProps>) {
  const [currentRating, setCurrentRating] = useState(skill.rating);
  const level = getLevelFromRating(currentRating);
  const isUnrated = level === 'Unrated';

  const handleRatingChange = (value: number[]) => {
    const newRating = value[0];
    setCurrentRating(newRating);
    onRatingChange(skill.id || skill.pendingId || '', newRating);
  };

  return (
    <div
      className={cn(
        'relative h-[127px] w-[376px] overflow-hidden rounded-[8px] border border-[#cbd5e1]',
        isUnrated ? 'bg-[#f5f5f5]' : 'bg-white'
      )}
    >
      {/* Header with skill name and unrated indicator */}
      <div className="absolute top-3 left-3 flex max-w-[320px] content-stretch items-center gap-2">
        {/* Skill Name */}
        <div className="relative flex min-w-0 flex-1 flex-col justify-center text-[16px] leading-0 font-bold text-slate-900">
          <p className="truncate leading-6" title={skill.label}>
            {skill.label}
          </p>
        </div>

        {/* Unrated indicator */}
        {isUnrated && (
          <div className="relative flex shrink-0 content-stretch items-center gap-2">
            {/* Vertical line */}
            <div className="relative flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))] shrink-0 items-center justify-center">
              <div className="flex-none rotate-[90deg]">
                <div className="relative h-0 w-4">
                  <div className="absolute top-[-1px] right-0 bottom-0 left-0">
                    <div className="h-0 w-full border-b border-slate-600"></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Unrated text */}
            <div className="relative flex shrink-0 flex-col justify-center text-[14px] leading-0 font-semibold whitespace-nowrap text-slate-600">
              <p className="leading-5 whitespace-pre">Unrated</p>
            </div>
          </div>
        )}
      </div>

      {/* Close button */}
      {!hideRemoveButton && (
        <div className="absolute top-[12px] left-[344px] size-[20px]">
          <Button
            variant="ghost"
            size="icon"
            className="size-full hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onRemove(skill.id || skill.pendingId || '')}
            type="button"
            disabled={!canRemove}
          >
            <Add className="size-4 rotate-45 text-slate-600" />
          </Button>
        </div>
      )}

      {/* Rate Skill Label */}
      <div className="absolute top-[67px] left-[12px] flex translate-y-[-50%] flex-col justify-center text-[14px] leading-0 font-semibold whitespace-nowrap text-slate-600">
        <p className="leading-5 whitespace-pre">Rate Skill</p>
      </div>

      {/* Level indicator for rated skills and "Not Skilled" */}
      {!isUnrated && (
        <div className="absolute top-[67px] right-[12px] flex translate-y-[-50%] flex-col justify-center text-[14px] leading-0 font-semibold whitespace-nowrap text-[#075056]">
          <p className="leading-5 whitespace-pre">{level}</p>
        </div>
      )}

      {/* Slider Container */}
      <div className="absolute top-[81px] left-[12px] contents">
        <div className="absolute top-[81px] left-[12px] z-10 h-[19px] w-[352px]">
          <Slider
            value={[Math.max(0, currentRating)]}
            onValueChange={handleRatingChange}
            max={10}
            min={0}
            step={1}
            className={cn(
              'h-full w-full [&_[role=slider]]:translate-x-[1.5px]',
              getSliderColor(level)
            )}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute top-[94px] left-[24px] z-0 contents">
        {/* Marker lines */}
        <div className="absolute top-[94px] left-[27px] h-[6.25px] w-[330px]">
          <div className="absolute top-0 right-[-0.3%] bottom-0 left-0">
            {/* Major markers */}
            {[0, 2, 4, 6, 8, 10].map(num => (
              <div
                key={`major-${num}`}
                className="absolute h-full w-[1px] bg-slate-300"
                style={{ left: `${(num / 10) * 100}%` }}
              />
            ))}
            {/* Minor markers */}
            {[1, 3, 5, 7, 9].map(num => (
              <div
                key={`minor-${num}`}
                className="absolute h-[4px] w-[1px] bg-slate-300"
                style={{ left: `${(num / 10) * 100}%`, top: '1.125px' }}
              />
            ))}
          </div>
        </div>

        {/* Numbers - positioned exactly like Figma */}
        <div className="absolute top-[105.98px] left-[24px] flex h-[9.375px] w-[7.817px] translate-y-[-50%] flex-col justify-center text-[10px] leading-0 font-medium text-slate-500 uppercase">
          <p className="leading-6">0</p>
        </div>
        <div className="absolute top-[106.5px] left-[90.42px] flex h-[8.333px] w-[5.863px] translate-y-[-50%] flex-col justify-center text-[10px] leading-0 font-medium text-slate-500 uppercase">
          <p className="leading-6">2</p>
        </div>
        <div className="absolute top-[106.5px] left-[155.89px] flex h-[8.333px] w-[5.863px] translate-y-[-50%] flex-col justify-center text-[10px] leading-0 font-medium text-slate-500 uppercase">
          <p className="leading-6">4</p>
        </div>
        <div className="absolute top-[106.5px] left-[222.34px] flex h-[8.333px] w-[5.863px] translate-y-[-50%] flex-col justify-center text-[10px] leading-0 font-medium text-slate-500 uppercase">
          <p className="leading-6">6</p>
        </div>
        <div className="absolute top-[106.5px] left-[288px] flex h-[8.333px] w-[5.863px] translate-y-[-50%] flex-col justify-center text-[10px] leading-0 font-medium text-slate-500 uppercase">
          <p className="leading-6">8</p>
        </div>
        <div className="absolute top-[106.5px] left-[352px] flex h-[25px] w-[11.726px] translate-y-[-50%] flex-col justify-center text-[10px] leading-0 font-medium text-slate-500 uppercase">
          <p className="leading-6">10</p>
        </div>
      </div>
    </div>
  );
}

export type { SkillRating };

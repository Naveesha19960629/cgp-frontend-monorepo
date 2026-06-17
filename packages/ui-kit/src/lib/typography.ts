import { type VariantProps, cva } from 'class-variance-authority';

const typographyVariants = cva('font-sans', {
  variants: {
    variant: {
      h1: 'font-extrabold text-[48px] leading-[48px] tracking-[-0.576px]',
      h2: 'font-bold text-[32px] leading-[40px] tracking-[-0.24px]',
      h3: 'font-bold text-[24px] leading-[24px] tracking-[-0.144px]',
      h4: 'font-bold text-[20px] leading-[24px] tracking-[-0.1px]',
      h5: 'font-bold text-[16px] leading-[24px] tracking-normal',
      large: 'font-semibold text-[18px] leading-[24px] tracking-normal',
      lead: 'font-normal text-[20px] leading-[24px] tracking-normal',
      p: 'font-medium text-[16px] leading-[24px] tracking-normal',
      'p-ui': 'font-normal text-[16px] leading-[24px] tracking-normal',
      'p-ui-medium': 'font-medium text-[16px] leading-[24px] tracking-normal',
      list: 'font-normal text-base/6 tracking-normal',
      body: 'font-normal text-[14px] leading-[16px] tracking-normal',
      'body-medium': 'font-medium text-[14px] leading-[24px] tracking-normal',
      'body-semibold':
        'font-semibold text-[14px] leading-[20px] tracking-normal',
      'body-bold': 'font-bold text-[14px] leading-[16px] tracking-normal',
      subtle: 'font-normal text-sm/5 tracking-normal',
      small: 'font-medium text-sm leading-none tracking-normal',
      detail: 'font-medium text-[12px] leading-[24px] tracking-normal',
      blockquote:
        'font-normal text-[16px] leading-[24px] italic tracking-normal',
      italic: 'font-normal text-[16px] leading-[24px] italic tracking-normal',
      'table-head': 'font-bold text-base/6 tracking-normal',
      'table-item': 'font-normal text-base/6 tracking-normal',
      link: 'font-bold text-[16px] leading-[24px] tracking-normal',
    },
  },
});

type Variant = VariantProps<typeof typographyVariants>['variant'];

const applyTypography = (variant: Variant) => typographyVariants({ variant });

export { applyTypography };

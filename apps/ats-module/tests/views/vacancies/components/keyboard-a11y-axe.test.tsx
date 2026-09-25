import { useState } from 'react';
import { initReactI18next } from 'react-i18next';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { beforeAll, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import atsEn from '@/app/utils/i18n/locales/en/ats.json';
import DataTableFacetedFilter from '@/views/vacancies/components/data-table-faceted-filter';

import { Combobox } from '@cgp/ui-kit/components/combobox';
import ExpandableText from '@cgp/ui-kit/components/expandable-text';
import { FieldTooltip } from '@cgp/ui-kit/components/field-tooltip';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import {
  SELECT_CLEAR_VALUE,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cgp/ui-kit/components/ui/select';
import i18n from 'i18next';

// DQCGP-4310 — automated axe pass over the controls changed for the keyboard
// NFR. axe catches missing names, invalid ARIA and broken id references; it
// can't judge focus order or visibility, and jsdom can't compute contrast.

const options = [
  { value: 'de', label: 'Germany' },
  { value: 'lk', label: 'Sri Lanka' },
];

async function axeViolations(container: Element) {
  // `region` is a page-level rule (content inside landmarks); these render a
  // single component into a bare test document.
  const results = await axe(container, {
    rules: { region: { enabled: false } },
  });
  return results.violations;
}

describe('keyboard NFR controls — axe', () => {
  beforeAll(async () => {
    if (!i18n.isInitialized) {
      await i18n.use(initReactI18next).init({
        lng: 'en',
        resources: { en: { translation: atsEn } },
        interpolation: { escapeValue: false },
      });
    } else {
      i18n.addResourceBundle('en', 'translation', atsEn, true, true);
    }
  });

  it('Combobox (closed, labelled by its field)', async () => {
    const { container } = render(
      <>
        <label htmlFor="country">Country</label>
        <Combobox id="country" options={options} value="de" />
      </>
    );
    expect(await axeViolations(container)).toEqual([]);
  });

  it('Combobox (open) — popup is not an unnamed dialog', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <>
        <label htmlFor="country">Country</label>
        <Combobox id="country" options={options} value="" />
      </>
    );
    screen.getByRole('combobox', { name: 'Country' }).focus();
    await user.keyboard('{ArrowDown}');

    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('MultipleSelector with chips', async () => {
    const { container } = render(
      <MultipleSelector
        aria-label="Hobbies"
        options={options}
        value={[options[0]]}
      />
    );
    expect(await axeViolations(container)).toEqual([]);
  });

  it('clearable Select, open', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState('de');
      return (
        <Select
          clearable
          value={value}
          onValueChange={v => setValue(v === SELECT_CLEAR_VALUE ? '' : v)}
        >
          <SelectTrigger aria-label="Country">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="de">Germany</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    render(<Harness />);
    screen.getByRole('combobox', { name: 'Country' }).focus();
    await user.keyboard('{Enter}');

    expect(await axeViolations(document.body)).toEqual([]);
  });

  it.each([
    ['with search', false],
    ['without search (Status)', true],
  ])('vacancy list filter, open %s', async (_, hideSearch) => {
    const user = userEvent.setup();
    render(
      <DataTableFacetedFilter
        title="Status"
        options={[
          { value: 'draft', label: 'Draft' },
          { value: 'live', label: 'Live' },
        ]}
        selectedValues={['live']}
        onSelectionChange={() => {}}
        hideSearch={hideSearch}
      />
    );
    screen.getByRole('button', { name: 'Status' }).focus();
    await user.keyboard('{Enter}');

    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('FieldTooltip help icon', async () => {
    const { container } = render(<FieldTooltip title="Help text" />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('ExpandableText toggle', async () => {
    const { container } = render(<ExpandableText text="Some about text" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

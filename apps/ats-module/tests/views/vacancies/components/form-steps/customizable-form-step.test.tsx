import React, { forwardRef } from 'react';
import type { ReactNode } from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, expect, it, vi } from 'vitest';

import CustomizableFormStep from '@/views/vacancies/components/form-steps/customizable-form-step';

// ── Global setup ─────────────────────────────────────────────────────────────

vi.stubGlobal('scrollTo', vi.fn());

// ── Hoisted mock refs ────────────────────────────────────────────────────────

const mockErrorToast = vi.hoisted(() => vi.fn());
const mockUseVacancyForm = vi.hoisted(() => vi.fn());

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'common.back': 'Back',
        'common.next': 'Next',
        'customizableForm.title': 'Customizable Form',
        'customizableForm.untitledForm': 'Untitled Form',
        'customizableForm.sectionTitlePlaceholder': 'Section Title',
        'customizableForm.formBuilderTitle': 'Form Builder',
        'customizableForm.formTitlePlaceholder': 'Form Title',
        'customizableForm.question.questionPlaceholder': 'Question',
        'customizableForm.createQuestion': 'Create Question',
        'customizableForm.addForm': 'Add Form',
        'customizableForm.errors.maxFormsExceeded': 'Max forms exceeded',
        'customizableForm.errors.maxQuestionsExceeded':
          'Max questions exceeded',
        'customizableForm.errors.maxLengthExceeded': 'Max length exceeded',
        'customizableForm.copyOfTitle': 'Copy of {{title}}',
        'customizableForm.errors.requiredQuestion': 'Required question',
        'customizableForm.errors.requiredType': 'Required type',
        'customizableForm.question.types.shortAnswer': 'Short Answer',
        'customizableForm.question.types.paragraph': 'Paragraph',
        'customizableForm.question.types.multipleChoice': 'Multiple Choice',
        'customizableForm.question.types.checkboxes': 'Checkboxes',
        'customizableForm.question.types.dropDown': 'Dropdown',
        'customizableForm.question.types.linearScale': 'Linear Scale',
        'customizableForm.question.enterOption': 'Enter option',
      };
      let baseText = map[key] || key;
      if (options) {
        if (typeof options.title === 'string') {
          baseText = baseText.replace('{{title}}', options.title);
        }
        if (typeof options.max === 'number') {
          baseText = `${baseText} (max: ${String(options.max)})`;
        }
      }
      return baseText;
    },
  }),
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  ErrorToast: mockErrorToast,
}));

vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  useVacancyForm: mockUseVacancyForm,
}));

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: () => <div data-testid="character-count" />,
}));

vi.mock('@cgp/ui-kit/lib/utils', () => ({
  removeEmoji: (text: string) => text,
  cn: (...classes: unknown[]) =>
    classes.filter(c => typeof c === 'string').join(' '),
}));

vi.mock('../disable-dialog', () => ({
  default: ({
    open,
    onConfirm,
    onCancel,
  }: {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="disable-dialog">
      {open && (
        <>
          <button onClick={onConfirm} data-testid="confirm-disable">
            Confirm Disable
          </button>
          <button onClick={onCancel} data-testid="cancel-disable">
            Cancel Disable
          </button>
        </>
      )}
    </div>
  ),
}));

vi.mock('@cgp/ui-kit/components/radix-ui/switch', () => ({
  Switch: ({
    checked,
    onCheckedChange,
    ...props
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    [k: string]: unknown;
  }) => (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      Toggle
    </button>
  ),
}));

vi.mock('@cgp/ui-kit/components/button', () => ({
  Button: forwardRef(
    (
      {
        children,
        onClick,
        'aria-label': ariaLabel,
        className,
        _variant,
        type,
        ...otherProps
      }: {
        children?: ReactNode;
        onClick?: () => void;
        'aria-label'?: string;
        className?: string;
        _variant?: string;
        type?: string;
        [k: string]: unknown;
      },
      _ref: unknown
    ) => (
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        className={className}
        type={type as 'button' | 'submit' | 'reset'}
        {...otherProps}
      >
        {children}
      </button>
    )
  ),
}));

vi.mock('iconsax-reactjs', () => ({
  ArrowLeft2: () => <span>Arrow</span>,
  ArrowDown2: ({ className }: { className?: string }) => (
    <span className={className}>Arrow</span>
  ),
  Simcard2: () => <span>Duplicate</span>,
  Trash: () => <span>Delete</span>,
  Plus: () => <span>Plus</span>,
}));

vi.mock('radix-ui/react-select', () => {
  const SelectContext = React.createContext<{
    value?: string;
    onValueChange?: (val: string) => void;
  }>({});
  return {
    Select: ({
      children,
      value,
      onValueChange,
    }: {
      children: ReactNode;
      value?: string;
      onValueChange?: (val: string) => void;
    }) => (
      <SelectContext.Provider value={{ value, onValueChange }}>
        <div data-value={value}>{children}</div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({
      children,
      className,
    }: {
      children?: ReactNode;
      className?: string;
    }) => <button className={className}>{children}</button>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => {
      const { value } = React.useContext(SelectContext);
      return <span>{value || placeholder}</span>;
    },
    SelectContent: ({ children }: { children?: ReactNode }) => (
      <div role="listbox">{children}</div>
    ),
    SelectItem: ({
      children,
      value,
    }: {
      children?: ReactNode;
      value?: string;
    }) => {
      const { onValueChange } = React.useContext(SelectContext);
      return (
        <button
          type="button"
          role="option"
          onClick={() => {
            onValueChange?.(value || '');
          }}
          data-value={value}
        >
          {children}
        </button>
      );
    },
  };
});

// ── Helper function ─────────────────────────────────────────────────────────

const renderComponent = (
  props = {
    onNext: vi.fn(),
    onBack: vi.fn(),
    onSubmit: vi.fn(),
  }
) => {
  mockUseVacancyForm.mockReturnValue({
    form: { customizableForm: undefined },
    onCancel: vi.fn(),
    setForm: vi.fn(),
    setStepGuard: vi.fn(),
    stepPersistRef: { current: null },
    stepDisableRef: { current: null },
    currentStepIndex: 0,
    removeCompletedStep: vi.fn(),
  });

  return render(<CustomizableFormStep {...props} />);
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CustomizableFormStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the component with back button and title', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
      expect(screen.getByText('Customizable Form')).toBeInTheDocument();
    });

    it('should render with toggle switch', () => {
      renderComponent();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should render section title input', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('Section Title')).toBeInTheDocument();
    });

    it('should render with disabled state initially', () => {
      renderComponent();
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'false'
      );
    });

    it('should render form builder heading', () => {
      renderComponent();
      expect(screen.getByText('Form Builder')).toBeInTheDocument();
    });
  });

  describe('Toggle Enable/Disable', () => {
    it('should enable customizable form when toggle is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should have initial form when enabled', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(screen.getByPlaceholderText('Form Title')).toBeInTheDocument();
    });
  });

  describe('Section Title Management', () => {
    it('should update section title on input change', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const sectionInput: HTMLInputElement =
        screen.getByPlaceholderText('Section Title');

      await user.type(sectionInput, 'My Custom Section');
      expect(sectionInput.value).toBe('My Custom Section');
    });

    it('should show error when section title exceeds 200 characters', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const sectionInput = screen.getByPlaceholderText('Section Title');

      const longText = 'a'.repeat(201);
      // Set the value in one shot — typing 201 chars one keystroke at a time
      // via userEvent overruns the test timeout.
      fireEvent.change(sectionInput, { target: { value: longText } });

      await waitFor(() => {
        expect(screen.getByText(/Max length exceeded/)).toBeInTheDocument();
      });
    });

    it('should not show error when section title is within limit', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const sectionInput = screen.getByPlaceholderText('Section Title');

      const validText = 'a'.repeat(150);
      fireEvent.change(sectionInput, { target: { value: validText } });

      expect(
        screen.queryByText(/Max length exceeded.*max: 200/)
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Management', () => {
    it('should show "Untitled Form" in the title area for a new form', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(screen.getByText('Untitled Form')).toBeInTheDocument();
    });

    it('should update the bold title area as form title changes and keep it when collapsed', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const formInput: HTMLInputElement =
        screen.getByPlaceholderText('Form Title');
      await user.type(formInput, 'Customer Screening');

      expect(screen.getByText('Customer Screening')).toBeInTheDocument();

      const collapseButton = screen.getByRole('button', {
        name: 'Collapse form',
      });
      await user.click(collapseButton);

      expect(screen.getByText('Customer Screening')).toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText('Form Title')
      ).not.toBeInTheDocument();
    });

    it('should start with one empty form when enabled', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const formInputs = screen.getAllByPlaceholderText('Form Title');
      expect(formInputs.length).toBeGreaterThanOrEqual(1);
    });

    it('should add a new form when Add button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const addButton = screen.getByRole('button', { name: 'Add Form' });
      await user.click(addButton);

      const formInputs = screen.getAllByPlaceholderText('Form Title');
      expect(formInputs.length).toBe(2);
    });

    it('should remove a form when delete button is clicked, but disable deletion when only 1 form exists', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      // Initially, only 1 form exists, so delete button should be disabled
      const deleteButtonsInitial = screen.getAllByRole('button', {
        name: 'Delete form',
      });
      expect(deleteButtonsInitial[0]).toBeDisabled();

      // Add a form
      const addButton = screen.getByRole('button', { name: 'Add Form' });
      await user.click(addButton);

      // Now 2 forms exist, delete buttons should be enabled
      const deleteButtonsAfterAdd = screen.getAllByRole('button', {
        name: 'Delete form',
      });
      expect(deleteButtonsAfterAdd[0]).toBeEnabled();
      expect(deleteButtonsAfterAdd[1]).toBeEnabled();

      // Delete the second form
      await user.click(deleteButtonsAfterAdd[1]);

      // Confirm deletion in the dialog
      const confirmButton = screen.getByRole('button', {
        name: 'customizableForm.deleteFormModal.delete',
      });
      await user.click(confirmButton);

      // Verify only 1 form remains and its delete button is disabled again
      const formInputs = screen.queryAllByPlaceholderText('Form Title');
      expect(formInputs.length).toBe(1);

      const deleteButtonsFinal = screen.getAllByRole('button', {
        name: 'Delete form',
      });
      expect(deleteButtonsFinal[0]).toBeDisabled();
    });

    it('should duplicate a form when duplicate button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const duplicateButton = screen.getByRole('button', {
        name: 'Duplicate form',
      });
      await user.click(duplicateButton);

      const formInputs = screen.getAllByPlaceholderText('Form Title');
      expect(formInputs.length).toBe(2);
    });

    it('should sequentially name duplicate forms correctly and rename the first one when adding more duplicates', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const formInput = screen.getByPlaceholderText('Form Title');
      await user.type(formInput, 'sdfsdfsdf');

      const duplicateButton = screen.getByRole('button', {
        name: 'Duplicate form',
      });

      // 1. First duplicate
      await user.click(duplicateButton);
      expect(screen.getByText('sdfsdfsdf')).toBeInTheDocument();
      expect(screen.getByText('Copy of sdfsdfsdf')).toBeInTheDocument();

      // 2. Second duplicate (this should rename the first to 'Copy of sdfsdfsdf (1)')
      await user.click(duplicateButton);
      expect(screen.getByText('sdfsdfsdf')).toBeInTheDocument();
      expect(screen.getByText('Copy of sdfsdfsdf (1)')).toBeInTheDocument();
      expect(screen.getByText('Copy of sdfsdfsdf (2)')).toBeInTheDocument();

      // 3. Third duplicate
      await user.click(duplicateButton);
      expect(screen.getByText('sdfsdfsdf')).toBeInTheDocument();
      expect(screen.getByText('Copy of sdfsdfsdf (1)')).toBeInTheDocument();
      expect(screen.getByText('Copy of sdfsdfsdf (2)')).toBeInTheDocument();
      expect(screen.getByText('Copy of sdfsdfsdf (3)')).toBeInTheDocument();

      // 4. Remove one duplicate (so 2 remain)
      let deleteButtons = screen.getAllByRole('button', {
        name: 'Delete form',
      });
      await user.click(deleteButtons[1]); // delete one of the form cards
      let confirmButton = screen.getByRole('button', {
        name: 'customizableForm.deleteFormModal.delete',
      });
      await user.click(confirmButton);

      // We should still have two duplicates with suffixes
      expect(screen.getByText('Copy of sdfsdfsdf (1)')).toBeInTheDocument();
      expect(screen.getByText('Copy of sdfsdfsdf (2)')).toBeInTheDocument();

      // 5. Remove another duplicate (so only 1 remains)
      deleteButtons = screen.getAllByRole('button', { name: 'Delete form' });
      await user.click(deleteButtons[1]); // delete 'Copy of sdfsdfsdf (2)'
      confirmButton = screen.getByRole('button', {
        name: 'customizableForm.deleteFormModal.delete',
      });
      await user.click(confirmButton);

      // The sole remaining duplicate should rename back to 'Copy of sdfsdfsdf'
      expect(screen.getByText('Copy of sdfsdfsdf')).toBeInTheDocument();
      expect(
        screen.queryByText('Copy of sdfsdfsdf (1)')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Copy of sdfsdfsdf (2)')
      ).not.toBeInTheDocument();
    });

    it('should toggle form open/closed when collapse button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const collapseButton = screen.getByRole('button', {
        name: 'Collapse form',
      });
      await user.click(collapseButton);

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText('Form Title')
        ).not.toBeInTheDocument();
      });
    });

    it('should show error when adding more than 5 forms', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      for (let i = 0; i < 4; i++) {
        const addButton = screen.getByRole('button', { name: 'Add Form' });
        await user.click(addButton);
      }

      const addButton = screen.getByRole('button', { name: 'Add Form' });
      await user.click(addButton);

      expect(mockErrorToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Max forms exceeded',
        })
      );
    });

    it('should update form title on input change', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const formInput: HTMLInputElement =
        screen.getByPlaceholderText('Form Title');
      await user.type(formInput, 'My Form Title');
      expect(formInput.value).toBe('My Form Title');
    });

    it('should show error when form title exceeds 150 characters', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const formInput = screen.getByPlaceholderText('Form Title');
      const longText = 'a'.repeat(151);
      fireEvent.change(formInput, { target: { value: longText } });

      await waitFor(() => {
        expect(
          screen.getByText(/Max length exceeded.*max: 150/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnBack = vi.fn();
      renderComponent({
        onNext: vi.fn(),
        onBack: mockOnBack,
        onSubmit: vi.fn(),
      });

      const backButton = screen.getByRole('button', { name: 'Back' });
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('should call onNext when next button is clicked with form disabled', async () => {
      const user = userEvent.setup();
      const mockOnNext = vi.fn();
      renderComponent({
        onNext: mockOnNext,
        onBack: vi.fn(),
        onSubmit: vi.fn(),
      });

      const nextButton = screen.getByRole('button', { name: 'Next' });
      await user.click(nextButton);

      expect(mockOnNext).toHaveBeenCalledWith(
        expect.objectContaining({
          customizableForm: expect.objectContaining({
            isEnabled: false,
          }),
        })
      );
    });
  });

  describe('Initial State', () => {
    it('should render with customizable form disabled by default', () => {
      renderComponent();
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('should have empty section title by default', () => {
      renderComponent();
      const sectionInput: HTMLInputElement =
        screen.getByPlaceholderText('Section Title');
      expect(sectionInput.value).toBe('');
    });
  });

  describe('Validation and Error Messages', () => {
    it('should validate form and question state and enable/disable next button correctly', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const nextButton = screen.getByRole('button', { name: 'Next' });

      // Initially, form has 0 questions, so nextButton is disabled
      expect(nextButton).toBeDisabled();

      // Create a question
      const createQuestionButton = screen.getByRole('button', {
        name: 'Create Question',
      });
      await user.click(createQuestionButton);

      // Question created. Deleting it should be disabled because it's the only question
      const deleteQuestionButtons = screen.getAllByRole('button', {
        name: 'Delete question',
      });
      expect(deleteQuestionButtons[0]).toBeDisabled();

      // Next button should be disabled because question text and type are empty
      expect(nextButton).toBeDisabled();

      // Type in the question text
      const questionInput = screen.getByPlaceholderText('Question');
      await user.type(questionInput, 'What is your experience?');
      expect(nextButton).toBeDisabled();

      // Select type "Short Answer"
      const typeTrigger = screen.getByRole('combobox');
      await user.click(typeTrigger);
      const shortAnswerOption = screen.getByText('Short Answer');
      await user.click(shortAnswerOption);

      // Now it has valid text and type (non-option based), so Next button should be enabled
      expect(nextButton).toBeEnabled();

      // Change type to "Multiple Choice" (option-based)
      await user.click(typeTrigger);
      const mcOption = screen.getByText('Multiple Choice');
      await user.click(mcOption);

      // Should be disabled because the default option value is empty
      expect(nextButton).toBeDisabled();

      // Type text in the first option
      const optionInput = screen.getByPlaceholderText('Enter option');
      await user.type(optionInput, 'Option A');

      // Now at least one option is filled, Next button should be enabled
      expect(nextButton).toBeEnabled();

      // If we duplicate the question, we have 2 questions, so delete button should be enabled
      const duplicateQuestionButtons = screen.getAllByRole('button', {
        name: 'Duplicate question',
      });
      await user.click(duplicateQuestionButtons[0]);

      const updatedDeleteButtons = screen.getAllByRole('button', {
        name: 'Delete question',
      });
      expect(updatedDeleteButtons[0]).toBeEnabled();
      expect(updatedDeleteButtons[1]).toBeEnabled();
    });

    it('should disable next button when section title is too long', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const sectionInput = screen.getByPlaceholderText('Section Title');
      const longText = 'a'.repeat(201);
      fireEvent.change(sectionInput, { target: { value: longText } });

      const nextButton = screen.getByRole('button', { name: 'Next' });
      expect(nextButton).toBeDisabled();
    });
  });
});

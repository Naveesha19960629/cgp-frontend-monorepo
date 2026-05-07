import { ChevronDown } from 'lucide-react';

import * as React from 'react';
import * as RPNInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@cgp/ui-kit/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { ScrollArea } from '@cgp/ui-kit/components/ui/scroll-area';
import { cn } from '@cgp/ui-kit/lib/utils';

type SignupPhoneInputProps = Omit<
  React.ComponentProps<'input'>,
  'onChange' | 'value' | 'ref'
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, 'onChange'> & {
    onChange?: (value: RPNInput.Value) => void;
  };

const SignupPhoneInput: React.ForwardRefExoticComponent<SignupPhoneInputProps> =
  React.forwardRef<
    React.ElementRef<typeof RPNInput.default>,
    SignupPhoneInputProps
  >(({ className, onChange, value, ...props }, ref) => {
    return (
      <RPNInput.default
        ref={ref}
        className={cn('flex w-full items-center gap-3', className)}
        flagComponent={FlagComponent}
        countrySelectComponent={CountrySelect}
        inputComponent={InputComponent}
        smartCaret={false}
        value={value ?? undefined}
        onChange={val => onChange?.(val ?? ('' as RPNInput.Value))}
        {...props}
      />
    );
  });

SignupPhoneInput.displayName = 'SignupPhoneInput';

const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={cn(
      'w-full border-none bg-transparent text-3xl/10 font-semibold text-slate-500 outline-none placeholder:text-3xl/10 placeholder:font-semibold placeholder:text-slate-300 md:text-5xl/15 md:placeholder:text-5xl/15',
      className
    )}
    style={{ caretColor: '#0F172A' }}
  />
));
InputComponent.displayName = 'InputComponent';

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
};

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountrySelectProps) => {
  const [searchValue, setSearchValue] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover
      open={isOpen}
      onOpenChange={open => {
        setIsOpen(open);
        if (open) setSearchValue('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex items-center gap-1.5 bg-transparent p-0 md:gap-2"
        >
          <FlagComponent
            country={selectedCountry}
            countryName={selectedCountry}
          />
          <ChevronDown className="h-6 w-6 text-slate-900 md:h-8 md:w-8" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput
            value={searchValue}
            onValueChange={setSearchValue}
            placeholder="Search country..."
          />
          <CommandList>
            <ScrollArea className="h-64">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CountrySelectOption
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={selectedCountry}
                      onChange={onChange}
                      onSelectComplete={() => setIsOpen(false)}
                    />
                  ) : null
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country;
  onChange: (country: RPNInput.Country) => void;
  onSelectComplete: () => void;
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
  onSelectComplete,
}: CountrySelectOptionProps) => {
  const handleSelect = () => {
    onChange(country);
    onSelectComplete();
  };

  return (
    <CommandItem className="gap-3 py-3" onSelect={handleSelect}>
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-base font-medium">{countryName}</span>
      <span className="text-base text-slate-500">{`+${RPNInput.getCountryCallingCode(
        country
      )}`}</span>

      {country === selectedCountry && (
        <div className="ml-auto h-2 w-2 rounded-full bg-blue-600" />
      )}
    </CommandItem>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-[28px] w-[42px] items-center justify-center overflow-hidden rounded-md md:h-[34px] md:w-[50px] [&_svg]:h-[28px] [&_svg]:w-auto md:[&_svg]:h-[34px]">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { SignupPhoneInput };

"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  hint?: string;
};

type CreatableComboboxProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  /** Optional first row such as "No supplier". */
  noneOption?: ComboboxOption;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  /** e.g. "Create new supplier" */
  createLabel: string;
  /** Called with whatever the user typed in the search box. */
  onCreate: (searchText: string) => void;
  id?: string;
};

export function CreatableCombobox({
  value,
  onValueChange,
  options,
  noneOption,
  placeholder,
  searchPlaceholder,
  emptyText,
  createLabel,
  onCreate,
  id,
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected =
    options.find((option) => option.value === value) ??
    (noneOption && noneOption.value === value ? noneOption : undefined);

  const trimmed = search.trim();

  function select(next: string) {
    onValueChange(next);
    setOpen(false);
    setSearch("");
  }

  const allOptions = noneOption ? [noneOption, ...options] : options;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between font-normal",
          !selected && "text-muted-foreground",
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[min(22rem,90vw)] p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>

            <CommandGroup>
              {allOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label}::${option.value}`}
                  keywords={option.hint ? [option.hint] : undefined}
                  onSelect={() => select(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      option.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{option.label}</p>
                    {option.hint && (
                      <p className="truncate text-xs text-muted-foreground">
                        {option.hint}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        <div className="border-t p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              setOpen(false);
              setSearch("");
              onCreate(trimmed);
            }}
          >
            <Plus className="mr-2 size-4" />
            <span className="truncate">
              {trimmed ? `${createLabel}: “${trimmed}”` : createLabel}
            </span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
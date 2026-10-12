"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

export type ProductCategory = {
  id: number;
  name: string;
};

/**
 * Pick an existing category or type a new one. Shared by the Add and Edit
 * product dialogs. The value is the category *name*; the server action
 * matches it to an existing category (ignoring case) or creates it.
 */
export function CategoryCombobox({
  id,
  categories,
  value,
  onChange,
  disabled,
}: {
  id?: string;
  categories: ProductCategory[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim();

  const filtered = useMemo(() => {
    const needle = trimmedQuery.toLowerCase();

    return needle
      ? categories.filter((category) =>
          category.name.toLowerCase().includes(needle),
        )
      : categories;
  }, [categories, trimmedQuery]);

  // Offer "Add ..." only when nothing matches the typed name exactly
  const canCreate =
    trimmedQuery.length > 0 &&
    trimmedQuery.length <= 100 &&
    !categories.some(
      (category) =>
        category.name.toLowerCase() === trimmedQuery.toLowerCase(),
    );

  const isNewCategory =
    value !== "" &&
    !categories.some(
      (category) => category.name.toLowerCase() === value.toLowerCase(),
    );

  function select(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="space-y-1.5">
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setQuery("");
        }}
      >
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-full justify-between font-normal"
            />
          }
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || "Select or add a category"}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>

        <PopoverContent
          className="w-(--anchor-width) min-w-64 p-0"
          align="start"
        >
          {/* Filtering is done manually so we can add the "Add" row */}
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search or type a new category..."
              maxLength={100}
            />

            <CommandList>
              {filtered.length === 0 && !canCreate && (
                <CommandEmpty>No categories yet. Type to add one.</CommandEmpty>
              )}

              {filtered.length > 0 && (
                <CommandGroup heading="Categories">
                  {filtered.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={category.name}
                      onSelect={() => select(category.name)}
                    >
                      <Check
                        className={cn(
                          "size-4",
                          value.toLowerCase() === category.name.toLowerCase()
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {category.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {canCreate && (
                <CommandGroup heading="New">
                  <CommandItem
                    value={`create-${trimmedQuery}`}
                    onSelect={() => select(trimmedQuery)}
                  >
                    <Plus className="size-4" />
                    Add &ldquo;{trimmedQuery}&rdquo;
                  </CommandItem>
                </CommandGroup>
              )}

              {value && (
                <CommandGroup>
                  <CommandItem
                    value="clear-category"
                    onSelect={() => select("")}
                    className="text-muted-foreground"
                  >
                    No category
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <p className="text-xs text-muted-foreground">
        {isNewCategory
          ? `"${value}" is new and will be created with this product.`
          : "Choose an existing category, or type a name to add a new one."}
      </p>
    </div>
  );
}

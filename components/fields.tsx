"use client"

import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field"
import { Input } from "@ui-sdk/react/input"
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
} from "@ui-sdk/react/number-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react/select"
import { CheckIcon, ChevronDownIcon, MinusIcon, PlusIcon } from "lucide-react"

type Option = { value: string; label: string; depth?: number }

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  description,
  required,
}: {
  label: string
  name: string
  options: readonly (Option | string)[]
  defaultValue?: string
  description?: string
  required?: boolean
}) {
  const items = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  )
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select
        name={name}
        items={items}
        defaultValue={defaultValue}
        required={required}
        placeholder="Choose…"
      >
        <SelectTrigger className="w-full justify-between">
          <SelectValue className="truncate" />
          <ChevronDownIcon aria-hidden="true" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {items.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              style={{ paddingInlineStart: `${0.5 + (item.depth ?? 0) * 0.75}rem` }}
            >
              {item.label}
              <SelectItemIndicator className="ms-auto">
                <CheckIcon aria-hidden="true" />
              </SelectItemIndicator>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  )
}

export function TextField({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  type,
  description,
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  type?: string
  description?: string
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        type={type}
        autoComplete="off"
      />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  )
}

export function MoneyField({
  label,
  name,
  defaultValue,
  description,
  readOnly,
}: {
  label: string
  name: string
  defaultValue: number | null
  description?: string
  readOnly?: boolean
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <NumberInput
        name={name}
        defaultValue={defaultValue}
        readOnly={readOnly}
        min={0}
        step={0.01}
        format={{ style: "currency", currency: "USD" }}
      >
        <NumberInputGroup className="money w-full">
          <NumberInputControl placeholder="$0.00" />
        </NumberInputGroup>
      </NumberInput>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  )
}

export function QuantityField({
  defaultValue,
}: {
  defaultValue: number
}) {
  return (
    <Field>
      <FieldLabel>How many</FieldLabel>
      <NumberInput name="quantity" defaultValue={defaultValue} min={0} required>
        <NumberInputGroup className="qty">
          <NumberInputDecrement aria-label="Decrease">
            <MinusIcon aria-hidden="true" />
          </NumberInputDecrement>
          <NumberInputControl />
          <NumberInputIncrement aria-label="Increase">
            <PlusIcon aria-hidden="true" />
          </NumberInputIncrement>
        </NumberInputGroup>
      </NumberInput>
    </Field>
  )
}

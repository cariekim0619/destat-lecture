"use client"

import * as React from "react"
import type * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider as RHFFormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form"

import { cn } from "~/lib/utils"
import { Label } from "~/components/ui/label"

type FormProviderProps<TFieldValues extends FieldValues = FieldValues> =
  UseFormReturn<TFieldValues> & {
    children: React.ReactNode
  }

type FormRootProps = React.ComponentProps<"form"> & {
  form?: undefined
}

type FormWithProviderProps<TFieldValues extends FieldValues = FieldValues> =
  React.ComponentProps<"form"> & {
    form: UseFormReturn<TFieldValues>
  }

type FormProps<TFieldValues extends FieldValues = FieldValues> =
  | FormRootProps
  | FormProviderProps<TFieldValues>
  | FormWithProviderProps<TFieldValues>

function isUseFormReturn(value: unknown): value is UseFormReturn<FieldValues> {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>

  return (
    typeof record.handleSubmit === "function" &&
    typeof record.register === "function"
  )
}

function Form<TFieldValues extends FieldValues = FieldValues>(
  props: FormProps<TFieldValues>
) {
  if ("form" in props && props.form) {
    const { form, className, children, ...rest } = props
    return (
      <RHFFormProvider {...form}>
        <form
          data-slot="form"
          className={cn("w-full", className)}
          {...rest}
        >
          {children}
        </form>
      </RHFFormProvider>
    )
  }

  if (isUseFormReturn(props)) {
    const { children, ...form } = props as FormProviderProps<TFieldValues>
    return <RHFFormProvider {...form}>{children}</RHFFormProvider>
  }

  const { className, children, ...rest } = props as React.ComponentProps<"form">

  return (
    <form data-slot="form" className={cn("w-full", className)} {...rest}>
      {children}
    </form>
  )
}

const FormProvider = RHFFormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : props.children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  useFormField,
  Form,
  FormProvider,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}

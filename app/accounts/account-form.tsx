"use client"

import { useActionState, useEffect, useId } from "react"

import { Button } from "@/components/ui/button"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AccountFormState } from "./actions"

const initialState: AccountFormState = { status: "idle" }

type AccountFormValues = {
  id: string
  name: string
  description: string | null
}

export function AccountForm({
  account,
  action,
  onSuccess,
}: {
  account?: AccountFormValues
  action: (prevState: AccountFormState, formData: FormData) => Promise<AccountFormState>
  onSuccess?: () => void
}) {
  const formId = useId()
  const [state, formAction, pending] = useActionState<AccountFormState, FormData>(
    action,
    initialState
  )

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <form id={formId} action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="text-sm text-destructive" aria-live="polite">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-name`}>帳戶名稱</Label>
        <Input
          id={`${formId}-name`}
          name="name"
          defaultValue={account?.name}
          placeholder="例如：Yumin收入帳戶"
          aria-invalid={!!state.fieldErrors?.name}
          required
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-description`}>說明</Label>
        <Textarea
          id={`${formId}-description`}
          name="description"
          defaultValue={account?.description ?? ""}
          placeholder="這個帳戶用來記錄什麼收入（選填）"
          aria-invalid={!!state.fieldErrors?.description}
        />
        {state.fieldErrors?.description && (
          <p className="text-xs text-destructive">{state.fieldErrors.description[0]}</p>
        )}
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          取消
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "儲存中…" : account ? "儲存變更" : "新增帳戶"}
        </Button>
      </DialogFooter>
    </form>
  )
}

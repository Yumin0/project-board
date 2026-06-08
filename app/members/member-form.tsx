"use client"

import { useActionState, useEffect, useId } from "react"

import { Button } from "@/components/ui/button"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MemberFormState } from "./actions"

const initialState: MemberFormState = { status: "idle" }

type MemberFormValues = {
  id: string
  name: string
}

export function MemberForm({
  member,
  action,
  onSuccess,
}: {
  member?: MemberFormValues
  action: (prevState: MemberFormState, formData: FormData) => Promise<MemberFormState>
  onSuccess?: () => void
}) {
  const formId = useId()
  const [state, formAction, pending] = useActionState<MemberFormState, FormData>(
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
        <Label htmlFor={`${formId}-name`}>姓名</Label>
        <Input
          id={`${formId}-name`}
          name="name"
          defaultValue={member?.name}
          placeholder="例如：Yumin"
          aria-invalid={!!state.fieldErrors?.name}
          required
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          取消
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "儲存中…" : member ? "儲存變更" : "新增成員"}
        </Button>
      </DialogFooter>
    </form>
  )
}

"use client"

import { useActionState, useEffect, useId } from "react"

import { Button } from "@/components/ui/button"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { MemberFormState } from "./actions"

const initialState: MemberFormState = { status: "idle" }

type Account = { id: string; name: string }

type MemberFormValues = {
  id: string
  name: string
  accountId?: string | null
}

export function MemberForm({
  member,
  accounts,
  action,
  onSuccess,
}: {
  member?: MemberFormValues
  accounts: Account[]
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-accountId`}>對應收入帳戶（選填）</Label>
        <Select name="accountId" defaultValue={member?.accountId ?? "__none__"}>
          <SelectTrigger id={`${formId}-accountId`} className="w-full">
            <SelectValue placeholder="不設定帳戶">
              {(value: string) =>
                value === "__none__"
                  ? "不設定帳戶"
                  : (accounts.find((a) => a.id === value)?.name ?? "不設定帳戶")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">不設定帳戶</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.accountId && (
          <p className="text-xs text-destructive">{state.fieldErrors.accountId[0]}</p>
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

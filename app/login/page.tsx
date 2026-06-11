import { LockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { login } from "./actions"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>
}) {
  const { from, error } = await searchParams

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LockIcon className="size-4" />
            </div>
            <CardTitle className="text-lg">Project Board</CardTitle>
          </div>
          <CardDescription>請輸入密碼以繼續</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="flex flex-col gap-4">
            <input type="hidden" name="from" value={from ?? "/"} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">密碼</Label>
              <Input id="password" name="password" type="password" autoFocus required />
            </div>
            {error && <p className="text-sm text-destructive">密碼錯誤，請再試一次</p>}
            <Button type="submit" className="w-full">
              登入
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

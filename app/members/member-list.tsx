import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DeleteMemberDialog, EditMemberDialog } from "./member-dialogs"

type Member = {
  id: string
  name: string
  accountId?: string | null
  account?: { id: string; name: string } | null
  _count: { assignedProjects: number }
}

type Account = { id: string; name: string }

export function MemberList({ members, accounts }: { members: Member[]; accounts: Account[] }) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium">還沒有任何成員</p>
        <p className="text-sm text-muted-foreground">
          點擊「新增成員」加入可以被指派為負責人的成員
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <Card key={member.id}>
          <CardHeader>
            <CardTitle>{member.name}</CardTitle>
            <CardDescription>
              <span className="font-mono">#{member.id}</span> ·{" "}
              {member._count.assignedProjects} 個專案由此成員負責
              {member.account && (
                <span className="ml-1 text-muted-foreground">· {member.account.name}</span>
              )}
            </CardDescription>
            <CardAction className="flex gap-1">
              <EditMemberDialog member={member} accounts={accounts} />
              <DeleteMemberDialog member={member} />
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

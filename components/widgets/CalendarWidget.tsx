import { getMonthLogs } from "@/lib/work-log"
import MonthlyCalendarGrid from "./MonthlyCalendarGrid"

export default async function CalendarWidget() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const logs = await getMonthLogs(year, month)

  return <MonthlyCalendarGrid initialYear={year} initialMonth={month} initialLogs={logs} />
}

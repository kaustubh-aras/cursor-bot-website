"use client"

import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

interface LeaveRecord {
  date: string
  reason: string
  halfDay: string
  createdAt: string
}

interface EmployeeLeaveHistoryProps {
  data: LeaveRecord[]
}

export function EmployeeLeaveHistory({ data }: EmployeeLeaveHistoryProps) {
  const recentLeaves = data.slice(-5).reverse()

  if (recentLeaves.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">No leave records found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {recentLeaves.map((leave, index) => (
        <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
          <div className="flex-shrink-0 mt-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {new Date(leave.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <Badge variant={leave.halfDay === "full" ? "destructive" : "secondary"}>
                {leave.halfDay === "full" ? "Full Day" : "Half Day"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{leave.reason}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Applied: {new Date(leave.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

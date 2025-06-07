"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface AttendanceData {
  _id: string
  userId: string
  username: string
  displayName: string
  date: string
  firstHalfPresent: boolean
  secondHalfPresent: boolean
  createdAt: string
}

interface LeaveData {
  _id: string
  userId: string
  username: string
  displayName: string
  date: string
  reason: string
  halfDay: string
  createdAt: string
}

interface RecentActivityProps {
  attendanceData: AttendanceData[]
  leaveData: LeaveData[]
}

export function RecentActivity({ attendanceData, leaveData }: RecentActivityProps) {
  // Combine and sort recent activities
  const recentActivities = [
    ...attendanceData.slice(-5).map((item) => ({
      type: "attendance" as const,
      displayName: item.displayName,
      username: item.username,
      date: item.date,
      status: item.firstHalfPresent && item.secondHalfPresent ? "Full Day" : "Half Day",
      createdAt: item.createdAt,
    })),
    ...leaveData.slice(-5).map((item) => ({
      type: "leave" as const,
      displayName: item.displayName,
      username: item.username,
      date: item.date,
      status: item.halfDay === "full" ? "Full Day Leave" : "Half Day Leave",
      reason: item.reason,
      createdAt: item.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  return (
    <div className="space-y-4">
      {recentActivities.map((activity, index) => (
        <div key={index} className="flex items-center space-x-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://avatar.vercel.sh/${activity.username}`} />
            <AvatarFallback>{activity.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">{activity.displayName}</p>
            <p className="text-sm text-muted-foreground">
              {activity.type === "attendance" ? "Marked attendance" : "Applied for leave"}
            </p>
            {activity.type === "leave" && activity.reason && (
              <p className="text-xs text-muted-foreground">Reason: {activity.reason}</p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge variant={activity.type === "attendance" ? "default" : "secondary"}>{activity.status}</Badge>
            <p className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

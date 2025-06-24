"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Calendar, TrendingUp } from "lucide-react"
import { AttendanceChart } from "@/components/attendance-chart"
import { RecentActivity } from "@/components/recent-activity"

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

export default function Dashboard() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [leaveData, setLeaveData] = useState<LeaveData[]>([])
  const [loading, setLoading] = useState(true)

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendanceRes, leaveRes] = await Promise.all([
          fetch(`${baseUrl}/api/hr/attendance`),
          fetch(`${baseUrl}/api/leaves`),
        ])

        const attendanceJson = await attendanceRes.json()
        const leaveJson = await leaveRes.json()

        setAttendanceData(attendanceJson.data || [])
        setLeaveData(leaveJson.data || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const today = new Date().toISOString().split("T")[0]

  const uniqueEmployeeIds = new Set([
    ...attendanceData.map((a) => a.userId),
    ...leaveData.map((l) => l.userId),
  ])

  const totalEmployees = uniqueEmployeeIds.size

  const todayAttendance = attendanceData.filter((a) => a.date === today).length

  const todayLeaves = leaveData.filter((l) => l.date === today).length

  const attendanceRate = totalEmployees > 0 ? ((todayAttendance / totalEmployees) * 100).toFixed(1) : "0"

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of attendance and employee statistics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAttendance}</div>
            <p className="text-xs text-muted-foreground">Employees present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayLeaves}</div>
            <p className="text-xs text-muted-foreground">Employees on leave</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Today's attendance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Daily attendance trends for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceChart data={attendanceData} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest attendance and leave updates</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity attendanceData={attendanceData} leaveData={leaveData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
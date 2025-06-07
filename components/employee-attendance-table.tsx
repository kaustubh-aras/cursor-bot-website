"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search } from "lucide-react"

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

interface EmployeeAttendanceTableProps {
  attendanceData: AttendanceData[]
  leaveData: LeaveData[]
}

interface EmployeeSummary {
  userId: string
  username: string
  displayName: string
  presentDays: number
  halfDays: number
  leaveDays: number
  attendanceRate: number
}

export function EmployeeAttendanceTable({ attendanceData, leaveData }: EmployeeAttendanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Process data to get employee summaries
  const employeeMap = new Map<string, EmployeeSummary>()

  // Process attendance data
  attendanceData.forEach((record) => {
    if (!employeeMap.has(record.userId)) {
      employeeMap.set(record.userId, {
        userId: record.userId,
        username: record.username,
        displayName: record.displayName,
        presentDays: 0,
        halfDays: 0,
        leaveDays: 0,
        attendanceRate: 0,
      })
    }

    const employee = employeeMap.get(record.userId)!
    if (record.firstHalfPresent && record.secondHalfPresent) {
      employee.presentDays += 1
    } else if (record.firstHalfPresent || record.secondHalfPresent) {
      employee.halfDays += 1
    }
  })

  // Process leave data
  leaveData.forEach((record) => {
    if (!employeeMap.has(record.userId)) {
      employeeMap.set(record.userId, {
        userId: record.userId,
        username: record.username,
        displayName: record.displayName,
        presentDays: 0,
        halfDays: 0,
        leaveDays: 0,
        attendanceRate: 0,
      })
    }

    const employee = employeeMap.get(record.userId)!
    if (record.halfDay === "full") {
      employee.leaveDays += 1
    } else {
      employee.leaveDays += 0.5
    }
  })

  // Calculate attendance rates
  employeeMap.forEach((employee) => {
    const totalDays = employee.presentDays + employee.halfDays + employee.leaveDays
    employee.attendanceRate = totalDays > 0 ? ((employee.presentDays + employee.halfDays * 0.5) / totalDays) * 100 : 0
  })

  const employeeSummaries = Array.from(employeeMap.values())

  // Filter by search term
  const filteredEmployees = employeeSummaries.filter(
    (employee) =>
      employee.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.username.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return "bg-green-100 text-green-800"
    if (rate >= 75) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  if (employeeSummaries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No attendance data available for the selected period</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 font-medium">
                <th className="py-3 px-4 text-left">Employee</th>
                <th className="py-3 px-4 text-center">Present Days</th>
                <th className="py-3 px-4 text-center">Half Days</th>
                <th className="py-3 px-4 text-center">Leave Days</th>
                <th className="py-3 px-4 text-center">Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.userId} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://avatar.vercel.sh/${employee.username}`} />
                        <AvatarFallback>{employee.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{employee.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">{employee.presentDays}</td>
                  <td className="py-3 px-4 text-center">{employee.halfDays}</td>
                  <td className="py-3 px-4 text-center">{employee.leaveDays}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={getAttendanceRateColor(employee.attendanceRate)}>
                      {employee.attendanceRate.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

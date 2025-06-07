"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Download, FileText, PieChart, Users } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { AttendanceSummaryChart } from "@/components/attendance-summary-chart"
import { LeaveDistributionChart } from "@/components/leave-distribution-chart"
import { EmployeeAttendanceTable } from "@/components/employee-attendance-table"

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

export default function ReportsPage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [leaveData, setLeaveData] = useState<LeaveData[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [reportType, setReportType] = useState("attendance")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendanceRes, leaveRes] = await Promise.all([
          fetch(process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || ""),
          fetch(process.env.NEXT_PUBLIC_LEAVES_API_URL || ""),
        ])

        const attendance = await attendanceRes.json()
        const leaves = await leaveRes.json()

        setAttendanceData(attendance)
        setLeaveData(leaves)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDateRangePreset = (preset: string) => {
    const today = new Date()

    switch (preset) {
      case "today":
        setDateRange({ from: today, to: today })
        break
      case "yesterday":
        const yesterday = subDays(today, 1)
        setDateRange({ from: yesterday, to: yesterday })
        break
      case "last7days":
        setDateRange({ from: subDays(today, 6), to: today })
        break
      case "last30days":
        setDateRange({ from: subDays(today, 29), to: today })
        break
      case "thisMonth":
        setDateRange({
          from: startOfMonth(today),
          to: endOfMonth(today),
        })
        break
      default:
        break
    }
  }

  const filteredAttendanceData = attendanceData.filter((record) => {
    const recordDate = new Date(record.date)
    return recordDate >= dateRange.from && recordDate <= dateRange.to
  })

  const filteredLeaveData = leaveData.filter((record) => {
    const recordDate = new Date(record.date)
    return recordDate >= dateRange.from && recordDate <= dateRange.to
  })

  const exportReport = () => {
    // Create CSV content based on report type
    let headers: string[] = []
    let csvData: string[][] = []

    if (reportType === "attendance") {
      headers = ["Date", "Employee", "Username", "First Half", "Second Half", "Status"]
      csvData = filteredAttendanceData.map((record) => {
        const status =
          record.firstHalfPresent && record.secondHalfPresent
            ? "Full Day"
            : record.firstHalfPresent || record.secondHalfPresent
              ? "Half Day"
              : "Absent"

        return [
          new Date(record.date).toLocaleDateString(),
          record.displayName,
          record.username,
          record.firstHalfPresent ? "Present" : "Absent",
          record.secondHalfPresent ? "Present" : "Absent",
          status,
        ]
      })
    } else if (reportType === "leaves") {
      headers = ["Date", "Employee", "Username", "Leave Type", "Reason"]
      csvData = filteredLeaveData.map((record) => {
        return [
          new Date(record.date).toLocaleDateString(),
          record.displayName,
          record.username,
          record.halfDay === "full" ? "Full Day" : "Half Day",
          `"${record.reason.replace(/"/g, '""')}"`, // Escape quotes in CSV
        ]
      })
    } else {
      // Summary report
      const employees = new Map()

      // Process attendance data
      filteredAttendanceData.forEach((record) => {
        if (!employees.has(record.userId)) {
          employees.set(record.userId, {
            name: record.displayName,
            username: record.username,
            presentDays: 0,
            halfDays: 0,
            leaveDays: 0,
          })
        }

        const employee = employees.get(record.userId)
        if (record.firstHalfPresent && record.secondHalfPresent) {
          employee.presentDays += 1
        } else if (record.firstHalfPresent || record.secondHalfPresent) {
          employee.halfDays += 0.5
          employee.presentDays += 0.5
        }
      })

      // Process leave data
      filteredLeaveData.forEach((record) => {
        if (!employees.has(record.userId)) {
          employees.set(record.userId, {
            name: record.displayName,
            username: record.username,
            presentDays: 0,
            halfDays: 0,
            leaveDays: 0,
          })
        }

        const employee = employees.get(record.userId)
        if (record.halfDay === "full") {
          employee.leaveDays += 1
        } else {
          employee.leaveDays += 0.5
        }
      })

      headers = ["Employee", "Username", "Present Days", "Half Days", "Leave Days", "Attendance Rate"]
      csvData = Array.from(employees.values()).map((employee: any) => {
        const totalDays = employee.presentDays + employee.leaveDays
        const attendanceRate = totalDays > 0 ? (employee.presentDays / totalDays) * 100 : 0

        return [
          employee.name,
          employee.username,
          employee.presentDays.toString(),
          employee.halfDays.toString(),
          employee.leaveDays.toString(),
          `${attendanceRate.toFixed(1)}%`,
        ]
      })
    }

    // Create CSV content
    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `${reportType}_report_${format(dateRange.from, "yyyy-MM-dd")}_to_${format(dateRange.to, "yyyy-MM-dd")}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Generate and view attendance and leave reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select date range and report type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to })
                      }
                    }}
                    initialFocus
                  />
                  <div className="grid grid-cols-2 gap-2 p-3 border-t">
                    <Button variant="outline" size="sm" onClick={() => handleDateRangePreset("today")}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDateRangePreset("yesterday")}>
                      Yesterday
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDateRangePreset("last7days")}>
                      Last 7 Days
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDateRangePreset("last30days")}>
                      Last 30 Days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDateRangePreset("thisMonth")}
                      className="col-span-2"
                    >
                      This Month
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="leaves">Leave Report</SelectItem>
                  <SelectItem value="summary">Summary Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={exportReport} className="w-full md:w-auto ml-auto">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="charts">
            <PieChart className="mr-2 h-4 w-4" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="details">
            <FileText className="mr-2 h-4 w-4" />
            Detailed View
          </TabsTrigger>
        </TabsList>
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
                <CardDescription>
                  {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <AttendanceSummaryChart attendanceData={filteredAttendanceData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Leave Distribution</CardTitle>
                <CardDescription>
                  {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <LeaveDistributionChart leaveData={filteredLeaveData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Employee Attendance Details</CardTitle>
                  <CardDescription>
                    {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                  </CardDescription>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <EmployeeAttendanceTable attendanceData={filteredAttendanceData} leaveData={filteredLeaveData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

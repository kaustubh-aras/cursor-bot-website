"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"

interface Employee {
  userId: string
  username: string
  displayName: string
  attendanceCount: number
  leaveCount: number
  lastSeen: string
  status: "present" | "absent" | "on-leave"
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const [attendanceRes, leaveRes] = await Promise.all([
          fetch(process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || ""),
          fetch(process.env.NEXT_PUBLIC_LEAVES_API_URL || ""),
        ])

        const attendanceData = await attendanceRes.json()
        const leaveData = await leaveRes.json()

        // Create employee map
        const employeeMap = new Map<string, Employee>()

        // Process attendance data
        attendanceData.forEach((record: any) => {
          if (!employeeMap.has(record.userId)) {
            employeeMap.set(record.userId, {
              userId: record.userId,
              username: record.username,
              displayName: record.displayName,
              attendanceCount: 0,
              leaveCount: 0,
              lastSeen: record.date,
              status: "absent" as const,
            })
          }

          const employee = employeeMap.get(record.userId)!
          employee.attendanceCount++

          // Check if present today
          const today = new Date().toISOString().split("T")[0]
          if (record.date === today && record.firstHalfPresent && record.secondHalfPresent) {
            employee.status = "present"
          }

          // Update last seen
          if (new Date(record.date) > new Date(employee.lastSeen)) {
            employee.lastSeen = record.date
          }
        })

        // Process leave data
        leaveData.forEach((record: any) => {
          if (!employeeMap.has(record.userId)) {
            employeeMap.set(record.userId, {
              userId: record.userId,
              username: record.username,
              displayName: record.displayName,
              attendanceCount: 0,
              leaveCount: 0,
              lastSeen: record.date,
              status: "absent" as const,
            })
          }

          const employee = employeeMap.get(record.userId)!
          employee.leaveCount++

          // Check if on leave today
          const today = new Date().toISOString().split("T")[0]
          if (record.date === today) {
            employee.status = "on-leave"
          }
        })

        const employeeList = Array.from(employeeMap.values())
        setEmployees(employeeList)
        setFilteredEmployees(employeeList)
      } catch (error) {
        console.error("Error fetching employee data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployeeData()
  }, [])

  useEffect(() => {
    const filtered = employees.filter(
      (employee) =>
        employee.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.username.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredEmployees(filtered)
  }, [searchTerm, employees])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800"
      case "on-leave":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
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
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground">Manage and view employee attendance records</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee) => (
          <Link key={employee.userId} href={`/dashboard/employees/${employee.userId}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://avatar.vercel.sh/${employee.username}`} />
                    <AvatarFallback>{employee.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{employee.displayName}</CardTitle>
                    <CardDescription>@{employee.username}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(employee.status)}>{employee.status.replace("-", " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{employee.attendanceCount}</div>
                    <div className="text-xs text-muted-foreground">Days Present</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{employee.leaveCount}</div>
                    <div className="text-xs text-muted-foreground">Leaves Taken</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">{new Date(employee.lastSeen).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">Last Seen</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No employees found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  )
}

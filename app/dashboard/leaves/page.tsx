"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarIcon, Search, Filter, Download, AlertCircle } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LeaveRecord {
  _id: string
  userId: string
  username: string
  displayName: string
  date: string
  reason: string
  halfDay: string
  createdAt: string
}

export default function LeavesPage() {
  const [leaveData, setLeaveData] = useState<LeaveRecord[]>([])
  const [filteredData, setFilteredData] = useState<LeaveRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all")

  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_LEAVES_API_URL || "")
        const data = await response.json()
        setLeaveData(data)
        setFilteredData(data)
      } catch (error) {
        console.error("Error fetching leave data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaveData()
  }, [])

  useEffect(() => {
    let filtered = [...leaveData]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.reason.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by date
    if (date) {
      const dateString = format(date, "yyyy-MM-dd")
      filtered = filtered.filter((record) => record.date === dateString)
    }

    // Filter by leave type
    if (leaveTypeFilter !== "all") {
      filtered = filtered.filter((record) => record.halfDay === leaveTypeFilter)
    }

    setFilteredData(filtered)
  }, [searchTerm, date, leaveTypeFilter, leaveData])

  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Name", "Username", "Date", "Leave Type", "Reason", "Applied On"]
    const csvContent = [
      headers.join(","),
      ...filteredData.map((record) => {
        return [
          record.displayName,
          record.username,
          new Date(record.date).toLocaleDateString(),
          record.halfDay === "full" ? "Full Day" : "Half Day",
          `"${record.reason.replace(/"/g, '""')}"`, // Escape quotes in CSV
          new Date(record.createdAt).toLocaleDateString(),
        ].join(",")
      }),
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `leaves_${format(date || new Date(), "yyyy-MM-dd")}.csv`)
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
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
        <p className="text-muted-foreground">View and manage employee leave requests</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search leaves..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-[250px]"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>

          <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leave Types</SelectItem>
              <SelectItem value="full">Full Day</SelectItem>
              <SelectItem value="half">Half Day</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportToCSV} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 font-medium">
                    <th className="py-3 px-4 text-left">Employee</th>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Leave Type</th>
                    <th className="py-3 px-4 text-left">Reason</th>
                    <th className="py-3 px-4 text-left">Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((record) => (
                      <tr key={record._id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://avatar.vercel.sh/${record.username}`} />
                              <AvatarFallback>{record.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{record.displayName}</p>
                              <p className="text-xs text-muted-foreground">@{record.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(record.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={record.halfDay === "full" ? "destructive" : "secondary"}>
                            {record.halfDay === "full" ? "Full Day" : "Half Day"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <p className="truncate max-w-[200px]">{record.reason}</p>
                            {record.reason.length > 30 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertCircle className="ml-2 h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{record.reason}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(record.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        No leave records found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarIcon, Search, Filter, Download, Trash2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface AttendanceRecord {
  _id: string
  userId: string
  username: string
  displayName: string
  date: string
  firstHalfPresent: boolean
  secondHalfPresent: boolean
  createdAt: string
  formattedDate?: string
  id?: string
}

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [password, setPassword] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || "")
        const data = await response.json()
        setAttendanceData(data)
        setFilteredData(data)
      } catch (error) {
        console.error("Error fetching attendance data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendanceData()
  }, [])

  useEffect(() => {
    let filtered = [...attendanceData]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.username.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by date
    if (date) {
      const dateString = format(date, "yyyy-MM-dd")
      filtered = filtered.filter((record) => record.date === dateString)
    }

    // Filter by status
    if (statusFilter !== "all") {
      if (statusFilter === "full") {
        filtered = filtered.filter((record) => record.firstHalfPresent && record.secondHalfPresent)
      } else if (statusFilter === "half") {
        filtered = filtered.filter(
          (record) =>
            (record.firstHalfPresent && !record.secondHalfPresent) ||
            (!record.firstHalfPresent && record.secondHalfPresent),
        )
      } else if (statusFilter === "first-half") {
        filtered = filtered.filter((record) => record.firstHalfPresent)
      } else if (statusFilter === "second-half") {
        filtered = filtered.filter((record) => record.secondHalfPresent)
      }
    }

    setFilteredData(filtered)
  }, [searchTerm, date, statusFilter, attendanceData])

  const getAttendanceStatus = (record: AttendanceRecord) => {
    if (record.firstHalfPresent && record.secondHalfPresent) {
      return { label: "Full Day", variant: "default" as const }
    } else if (record.firstHalfPresent) {
      return { label: "First Half", variant: "secondary" as const }
    } else if (record.secondHalfPresent) {
      return { label: "Second Half", variant: "secondary" as const }
    } else {
      return { label: "Absent", variant: "destructive" as const }
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const handleDeleteClick = (record: AttendanceRecord) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
    setPassword("")
  }

  const handleDeleteConfirm = async () => {
    if (password !== "admin786") {
      toast({
        title: "Invalid Password",
        description: "Please enter the correct admin password.",
        variant: "destructive",
      })
      return
    }

    if (!selectedRecord) return

    // Get the record ID (check both _id and id properties)
    const recordId = selectedRecord._id || selectedRecord.id

    if (!recordId) {
      toast({
        title: "Error",
        description: "Could not find record ID. Please try again.",
        variant: "destructive",
      })
      return
    }

    setDeleting(true)
    try {
      // Make DELETE request to the API
      const apiUrl = `${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL}/${recordId}`
      console.log(`Attempting to delete record with ID: ${recordId}`)
      console.log(`DELETE request to: ${apiUrl}`)

      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete record: ${response.status} ${response.statusText}`)
      }

      // Remove from local state only after successful API deletion
      const updatedData = attendanceData.filter((record) => {
        const currentId = record._id || record.id
        return currentId !== recordId
      })

      setAttendanceData(updatedData)
      setFilteredData(
        updatedData.filter((record) => {
          let matches = true

          if (searchTerm) {
            matches =
              matches &&
              (record.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.username.toLowerCase().includes(searchTerm.toLowerCase()))
          }

          if (date) {
            const dateString = format(date, "yyyy-MM-dd")
            matches = matches && record.date === dateString
          }

          if (statusFilter !== "all") {
            if (statusFilter === "full") {
              matches = matches && record.firstHalfPresent && record.secondHalfPresent
            } else if (statusFilter === "half") {
              matches =
                matches &&
                ((record.firstHalfPresent && !record.secondHalfPresent) ||
                  (!record.firstHalfPresent && record.secondHalfPresent))
            } else if (statusFilter === "first-half") {
              matches = matches && record.firstHalfPresent
            } else if (statusFilter === "second-half") {
              matches = matches && record.secondHalfPresent
            }
          }

          return matches
        }),
      )

      toast({
        title: "Record Deleted",
        description: `Attendance record for ${selectedRecord.displayName} has been successfully deleted from the database.`,
      })

      setDeleteDialogOpen(false)
      setSelectedRecord(null)
      setPassword("")
    } catch (error) {
      console.error("Error deleting record:", error)
      toast({
        title: "Delete Failed",
        description:
          error instanceof Error ? error.message : "Failed to delete the attendance record from the database.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Name", "Username", "Date", "Time", "Status", "First Half", "Second Half"]
    const csvContent = [
      headers.join(","),
      ...filteredData.map((record) => {
        const status = getAttendanceStatus(record)
        return [
          record.displayName,
          record.username,
          new Date(record.date).toLocaleDateString(),
          formatTime(record.createdAt),
          status.label,
          record.firstHalfPresent ? "Present" : "Absent",
          record.secondHalfPresent ? "Present" : "Absent",
        ].join(",")
      }),
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance_${format(date || new Date(), "yyyy-MM-dd")}.csv`)
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
        <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
        <p className="text-muted-foreground">View and manage daily attendance records</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search employees..."
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="full">Full Day</SelectItem>
              <SelectItem value="half">Half Day</SelectItem>
              <SelectItem value="first-half">First Half</SelectItem>
              <SelectItem value="second-half">Second Half</SelectItem>
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
          <CardTitle>Attendance List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 font-medium">
                    <th className="py-3 px-4 text-left">Employee</th>
                    <th className="py-3 px-4 text-left">Date & Time</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">First Half</th>
                    <th className="py-3 px-4 text-left">Second Half</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((record) => {
                      const status = getAttendanceStatus(record)
                      const recordId = record._id || record.id
                      return (
                        <tr key={recordId} className="border-b hover:bg-muted/50">
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
                            <div>
                              <p className="font-medium">
                                {new Date(record.date).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatTime(record.createdAt)}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={record.firstHalfPresent ? "outline" : "destructive"}
                              className={cn(
                                "bg-transparent",
                                record.firstHalfPresent ? "text-green-600 border-green-600" : "",
                              )}
                            >
                              {record.firstHalfPresent ? "Present" : "Absent"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={record.secondHalfPresent ? "outline" : "destructive"}
                              className={cn(
                                "bg-transparent",
                                record.secondHalfPresent ? "text-green-600 border-green-600" : "",
                              )}
                            >
                              {record.secondHalfPresent ? "Present" : "Absent"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              onClick={() => handleDeleteClick(record)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        No attendance records found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Attendance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the attendance record for <strong>{selectedRecord?.displayName}</strong>{" "}
              on{" "}
              <strong>
                {selectedRecord?.date &&
                  new Date(selectedRecord.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Admin Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled>
              {deleting ? "Deleting..." : "Delete Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

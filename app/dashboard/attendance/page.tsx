"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarIcon, Search, Filter, Download, Trash2, Plus, Edit, Users, Upload } from "lucide-react"
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
  updatedAt?: string
  formattedDate?: string
  id?: string
}

interface User {
  _id: string
  username: string
  displayName: string
  email?: string
}

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [password, setPassword] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    userId: "",
    username: "",
    displayName: "",
    date: format(new Date(), "yyyy-MM-dd"),
    firstHalfPresent: false,
    secondHalfPresent: false,
  })

  // Bulk operation states
  const [bulkDate, setBulkDate] = useState<Date | undefined>(new Date())
  const [bulkUsers, setBulkUsers] = useState<string[]>([])
  const [bulkFirstHalf, setBulkFirstHalf] = useState(true)
  const [bulkSecondHalf, setBulkSecondHalf] = useState(true)

  const API_BASE = "http://localhost:5000/api/hr"

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch attendance data
        const attendanceResponse = await fetch(`${API_BASE}/attendance`)
        
        if (!attendanceResponse.ok) {
          throw new Error(`Failed to fetch attendance: ${attendanceResponse.status}`)
        }
        
        const attendanceResult = await attendanceResponse.json()
        const attendanceArray = Array.isArray(attendanceResult) ? attendanceResult : []
        setAttendanceData(attendanceArray)
        setFilteredData(attendanceArray)

        // Fetch users
        const usersResponse = await fetch(`${API_BASE}/users`)
        
        if (!usersResponse.ok) {
          throw new Error(`Failed to fetch users: ${usersResponse.status}`)
        }
        
        const usersResult = await usersResponse.json()
        const usersArray = Array.isArray(usersResult) ? usersResult : []
        setUsers(usersArray)
      } catch (error) {
        console.error("Error fetching data:", error)
        // Set empty arrays as fallback
        setAttendanceData([])
        setFilteredData([])
        setUsers([])
        
        toast({
          title: "Error",
          description: "Failed to fetch data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Ensure attendanceData is an array before spreading
    if (!Array.isArray(attendanceData)) {
      return
    }
    
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

  const resetForm = () => {
    setFormData({
      userId: "",
      username: "",
      displayName: "",
      date: format(new Date(), "yyyy-MM-dd"),
      firstHalfPresent: false,
      secondHalfPresent: false,
    })
  }

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u._id === userId)
    if (user) {
      setFormData(prev => ({
        ...prev,
        userId: user._id,
        username: user.username,
        displayName: user.displayName,
      }))
    }
  }

  const handleCreateAttendance = async () => {
    if (!formData.userId || !formData.date) {
      toast({
        title: "Validation Error",
        description: "Please select a user and date.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_BASE}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: formData.userId,
          username: formData.username,
          displayName: formData.displayName,
          date: formData.date,
          firstHalfPresent: formData.firstHalfPresent,
          secondHalfPresent: formData.secondHalfPresent,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create attendance: ${response.status}`)
      }

      const newRecord = await response.json()
      setAttendanceData(prev => [newRecord, ...prev])
      
      toast({
        title: "Success",
        description: "Attendance record created successfully.",
      })

      setCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error creating attendance:", error)
      toast({
        title: "Error",
        description: "Failed to create attendance record.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (record: AttendanceRecord) => {
    setSelectedRecord(record)
    setFormData({
      userId: record.userId,
      username: record.username,
      displayName: record.displayName,
      date: record.date,
      firstHalfPresent: record.firstHalfPresent,
      secondHalfPresent: record.secondHalfPresent,
    })
    setEditDialogOpen(true)
  }

  const handleUpdateAttendance = async () => {
    if (!selectedRecord) return

    setSaving(true)
    try {
      const recordId = selectedRecord._id || selectedRecord.id
      const response = await fetch(`${API_BASE}/attendance/${recordId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstHalfPresent: formData.firstHalfPresent,
          secondHalfPresent: formData.secondHalfPresent,
          date: formData.date,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update attendance: ${response.status}`)
      }

      const updatedRecord = await response.json()
      setAttendanceData(prev => 
        prev.map(record => 
          (record._id || record.id) === recordId ? updatedRecord : record
        )
      )

      toast({
        title: "Success",
        description: "Attendance record updated successfully.",
      })

      setEditDialogOpen(false)
      setSelectedRecord(null)
      resetForm()
    } catch (error) {
      console.error("Error updating attendance:", error)
      toast({
        title: "Error",
        description: "Failed to update attendance record.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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
      const response = await fetch(`${API_BASE}/attendance/${recordId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete record: ${response.status} ${response.statusText}`)
      }

      setAttendanceData(prev => 
        prev.filter(record => (record._id || record.id) !== recordId)
      )

      toast({
        title: "Record Deleted",
        description: `Attendance record for ${selectedRecord.displayName} has been successfully deleted.`,
      })

      setDeleteDialogOpen(false)
      setSelectedRecord(null)
      setPassword("")
    } catch (error) {
      console.error("Error deleting record:", error)
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete the attendance record.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkAttendance = async () => {
    if (!bulkDate || bulkUsers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a date and at least one user.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const bulkData = bulkUsers.map(userId => {
        const user = users.find(u => u._id === userId)
        return {
          userId,
          username: user?.username || "",
          displayName: user?.displayName || "",
          date: format(bulkDate, "yyyy-MM-dd"),
          firstHalfPresent: bulkFirstHalf,
          secondHalfPresent: bulkSecondHalf,
        }
      })

      const response = await fetch(`${API_BASE}/attendance/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: bulkData }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create bulk attendance: ${response.status}`)
      }

      const newRecords = await response.json()
      setAttendanceData(prev => [...newRecords, ...prev])

      toast({
        title: "Success",
        description: `Created ${bulkUsers.length} attendance records successfully.`,
      })

      setBulkDialogOpen(false)
      setBulkUsers([])
    } catch (error) {
      console.error("Error creating bulk attendance:", error)
      toast({
        title: "Error",
        description: "Failed to create bulk attendance records.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const exportToCSV = () => {
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
        <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
        <p className="text-muted-foreground">Manage daily attendance records with full CRUD operations</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
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

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
          <Button onClick={() => setBulkDialogOpen(true)} variant="outline" className="w-full sm:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            Bulk Add
          </Button>
          <Button onClick={exportToCSV} variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records ({filteredData.length})</CardTitle>
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
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(record)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(record)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

      {/* Create Attendance Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Attendance Record</DialogTitle>
            <DialogDescription>
              Add a new attendance record for an employee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-select">Select Employee</Label>
              <Select value={formData.userId} onValueChange={handleUserSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`https://avatar.vercel.sh/${user.username}`} />
                          <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">{user.displayName}</span>
                          <span className="text-xs text-muted-foreground ml-2">@{user.username}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-input">Date</Label>
              <Input
                id="date-input"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="first-half"
                  checked={formData.firstHalfPresent}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, firstHalfPresent: checked as boolean }))
                  }
                />
                <Label htmlFor="first-half">First Half Present</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="second-half"
                  checked={formData.secondHalfPresent}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, secondHalfPresent: checked as boolean }))
                  }
                />
                <Label htmlFor="second-half">Second Half Present</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreateAttendance} disabled={saving}>
              {saving ? "Creating..." : "Create Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update attendance record for <strong>{selectedRecord?.displayName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-date-input">Date</Label>
              <Input
                id="edit-date-input"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-first-half"
                  checked={formData.firstHalfPresent}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, firstHalfPresent: checked as boolean }))
                  }
                />
                <Label htmlFor="edit-first-half">First Half Present</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-second-half"
                  checked={formData.secondHalfPresent}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, secondHalfPresent: checked as boolean }))
                  }
                />
                <Label htmlFor="edit-second-half">Second Half Present</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAttendance} disabled={saving}>
              {saving ? "Updating..." : "Update Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Bulk Create Attendance</DialogTitle>
            <DialogDescription>
              Create attendance records for multiple employees at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {bulkDate ? format(bulkDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={bulkDate} onSelect={setBulkDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Select Employees</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto mt-1">
                {users.map((user) => (
                  <div key={user._id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`bulk-user-${user._id}`}
                      checked={bulkUsers.includes(user._id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setBulkUsers(prev => [...prev, user._id])
                        } else {
                          setBulkUsers(prev => prev.filter(id => id !== user._id))
                        }
                      }}
                    />
                    <Label htmlFor={`bulk-user-${user._id}`} className="flex items-center gap-2 cursor-pointer">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://avatar.vercel.sh/${user.username}`} />
                        <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{user.displayName}</span>
                        <span className="text-xs text-muted-foreground ml-2">@{user.username}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkUsers(users.map(u => u._id))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkUsers([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulk-first-half"
                  checked={bulkFirstHalf}
                  onCheckedChange={(checked) => setBulkFirstHalf(checked as boolean)}
                />
                <Label htmlFor="bulk-first-half">First Half Present</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulk-second-half"
                  checked={bulkSecondHalf}
                  onCheckedChange={(checked) => setBulkSecondHalf(checked as boolean)}
                />
                <Label htmlFor="bulk-second-half">Second Half Present</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleBulkAttendance} disabled={saving}>
              {saving ? "Creating..." : `Create ${bulkUsers.length} Records`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Admin Password
              </Label>
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
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
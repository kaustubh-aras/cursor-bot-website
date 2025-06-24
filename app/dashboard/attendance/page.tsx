"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarIcon,
  Search,
  Filter,
  Download,
  Trash2,
  Plus,
  Edit,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface AttendanceRecord {
  _id: string;
  userId: string;
  username: string;
  displayName: string;
  date: string;
  firstHalfPresent: boolean;
  secondHalfPresent: boolean;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

interface User {
  _id: string;
  username: string;
  displayName: string;
  email?: string;
}

interface ApiResponse {
  success: boolean;
  data: AttendanceRecord[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
}

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(50);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    userId: "",
    username: "",
    displayName: "",
    date: format(new Date(), "yyyy-MM-dd"),
    firstHalfPresent: false,
    secondHalfPresent: false,
    note: "",
  });

  // Bulk operation states
  const [bulkDate, setBulkDate] = useState<Date | undefined>(new Date());
  const [bulkUsers, setBulkUsers] = useState<string[]>([]);
  const [bulkFirstHalf, setBulkFirstHalf] = useState(true);
  const [bulkSecondHalf, setBulkSecondHalf] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL

  // Fetch attendance data with proper API filtering
  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (date) {
        params.append("date", format(date, "yyyy-MM-dd"));
      }
      if (selectedUserId && selectedUserId !== "all") {
        params.append("userId", selectedUserId);
      }

      console.log("Fetching attendance with params:", params.toString()); // Debug log

      const response = await fetch(`${API_BASE}/api/hr/attendance?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch attendance error:", response.status, errorText);
        throw new Error(`Failed to fetch attendance: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      console.log("Attendance API response:", result); // Debug log

      if (result.success) {
        setAttendanceData(result.data || []);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages);
          setTotalRecords(result.pagination.totalRecords);
        }
      } else {
        setAttendanceData([]);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setAttendanceData([]);
      toast({
        title: "Error",
        description: "Failed to fetch attendance data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, date, selectedUserId]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/hr/users`);
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      const usersResult = await response.json();
      console.log("Users API response:", usersResult); // Debug log

      // Handle different possible response structures
      if (Array.isArray(usersResult)) {
        setUsers(usersResult);
      } else if (usersResult.data && Array.isArray(usersResult.data)) {
        setUsers(usersResult.data);
      } else if (usersResult.success && Array.isArray(usersResult.users)) {
        setUsers(usersResult.users);
      } else {
        console.error("Unexpected users API response structure:", usersResult);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Client-side filtering for search and status (since API doesn't support these yet)
  const filteredData = attendanceData.filter((record) => {
    const matchesSearch =
      searchTerm === "" ||
      record.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "full" &&
        record.firstHalfPresent &&
        record.secondHalfPresent) ||
      (statusFilter === "half" &&
        ((record.firstHalfPresent && !record.secondHalfPresent) ||
          (!record.firstHalfPresent && record.secondHalfPresent))) ||
      (statusFilter === "first-half" && record.firstHalfPresent) ||
      (statusFilter === "second-half" && record.secondHalfPresent) ||
      (statusFilter === "absent" &&
        !record.firstHalfPresent &&
        !record.secondHalfPresent);

    return matchesSearch && matchesStatus;
  });

  const getAttendanceStatus = (record: AttendanceRecord) => {
    if (record.firstHalfPresent && record.secondHalfPresent) {
      return { label: "Full Day", variant: "default" as const };
    } else if (record.firstHalfPresent) {
      return { label: "First Half", variant: "secondary" as const };
    } else if (record.secondHalfPresent) {
      return { label: "Second Half", variant: "secondary" as const };
    } else {
      return { label: "Absent", variant: "destructive" as const };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      username: "",
      displayName: "",
      date: format(new Date(), "yyyy-MM-dd"),
      firstHalfPresent: false,
      secondHalfPresent: false,
      note: "",
    });
  };

  const handleUserSelect = (userId: string) => {
    const user = users.find((u) => u._id === userId);
    if (user) {
      setFormData((prev) => ({
        ...prev,
        userId: user._id,
        username: user.username,
        displayName: user.displayName,
      }));
    }
  };

  const handleCreateAttendance = async () => {
    if (!formData.userId || !formData.date) {
      toast({
        title: "Validation Error",
        description: "Please select a user and date.",
        variant: "destructive",
      });
      return;
    }

    // Check if both halves are being marked as absent
    if (!formData.firstHalfPresent && !formData.secondHalfPresent) {
      toast({
        title: "Validation Error",
        description:
          "Cannot create attendance record with both halves absent. Please mark at least one half as present.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Find the selected user to get complete user data
      const selectedUser = users.find((u) => u._id === formData.userId);
      if (!selectedUser) {
        toast({
          title: "Error",
          description: "Selected user not found. Please refresh and try again.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const requestBody = {
        _id: formData.userId,
        username: selectedUser.username,
        displayName: selectedUser.displayName,
        date: formData.date,
        firstHalfPresent: formData.firstHalfPresent,
        secondHalfPresent: formData.secondHalfPresent,
        note: formData.note || "",
      };

      console.log("Creating attendance with data:", requestBody);
      console.log("Selected user:", selectedUser);

      const response = await fetch(`${API_BASE}/api/hr/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Create attendance error:", response.status, errorText);
        throw new Error(
          `Failed to create attendance: ${response.status} - ${errorText}`
        );
      }

      toast({
        title: "Success",
        description: "Attendance record created successfully.",
      });

      setCreateDialogOpen(false);
      resetForm();
      fetchAttendanceData();
    } catch (error) {
      console.error("Error creating attendance:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create attendance record.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setFormData({
      userId: record.userId,
      username: record.username,
      displayName: record.displayName,
      date: record.date,
      firstHalfPresent: record.firstHalfPresent,
      secondHalfPresent: record.secondHalfPresent,
      note: record.note || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdateAttendance = async () => {
    if (!selectedRecord) return;

    setSaving(true);
    try {
      const requestBody = {
        firstHalfPresent: formData.firstHalfPresent,
        secondHalfPresent: formData.secondHalfPresent,
        note: formData.note || "",
      };

      console.log("Updating attendance with data:", requestBody);

      const response = await fetch(
        `${API_BASE}/api/hr/attendance/${selectedRecord._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update attendance error:", response.status, errorText);
        throw new Error(
          `Failed to update attendance: ${response.status} - ${errorText}`
        );
      }

      toast({
        title: "Success",
        description: "Attendance record updated successfully.",
      });

      setEditDialogOpen(false);
      setSelectedRecord(null);
      resetForm();
      fetchAttendanceData();
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update attendance record.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
    setPassword("");
  };

  const handleDeleteConfirm = async () => {
    if (password !== "admin786") {
      toast({
        title: "Invalid Password",
        description: "Please enter the correct admin password.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRecord) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/hr/attendance/${selectedRecord._id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete record: ${response.status}`);
      }

      toast({
        title: "Record Deleted",
        description: `Attendance record for ${selectedRecord.displayName} has been successfully deleted.`,
      });

      setDeleteDialogOpen(false);
      setSelectedRecord(null);
      setPassword("");
      fetchAttendanceData(); // Refresh data
    } catch (error) {
      console.error("Error deleting record:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the attendance record.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkAttendance = async () => {
    if (!bulkDate || bulkUsers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a date and at least one user.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const bulkData = bulkUsers.map((userId) => {
        const user = users.find((u) => u._id === userId);
        return {
          userId,
          date: format(bulkDate, "yyyy-MM-dd"),
          firstHalfPresent: bulkFirstHalf,
          secondHalfPresent: bulkSecondHalf,
        };
      });

      const response = await fetch(`${API_BASE}/api/hr/attendance/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "mark",
          data: bulkData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create bulk attendance: ${response.status}`);
      }

      toast({
        title: "Success",
        description: `Created ${bulkUsers.length} attendance records successfully.`,
      });

      setBulkDialogOpen(false);
      setBulkUsers([]);
      fetchAttendanceData(); // Refresh data
    } catch (error) {
      console.error("Error creating bulk attendance:", error);
      toast({
        title: "Error",
        description: "Failed to create bulk attendance records.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Username",
      "Date",
      "Time",
      "Status",
      "First Half",
      "Second Half",
      "Note",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((record) => {
        const status = getAttendanceStatus(record);
        return [
          `"${record.displayName}"`,
          `"${record.username}"`,
          new Date(record.date).toLocaleDateString(),
          formatTime(record.createdAt),
          `"${status.label}"`,
          record.firstHalfPresent ? "Present" : "Absent",
          record.secondHalfPresent ? "Present" : "Absent",
          `"${record.note || ""}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `attendance_${format(date || new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleDateFilter = (newDate: Date | undefined) => {
    setDate(newDate);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleUserFilter = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentPage(1); // Reset to first page when filtering
  };

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
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Attendance Management
        </h1>
        <p className="text-muted-foreground">
          Manage daily attendance records with full CRUD operations
        </p>
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
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateFilter}
                initialFocus
              />
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
              <SelectItem value="absent">Absent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>

          <Button
            disabled
            onClick={() => setBulkDialogOpen(true)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            Bulk Add
          </Button>

          <Button
            onClick={exportToCSV}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Attendance Records ({totalRecords} total, showing{" "}
            {filteredData.length})
          </CardTitle>
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
                    <th className="py-3 px-4 text-left">Note</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((record) => {
                      const status = getAttendanceStatus(record);
                      return (
                        <tr
                          key={record._id}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={`https://avatar.vercel.sh/${record.username}`}
                                />
                                <AvatarFallback>
                                  {record.displayName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {record.displayName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  @{record.username}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">
                                {new Date(record.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTime(record.createdAt)}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                record.firstHalfPresent
                                  ? "outline"
                                  : "destructive"
                              }
                              className={cn(
                                "bg-transparent",
                                record.firstHalfPresent
                                  ? "text-green-600 border-green-600"
                                  : ""
                              )}
                            >
                              {record.firstHalfPresent ? "Present" : "Absent"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                record.secondHalfPresent
                                  ? "outline"
                                  : "destructive"
                              }
                              className={cn(
                                "bg-transparent",
                                record.secondHalfPresent
                                  ? "text-green-600 border-green-600"
                                  : ""
                              )}
                            >
                              {record.secondHalfPresent ? "Present" : "Absent"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-muted-foreground max-w-[150px] truncate">
                              {record.note || "-"}
                            </p>
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
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 text-center text-muted-foreground"
                      >
                        No attendance records found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({totalRecords} total
                records)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${user.username}`}
                          />
                          <AvatarFallback>
                            {user.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">
                            {user.displayName}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            @{user.username}
                          </span>
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="first-half"
                  checked={formData.firstHalfPresent}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstHalfPresent: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="first-half">First Half Present</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="second-half"
                  checked={formData.secondHalfPresent}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      secondHalfPresent: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="second-half">Second Half Present</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="note-input">Note (Optional)</Label>
              <Input
                id="note-input"
                placeholder="Add a note..."
                value={formData.note}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, note: e.target.value }))
                }
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={saving}
            >
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
              Update attendance record for{" "}
              <strong>{selectedRecord?.displayName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-first-half"
                  checked={formData.firstHalfPresent}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstHalfPresent: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="edit-first-half">First Half Present</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-second-half"
                  checked={formData.secondHalfPresent}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      secondHalfPresent: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="edit-second-half">Second Half Present</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-note-input">Note (Optional)</Label>
              <Input
                id="edit-note-input"
                placeholder="Add a note..."
                value={formData.note}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, note: e.target.value }))
                }
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
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
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {bulkDate ? (
                      format(bulkDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={bulkDate}
                    onSelect={setBulkDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Select Employees</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto mt-1">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-2 py-1"
                  >
                    <Checkbox
                      id={`bulk-user-${user._id}`}
                      checked={bulkUsers.includes(user._id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setBulkUsers((prev) => [...prev, user._id]);
                        } else {
                          setBulkUsers((prev) =>
                            prev.filter((id) => id !== user._id)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`bulk-user-${user._id}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${user.username}`}
                        />
                        <AvatarFallback>
                          {user.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{user.displayName}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          @{user.username}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkUsers(users.map((u) => u._id))}
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
                  onCheckedChange={(checked) =>
                    setBulkFirstHalf(checked as boolean)
                  }
                />
                <Label htmlFor="bulk-first-half">First Half Present</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulk-second-half"
                  checked={bulkSecondHalf}
                  onCheckedChange={(checked) =>
                    setBulkSecondHalf(checked as boolean)
                  }
                />
                <Label htmlFor="bulk-second-half">Second Half Present</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDialogOpen(false)}
              disabled={saving}
            >
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
              Are you sure you want to delete the attendance record for{" "}
              <strong>{selectedRecord?.displayName}</strong> on{" "}
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
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

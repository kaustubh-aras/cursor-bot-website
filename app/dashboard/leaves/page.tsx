// Leave Management Page with CRUD support
"use client";

import { useEffect, useState } from "react";
import {
  CalendarIcon,
  Search,
  Filter,
  Download,
  AlertCircle,
  Trash2,
  Plus,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

interface LeaveRecord {
  _id: string;
  userId: string;
  username: string;
  displayName: string;
  date: string;
  reason: string;
  halfDay: string;
  createdAt: string;
}

export default function LeavesPage() {
  const [leaveData, setLeaveData] = useState<LeaveRecord[]>([]);
  const [filteredData, setFilteredData] = useState<LeaveRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    userId: "",
    username: "",
    displayName: "",
    date: "",
    reason: "",
    halfDay: "",
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const rootPassword = process.env.NEXT_PUBLIC_API_ROOT_PASS;

  const fetchLeaves = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/leaves`);
      const json = await res.json();
      setLeaveData(json.data || []);
      setFilteredData(json.data || []);
    } catch (err) {
      toast.error("Failed to fetch leave data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    let filtered = [...leaveData];
    const todayStr = date ? format(date, "yyyy-MM-dd") : "";
    filtered = filtered.filter((record) => {
      const matchName =
        record.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDate = !date || record.date === todayStr;
      const matchType =
        leaveTypeFilter === "all" || record.halfDay === leaveTypeFilter;
      return matchName && matchDate && matchType;
    });
    setFilteredData(filtered);
  }, [leaveData, searchTerm, date, leaveTypeFilter]);

  const confirmDelete = async () => {
    if (deletePassword !== rootPassword) {
      toast.error("Invalid password");
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/api/leaves/${selectedLeaveId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Leave deleted");
        setDeleteDialogOpen(false);
        setDeletePassword("");
        fetchLeaves();
      } else {
        toast.error(json.error || "Failed to delete");
      }
    } catch {
      toast.error("Error deleting leave.");
    }
  };

  const handleAddLeave = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/leaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLeave),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Leave added successfully.");
        setAddModalOpen(false);
        setNewLeave({
          userId: "",
          username: "",
          displayName: "",
          date: "",
          reason: "",
          halfDay: "",
        });
        fetchLeaves();
      } else {
        toast.error(json.error || "Failed to add leave.");
      }
    } catch {
      toast.error("Error submitting leave.");
    }
  };

  const exportCSV = () => {
    const headers = [
      "Name",
      "Username",
      "Date",
      "Leave Type",
      "Reason",
      "Applied On",
    ];
    const rows = filteredData.map((r) => [
      r.displayName,
      r.username,
      new Date(r.date).toLocaleDateString(),
      r.halfDay === "full" ? "Full Day" : "Half Day",
      `"${r.reason.replace(/"/g, '""')}"`,
      new Date(r.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leaves_${format(date || new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header and Add */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">
            Track and manage employee leave
          </p>
        </div>
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Leave
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Leave</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User ID</Label>
                  <Input
                    value={newLeave.userId}
                    onChange={(e) =>
                      setNewLeave({ ...newLeave, userId: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input
                    value={newLeave.username}
                    onChange={(e) =>
                      setNewLeave({ ...newLeave, username: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Display Name</Label>
                  <Input
                    value={newLeave.displayName}
                    onChange={(e) =>
                      setNewLeave({ ...newLeave, displayName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newLeave.date}
                    onChange={(e) =>
                      setNewLeave({ ...newLeave, date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Reason</Label>
                <Input
                  value={newLeave.reason}
                  onChange={(e) =>
                    setNewLeave({ ...newLeave, reason: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Half Day</Label>
                <Select
                  value={newLeave.halfDay}
                  onValueChange={(val) =>
                    setNewLeave({ ...newLeave, halfDay: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Day</SelectItem>
                    <SelectItem value="first">First Half</SelectItem>
                    <SelectItem value="second">Second Half</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddLeave}>Submit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10 w-64"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} />
            </PopoverContent>
          </Popover>
          <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Leave Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="full">Full Day</SelectItem>
              <SelectItem value="half">Half Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 font-medium">
                  <th className="py-3 px-4 text-left">Employee</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Leave Type</th>
                  <th className="py-3 px-4 text-left">Reason</th>
                  <th className="py-3 px-4 text-left">Applied On</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((r) => (
                    <tr key={r._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={`https://avatar.vercel.sh/${r.username}`}
                            />
                            <AvatarFallback>
                              {r.displayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{r.displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              @{r.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            r.halfDay === "full"
                              ? "destructive"
                              : r.halfDay === "first"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {r.halfDay === "full"
                            ? "Full Day"
                            : r.halfDay === "first"
                            ? "First Half"
                            : "Second Half"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        <div className="flex items-center">
                          <p className="truncate max-w-[200px]">{r.reason}</p>
                          {r.reason.length > 30 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="ml-2 h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{r.reason}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLeaveId(r._id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Admin Password to Delete</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Label>Password</Label>
            <Input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter admin password"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

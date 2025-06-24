// Updated Leave Management Page
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Search,
  Filter,
  Download,
  AlertCircle,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/leaves`);
        const json = await response.json();
        setLeaveData(json.data || []);
        setFilteredData(json.data || []);
      } catch (error) {
        console.error("Failed to fetch leave data:", error);
      } finally {
        setLoading(false);
      }
    };
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
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leaves_${format(date || new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <p className="text-muted-foreground">View and manage leave requests</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 sm:w-64"
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
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
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

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
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
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((record) => (
                    <tr key={record._id} className="border-b hover:bg-muted/50">
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
                            <p className="font-medium">{record.displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              @{record.username}
                            </p>
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
                        <Badge
                          variant={
                            record.halfDay === "full"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {record.halfDay === "full" ? "Full Day" : "Half Day"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        <div className="flex items-center">
                          <p className="truncate max-w-[200px]">
                            {record.reason}
                          </p>
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
                        {new Date(record.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No leave records found for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

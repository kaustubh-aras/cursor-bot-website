"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  Download,
  FileText,
  PieChart,
  Users,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { AttendanceSummaryChart } from "@/components/attendance-summary-chart";
import { LeaveDistributionChart } from "@/components/leave-distribution-chart";
import { EmployeeAttendanceTable } from "@/components/employee-attendance-table";

interface AttendanceData {
  _id: string;
  userId: string;
  username: string;
  displayName: string;
  date: string;
  firstHalfPresent: boolean;
  secondHalfPresent: boolean;
  createdAt: string;
}

interface LeaveData {
  _id: string;
  userId: string;
  username: string;
  displayName: string;
  date: string;
  reason: string;
  halfDay: string;
  createdAt: string;
}

export default function ReportsPage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [leaveData, setLeaveData] = useState<LeaveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [reportType, setReportType] = useState("attendance");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendanceRes, leaveRes] = await Promise.all([
          fetch(`${baseUrl}/api/hr/attendance`),
          fetch(`${baseUrl}/api/leaves`),
        ]);

        const attendanceJson = await attendanceRes.json();
        const leaveJson = await leaveRes.json();

        setAttendanceData(attendanceJson.data || []);
        setLeaveData(leaveJson.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDateRangePreset = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case "today":
        setDateRange({ from: today, to: today });
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case "last7days":
        setDateRange({ from: subDays(today, 6), to: today });
        break;
      case "last30days":
        setDateRange({ from: subDays(today, 29), to: today });
        break;
      case "thisMonth":
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
    }
  };

  const filteredAttendanceData = attendanceData.filter((record) => {
    const recordDate = new Date(record.date);
    return recordDate >= dateRange.from && recordDate <= dateRange.to;
  });

  const filteredLeaveData = leaveData.filter((record) => {
    const recordDate = new Date(record.date);
    return recordDate >= dateRange.from && recordDate <= dateRange.to;
  });

  const exportReport = () => {
    let headers: string[] = [];
    let csvData: string[][] = [];

    if (reportType === "attendance") {
      headers = [
        "Date",
        "Employee",
        "Username",
        "First Half",
        "Second Half",
        "Status",
      ];
      csvData = filteredAttendanceData.map((record) => {
        const status =
          record.firstHalfPresent && record.secondHalfPresent
            ? "Full Day"
            : record.firstHalfPresent || record.secondHalfPresent
            ? "Half Day"
            : "Absent";

        return [
          new Date(record.date).toLocaleDateString(),
          record.displayName,
          record.username,
          record.firstHalfPresent ? "Present" : "Absent",
          record.secondHalfPresent ? "Present" : "Absent",
          status,
        ];
      });
    } else if (reportType === "leaves") {
      headers = ["Date", "Employee", "Username", "Leave Type", "Reason"];
      csvData = filteredLeaveData.map((record) => [
        new Date(record.date).toLocaleDateString(),
        record.displayName,
        record.username,
        record.halfDay === "full" ? "Full Day" : "Half Day",
        `"${record.reason.replace(/"/g, '""')}"`,
      ]);
    } else {
      const employees = new Map();
      filteredAttendanceData.forEach((record) => {
        if (!employees.has(record.userId)) {
          employees.set(record.userId, {
            name: record.displayName,
            username: record.username,
            presentDays: 0,
            halfDays: 0,
            leaveDays: 0,
          });
        }
        const emp = employees.get(record.userId);
        if (record.firstHalfPresent && record.secondHalfPresent) {
          emp.presentDays += 1;
        } else if (record.firstHalfPresent || record.secondHalfPresent) {
          emp.halfDays += 0.5;
          emp.presentDays += 0.5;
        }
      });
      filteredLeaveData.forEach((record) => {
        if (!employees.has(record.userId)) {
          employees.set(record.userId, {
            name: record.displayName,
            username: record.username,
            presentDays: 0,
            halfDays: 0,
            leaveDays: 0,
          });
        }
        const emp = employees.get(record.userId);
        emp.leaveDays += record.halfDay === "full" ? 1 : 0.5;
      });
      headers = [
        "Employee",
        "Username",
        "Present Days",
        "Half Days",
        "Leave Days",
        "Attendance Rate",
      ];
      csvData = Array.from(employees.values()).map((emp: any) => {
        const total = emp.presentDays + emp.leaveDays;
        const rate = total > 0 ? (emp.presentDays / total) * 100 : 0;
        return [
          emp.name,
          emp.username,
          emp.presentDays.toString(),
          emp.halfDays.toString(),
          emp.leaveDays.toString(),
          `${rate.toFixed(1)}%`,
        ];
      });
    }

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportType}_report.csv`);
    link.click();
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and view attendance and leave reports
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select date range and report type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="leaves">Leaves</SelectItem>
                <SelectItem value="summary">Summary</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportReport} className="ml-auto">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="charts">
        <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
          <TabsTrigger value="charts">
            <PieChart className="mr-2 h-4 w-4" /> Charts
          </TabsTrigger>
          <TabsTrigger value="details">
            <FileText className="mr-2 h-4 w-4" /> Detailed View
          </TabsTrigger>
        </TabsList>
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
                <CardDescription>
                  {format(dateRange.from, "MMM d, yyyy")} -{" "}
                  {format(dateRange.to, "MMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceSummaryChart
                  attendanceData={filteredAttendanceData}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Leave Distribution</CardTitle>
                <CardDescription>
                  {format(dateRange.from, "MMM d, yyyy")} -{" "}
                  {format(dateRange.to, "MMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaveDistributionChart leaveData={filteredLeaveData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Employee Attendance Details</CardTitle>
                  <CardDescription>
                    {format(dateRange.from, "MMM d, yyyy")} -{" "}
                    {format(dateRange.to, "MMM d, yyyy")}
                  </CardDescription>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <EmployeeAttendanceTable
                attendanceData={filteredAttendanceData}
                leaveData={filteredLeaveData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

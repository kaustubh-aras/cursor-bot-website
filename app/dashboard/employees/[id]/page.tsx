"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, User, TrendingUp } from "lucide-react";
import { EmployeeAttendanceChart } from "@/components/employee-attendance-chart";
import { EmployeeLeaveHistory } from "@/components/employee-leave-history";

interface EmployeeDetails {
  userId: string;
  username: string;
  displayName: string;
  attendanceRecords: any[];
  leaveRecords: any[];
  stats: {
    totalDays: number;
    presentDays: number;
    leaveDays: number;
    attendanceRate: number;
  };
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        const [attendanceRes, leaveRes, usersRes] = await Promise.all([
          fetch(`${baseUrl}/api/hr/attendance`),
          fetch(`${baseUrl}/api/leaves`),
          fetch(`${baseUrl}/api/hr/users`),
        ]);

        const attendanceJson = await attendanceRes.json();
        const leaveJson = await leaveRes.json();
        const usersJson = await usersRes.json();

        const attendanceData = attendanceJson.data || [];
        const leaveData = leaveJson.data || [];
        const usersData = usersJson.data || [];

        const userId = params.id as string;

        const employeeAttendance = attendanceData.filter(
          (record: any) => record.userId === userId
        );
        const employeeLeaves = leaveData.filter(
          (record: any) => record.userId === userId
        );
        const employeeInfo = usersData.find(
          (user: any) => user.userId === userId
        );

        if (!employeeInfo) {
          setEmployee(null);
          setLoading(false);
          return;
        }

        const totalDays = employeeAttendance.length + employeeLeaves.length;
        const presentDays = employeeAttendance.filter(
          (record: any) => record.firstHalfPresent && record.secondHalfPresent
        ).length;
        const halfDays = employeeAttendance.filter(
          (record: any) =>
            (record.firstHalfPresent && !record.secondHalfPresent) ||
            (!record.firstHalfPresent && record.secondHalfPresent)
        ).length;
        const leaveDays = employeeLeaves.length;
        const attendanceRate =
          totalDays > 0
            ? ((presentDays + halfDays * 0.5) / totalDays) * 100
            : 0;

        setEmployee({
          userId: employeeInfo.userId,
          username: employeeInfo.username,
          displayName: employeeInfo.displayName,
          attendanceRecords: employeeAttendance,
          leaveRecords: employeeLeaves,
          stats: {
            totalDays,
            presentDays: presentDays + halfDays * 0.5,
            leaveDays,
            attendanceRate,
          },
        });
      } catch (error) {
        console.error("Error fetching employee details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEmployeeDetails();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Employee not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The employee you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={`https://avatar.vercel.sh/${employee.username}`}
            />
            <AvatarFallback className="text-lg">
              {employee.displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {employee.displayName}
            </h1>
            <p className="text-muted-foreground">@{employee.username}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employee.stats.totalDays}</div>
            <p className="text-xs text-muted-foreground">
              Attendance + Leave records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Days</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employee.stats.presentDays}
            </div>
            <p className="text-xs text-muted-foreground">Days marked present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Days</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employee.stats.leaveDays}</div>
            <p className="text-xs text-muted-foreground">Total leaves taken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employee.stats.attendanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall attendance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>
              Daily attendance pattern over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeAttendanceChart data={employee.attendanceRecords} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
            <CardDescription>
              Recent leave applications and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeLeaveHistory data={employee.leaveRecords} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

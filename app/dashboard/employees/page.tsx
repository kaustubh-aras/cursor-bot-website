"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Clock, User } from "lucide-react";
import Link from "next/link";
import { startOfMonth, endOfMonth } from "date-fns";

interface User {
  userId: string;
  username: string;
  displayName: string;
  attendanceCount: number;
  leaveCount: number;
  lastSeen: string;
  status: "present" | "absent" | "on-leave";
}

export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const start = startOfMonth(new Date());
  const end = endOfMonth(new Date());

  const fetchAllPaginatedData = async (url: string) => {
    let page = 1;
    const limit = 50;
    let allData: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(`${url}?page=${page}&limit=${limit}`);
      const json = await res.json();
      const data = Array.isArray(json) ? json : json.data || [];

      allData = [...allData, ...data];

      if (json.pagination && json.pagination.pages && page < json.pagination.pages) {
        page++;
      } else {
        hasMore = false;
      }
    }

    return allData;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [usersRes, attendanceData, leaveData] = await Promise.all([
          fetch(`${baseUrl}/api/hr/users`).then(res => res.json()).then(json => json.data || []),
          fetchAllPaginatedData(`${baseUrl}/api/hr/attendance`),
          fetchAllPaginatedData(`${baseUrl}/api/leaves`),
        ]);

        const today = new Date().toISOString().split("T")[0];

        const userMap = new Map<string, User>();

        usersRes.forEach((user: any) => {
          userMap.set(user.userId, {
            userId: user.userId,
            username: user.username,
            displayName: user.displayName,
            attendanceCount: 0,
            leaveCount: 0,
            lastSeen: "-",
            status: "absent",
          });
        });

        attendanceData.forEach((record: any) => {
          const recordDate = new Date(record.date);
          if (recordDate >= start && recordDate <= end) {
            const user = userMap.get(record.userId);
            if (user) {
              if (record.firstHalfPresent && record.secondHalfPresent) {
                user.attendanceCount += 1;
              } else if (record.firstHalfPresent || record.secondHalfPresent) {
                user.attendanceCount += 0.5;
              }

              if (
                record.date === today &&
                record.firstHalfPresent &&
                record.secondHalfPresent
              ) {
                user.status = "present";
              }

              if (
                user.lastSeen === "-" ||
                new Date(record.date) > new Date(user.lastSeen)
              ) {
                user.lastSeen = record.date;
              }
            }
          }
        });

        leaveData.forEach((record: any) => {
          const recordDate = new Date(record.date);
          if (recordDate >= start && recordDate <= end) {
            const user = userMap.get(record.userId);
            if (user) {
              user.leaveCount++;
              if (record.date === today) {
                user.status = "on-leave";
              }
              if (
                user.lastSeen === "-" ||
                new Date(record.date) > new Date(user.lastSeen)
              ) {
                user.lastSeen = record.date;
              }
            }
          }
        });

        const userList = Array.from(userMap.values());
        setUsers(userList);
        setFilteredUsers(userList);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "on-leave":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground">
          Manage and view employee attendance records
        </p>
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
        {filteredUsers.map((user) => (
          <Link key={user.userId} href={`/dashboard/employees/${user.userId}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${user.username}`}
                    />
                    <AvatarFallback>
                      {user.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {user.displayName}
                    </CardTitle>
                    <CardDescription>@{user.username}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(user.status)}>
                    {user.status.replace("-", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">
                      {user.attendanceCount}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Days Present
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{user.leaveCount}</div>
                    <div className="text-xs text-muted-foreground">
                      Leaves Taken
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">
                      {user.lastSeen === "-"
                        ? "-"
                        : new Date(user.lastSeen).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last Seen
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            No users found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}

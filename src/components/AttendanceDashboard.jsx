"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AttendanceDashboard() {
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
        const [attRes, leaveRes] = await Promise.all([
          axios.get(`${baseURL}/api/attendance`),
          axios.get(`${baseURL}/api/leaves`),
        ]);

        setAttendance(attRes.data);
        setLeaves(leaveRes.data);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filterByUsername = (entry) =>
    entry.displayName?.toLowerCase().includes(search.toLowerCase());
  const filteredAttendance = attendance.filter(filterByUsername);
  const filteredLeaves = leaves.filter(filterByUsername);

  function formatDateToDDMMYYYY(dateString) {
    const d = new Date(dateString);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with Title and Sign Out */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Employee Attendance & Leaves</h1>
        <Button variant="destructive" onClick={() => signOut()}>
          Sign Out
        </Button>
      </div>

      {/* Search Input */}
      <Input
        placeholder="Search by Name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Loading/Error State */}
      {loading && (
        <p className="text-center text-gray-500 mt-6">Loading data...</p>
      )}
      {error && (
        <p className="text-center text-red-600 mt-6 font-medium">{error}</p>
      )}

      {/* Tables */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Attendance Table */}
          <Card className="shadow-lg border border-gray-200">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 text-indigo-600">
                Attendance Records
              </h2>
              {filteredAttendance.length === 0 ? (
                <p className="text-gray-600">No attendance records found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendance.map((entry, idx) => (
                      <TableRow key={idx} className="hover:bg-indigo-50">
                        <TableCell>{entry.displayName}</TableCell>
                        <TableCell>
                          {formatDateToDDMMYYYY(entry?.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Leaves Table */}
          <Card className="shadow-lg border border-gray-200">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 text-rose-600">
                Leave Records
              </h2>
              {filteredLeaves.length === 0 ? (
                <p className="text-gray-600">No leave records found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeaves.map((entry, idx) => (
                      <TableRow key={idx} className="hover:bg-rose-50">
                        <TableCell>{entry?.displayName}</TableCell>
                        <TableCell>
                          {formatDateToDDMMYYYY(entry?.createdAt)}
                        </TableCell>
                        <TableCell>{entry?.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

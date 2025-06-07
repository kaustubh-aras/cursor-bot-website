"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface AttendanceRecord {
  date: string
  firstHalfPresent: boolean
  secondHalfPresent: boolean
}

interface EmployeeAttendanceChartProps {
  data: AttendanceRecord[]
}

export function EmployeeAttendanceChart({ data }: EmployeeAttendanceChartProps) {
  const chartData = data
    .map((record) => ({
      date: new Date(record.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      attendance:
        record.firstHalfPresent && record.secondHalfPresent
          ? 1
          : record.firstHalfPresent || record.secondHalfPresent
            ? 0.5
            : 0,
    }))
    .slice(-14) // Last 14 days

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={[0, 1]}
          tickFormatter={(value) => (value === 1 ? "Full" : value === 0.5 ? "Half" : "Absent")}
        />
        <Tooltip
          formatter={(value: number) => [
            value === 1 ? "Full Day" : value === 0.5 ? "Half Day" : "Absent",
            "Attendance",
          ]}
        />
        <Line type="monotone" dataKey="attendance" stroke="#8884d8" strokeWidth={2} dot={{ fill: "#8884d8" }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

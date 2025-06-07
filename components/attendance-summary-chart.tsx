"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface AttendanceData {
  _id: string
  userId: string
  username: string
  displayName: string
  date: string
  firstHalfPresent: boolean
  secondHalfPresent: boolean
  createdAt: string
}

interface AttendanceSummaryChartProps {
  attendanceData: AttendanceData[]
}

export function AttendanceSummaryChart({ attendanceData }: AttendanceSummaryChartProps) {
  // Calculate attendance statistics
  const fullDayCount = attendanceData.filter((record) => record.firstHalfPresent && record.secondHalfPresent).length

  const halfDayCount = attendanceData.filter(
    (record) =>
      (record.firstHalfPresent && !record.secondHalfPresent) || (!record.firstHalfPresent && record.secondHalfPresent),
  ).length

  const absentCount = attendanceData.filter((record) => !record.firstHalfPresent && !record.secondHalfPresent).length

  const data = [
    { name: "Full Day", value: fullDayCount },
    { name: "Half Day", value: halfDayCount },
    { name: "Absent", value: absentCount },
  ].filter((item) => item.value > 0)

  const COLORS = ["#4ade80", "#facc15", "#f87171"]

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">No attendance data available for the selected period</p>
      </div>
    )
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} records`, "Count"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

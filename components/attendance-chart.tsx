"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

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

interface AttendanceChartProps {
  data: AttendanceData[]
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  // Group data by date and count attendance
  const chartData = data.reduce(
    (acc, item) => {
      const date = new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })

      if (!acc[date]) {
        acc[date] = { date, present: 0 }
      }

      if (item.firstHalfPresent && item.secondHalfPresent) {
        acc[date].present += 1
      } else if (item.firstHalfPresent || item.secondHalfPresent) {
        acc[date].present += 0.5
      }

      return acc
    },
    {} as Record<string, { date: string; present: number }>,
  )

  const formattedData = Object.values(chartData).slice(-7) // Last 7 days

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData}>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Line type="monotone" dataKey="present" stroke="#8884d8" strokeWidth={2} dot={{ fill: "#8884d8" }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

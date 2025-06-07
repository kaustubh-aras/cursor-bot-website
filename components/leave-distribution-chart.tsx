"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface LeaveData {
  _id: string
  userId: string
  username: string
  displayName: string
  date: string
  reason: string
  halfDay: string
  createdAt: string
}

interface LeaveDistributionChartProps {
  leaveData: LeaveData[]
}

export function LeaveDistributionChart({ leaveData }: LeaveDistributionChartProps) {
  // Group leaves by employee
  const employeeLeaves = leaveData.reduce(
    (acc, record) => {
      const key = record.displayName
      if (!acc[key]) {
        acc[key] = {
          name: record.displayName,
          value: record.halfDay === "full" ? 1 : 0.5,
        }
      } else {
        acc[key].value += record.halfDay === "full" ? 1 : 0.5
      }
      return acc
    },
    {} as Record<string, { name: string; value: number }>,
  )

  const data = Object.values(employeeLeaves)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00C49F"]

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">No leave data available for the selected period</p>
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
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} days`, "Leave Days"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

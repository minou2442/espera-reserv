"use client"

import type React from "react"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { WaveBackground } from "@/components/wave-background"

interface Slot {
  id: string
  date: string
  time_start: string
  time_end: string
  capacity: number
}

interface Reservation {
  id: string
  user_id: string
  slot_id: string
  created_at: string
  allowed_users: {
    first_name: string
    last_name: string
    email: string
  }
  interview_slots: {
    date: string
    time_start: string
    time_end: string
  }
}

export function AdminDashboardClient({
  slots,
  reservations,
}: {
  slots: Slot[]
  reservations: Reservation[]
}) {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [activeTab, setActiveTab] = useState<"slots" | "reservations">("slots")
  const [showNewSlotForm, setShowNewSlotForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state for new slot
  const [newSlot, setNewSlot] = useState({
    date: "",
    time_start: "",
    time_end: "",
    capacity: "5",
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("interview_slots").insert({
        date: newSlot.date,
        time_start: newSlot.time_start,
        time_end: newSlot.time_end,
        capacity: Number.parseInt(newSlot.capacity),
      })

      if (error) throw error

      setNewSlot({ date: "", time_start: "", time_end: "", capacity: "5" })
      setShowNewSlotForm(false)
      router.refresh()
    } catch (error) {
      console.error("Error adding slot:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure? This will cancel all reservations for this slot.")) return

    try {
      const { error } = await supabase.from("interview_slots").delete().eq("id", slotId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error deleting slot:", error)
    }
  }

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Date", "Time", "Booked At"]
    const rows = reservations.map((r) => [
      `${r.allowed_users.first_name} ${r.allowed_users.last_name}`,
      r.allowed_users.email,
      r.interview_slots.date,
      `${r.interview_slots.time_start} - ${r.interview_slots.time_end}`,
      new Date(r.created_at).toLocaleDateString(),
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reservations-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <WaveBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="ESPERANZA CLUB" className="h-8 w-auto" />
              <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
            >
              Logout
            </Button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-12">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <Button
              variant={activeTab === "slots" ? "default" : "outline"}
              onClick={() => setActiveTab("slots")}
              className={activeTab === "slots" ? "bg-gradient-to-r from-primary to-accent" : ""}
            >
              Interview Slots
            </Button>
            <Button
              variant={activeTab === "reservations" ? "default" : "outline"}
              onClick={() => setActiveTab("reservations")}
              className={activeTab === "reservations" ? "bg-gradient-to-r from-primary to-accent" : ""}
            >
              Reservations ({reservations.length})
            </Button>
          </div>

          {/* Slots Tab */}
          {activeTab === "slots" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">Interview Slots</h2>
                <Button
                  className="bg-gradient-to-r from-primary to-accent"
                  onClick={() => setShowNewSlotForm(!showNewSlotForm)}
                >
                  {showNewSlotForm ? "Cancel" : "Add New Slot"}
                </Button>
              </div>

              {/* New Slot Form */}
              {showNewSlotForm && (
                <Card className="border-primary/50 bg-card/80">
                  <CardHeader>
                    <CardTitle>Add New Slot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddSlot} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newSlot.date}
                          onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                          required
                          className="bg-input border-primary/30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          min="1"
                          value={newSlot.capacity}
                          onChange={(e) => setNewSlot({ ...newSlot, capacity: e.target.value })}
                          className="bg-input border-primary/30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="time_start">Start Time</Label>
                        <Input
                          id="time_start"
                          type="time"
                          value={newSlot.time_start}
                          onChange={(e) => setNewSlot({ ...newSlot, time_start: e.target.value })}
                          required
                          className="bg-input border-primary/30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="time_end">End Time</Label>
                        <Input
                          id="time_end"
                          type="time"
                          value={newSlot.time_end}
                          onChange={(e) => setNewSlot({ ...newSlot, time_end: e.target.value })}
                          required
                          className="bg-input border-primary/30"
                        />
                      </div>

                      <div className="md:col-span-2 flex gap-3">
                        <Button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-primary to-accent"
                          disabled={isLoading}
                        >
                          {isLoading ? "Creating..." : "Create Slot"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Slots List */}
              <div className="grid gap-4">
                {slots.length > 0 ? (
                  slots.map((slot) => {
                    const slotReservations = reservations.filter((r) => r.slot_id === slot.id)
                    const availableSpots = slot.capacity - slotReservations.length

                    return (
                      <Card key={slot.id} className="border-primary/50 bg-card/50">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-2xl font-bold text-foreground">{slot.date}</p>
                              <p className="text-muted-foreground">
                                {slot.time_start} - {slot.time_end}
                              </p>
                              <p className="text-sm mt-2">
                                <span className="text-accent font-semibold">{slotReservations.length}</span>
                                {" / "}
                                <span className="text-muted-foreground">{slot.capacity} booked</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground mb-3">Available</p>
                              <p className="text-3xl font-bold text-accent mb-3">{availableSpots}</p>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteSlot(slot.id)}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <Card className="border-primary/30">
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">No slots created yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Reservations Tab */}
          {activeTab === "reservations" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">All Reservations</h2>
                <Button
                  className="bg-gradient-to-r from-primary to-accent"
                  onClick={handleExportCSV}
                  disabled={reservations.length === 0}
                >
                  Export to CSV
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-primary/30">
                    <tr className="text-left">
                      <th className="py-3 px-4 font-semibold text-foreground">Name</th>
                      <th className="py-3 px-4 font-semibold text-foreground">Email</th>
                      <th className="py-3 px-4 font-semibold text-foreground">Date</th>
                      <th className="py-3 px-4 font-semibold text-foreground">Time</th>
                      <th className="py-3 px-4 font-semibold text-foreground">Booked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.length > 0 ? (
                      reservations.map((reservation) => (
                        <tr
                          key={reservation.id}
                          className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                        >
                          <td className="py-3 px-4">
                            {reservation.allowed_users.first_name} {reservation.allowed_users.last_name}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{reservation.allowed_users.email}</td>
                          <td className="py-3 px-4">{reservation.interview_slots.date}</td>
                          <td className="py-3 px-4">
                            {reservation.interview_slots.time_start} - {reservation.interview_slots.time_end}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">
                            {new Date(reservation.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted-foreground">
                          No reservations yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

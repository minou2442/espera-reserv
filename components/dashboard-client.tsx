"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { WaveBackground } from "@/components/wave-background"

interface Profile {
  id: string
  first_name: string
  last_name: string
  is_admin: boolean
  email: string
}

interface Slot {
  id: string
  date: string
  time_start: string
  time_end: string
  capacity: number
}

export function DashboardClient({
  profile,
  slots,
  reservedSlotIds,
  userId,
}: {
  profile: Profile
  slots: Slot[]
  reservedSlotIds: string[]
  userId: string
}) {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [confirmingSlot, setConfirmingSlot] = useState<Slot | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [slotCapacities, setSlotCapacities] = useState<Record<string, number>>({})

  // Calculate remaining capacity for each slot
  useEffect(() => {
    const calculateCapacities = async () => {
      const capacities: Record<string, number> = {}

      for (const slot of slots) {
        const { count } = await supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("slot_id", slot.id)

        capacities[slot.id] = slot.capacity - (count || 0)
      }

      setSlotCapacities(capacities)
    }

    calculateCapacities()
  }, [slots, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleAdminDashboard = () => {
    if (profile.is_admin) {
      router.push("/admin")
    }
  }

  const handleBookSlot = async () => {
    if (!confirmingSlot) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("reservations").insert({
        user_id: userId,
        slot_id: confirmingSlot.id,
      })

      if (error) throw error

      setSuccessMessage(`Successfully booked slot on ${confirmingSlot.date} at ${confirmingSlot.time_start}`)
      setConfirmingSlot(null)
      setSelectedSlot(null)

      // Refresh the page
      setTimeout(() => router.refresh(), 1500)
    } catch (error) {
      console.error("Error booking slot:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelReservation = async (slotId: string) => {
    try {
      const { error } = await supabase.from("reservations").delete().eq("user_id", userId).eq("slot_id", slotId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error canceling reservation:", error)
    }
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
              <h1 className="text-xl font-bold text-foreground">ESPERANZA CLUB</h1>
            </div>

            <div className="flex items-center gap-4">
              {profile.is_admin && (
                <Button
                  variant="outline"
                  onClick={handleAdminDashboard}
                  className="border-primary/50 text-primary hover:bg-primary/10 bg-transparent"
                >
                  Admin Dashboard
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
              >
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-12">
          {/* Welcome Section */}
          <div className="mb-12 text-center">
            <h2 className="text-5xl font-bold text-foreground mb-2">
              Welcome,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                {profile.first_name}
              </span>
            </h2>
            <p className="text-muted-foreground text-lg">Reserve your interview slot below</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-8 p-4 rounded-lg bg-green-500/10 border border-green-500/50 text-green-400">
              ✓ {successMessage}
            </div>
          )}

          {/* Confirmation Modal */}
          {confirmingSlot && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Card className="w-full max-w-md border-primary/50 bg-card">
                <CardHeader>
                  <CardTitle>Confirm Reservation</CardTitle>
                  <CardDescription>Are you sure you want to book this slot?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="text-lg font-semibold text-foreground">{confirmingSlot.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="text-lg font-semibold text-foreground">
                        {confirmingSlot.time_start} - {confirmingSlot.time_end}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setConfirmingSlot(null)}>
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-primary to-accent"
                      onClick={handleBookSlot}
                      disabled={isLoading}
                    >
                      {isLoading ? "Booking..." : "Confirm"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Slots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots && slots.length > 0 ? (
              slots.map((slot) => {
                const isReserved = reservedSlotIds.includes(slot.id)
                const remainingCapacity = slotCapacities[slot.id] ?? slot.capacity
                const isFull = remainingCapacity <= 0

                return (
                  <Card
                    key={slot.id}
                    className={`border transition-all cursor-pointer ${
                      isReserved
                        ? "border-green-500/50 bg-green-500/5 glow"
                        : isFull
                          ? "border-destructive/30 opacity-50 cursor-not-allowed"
                          : "border-primary/50 hover:border-primary hover:shadow-lg"
                    }`}
                    onClick={() => {
                      if (!isReserved && !isFull) {
                        setSelectedSlot(slot.id)
                        setConfirmingSlot(slot)
                      }
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl">{slot.date}</CardTitle>
                          <CardDescription>
                            {slot.time_start} - {slot.time_end}
                          </CardDescription>
                        </div>
                        {isReserved && (
                          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                            Booked
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Available Spots</p>
                          <p className={`text-2xl font-bold ${isFull ? "text-destructive" : "text-accent"}`}>
                            {Math.max(0, remainingCapacity)}
                          </p>
                        </div>
                        {isReserved && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelReservation(slot.id)
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                        {!isReserved && !isFull && (
                          <Button
                            className="bg-gradient-to-r from-primary to-accent"
                            onClick={(e) => {
                              e.stopPropagation()
                              setConfirmingSlot(slot)
                            }}
                          >
                            Book
                          </Button>
                        )}
                        {isFull && <span className="text-destructive text-sm font-semibold">Full</span>}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card className="col-span-full border-primary/30 bg-card/50">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No interview slots available yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

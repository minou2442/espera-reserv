import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "@/components/dashboard-client"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("allowed_users").select("*").eq("email", user.email).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Fetch available slots
  const { data: slots } = await supabase.from("interview_slots").select("*").order("date", { ascending: true })

  // Fetch user reservations
  const { data: reservations } = await supabase.from("reservations").select("slot_id").eq("user_id", profile.id)

  const reservedSlotIds = reservations?.map((r) => r.slot_id) || []

  return <DashboardClient profile={profile} slots={slots || []} reservedSlotIds={reservedSlotIds} userId={profile.id} />
}

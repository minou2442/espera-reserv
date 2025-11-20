import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminDashboardClient } from "@/components/admin-dashboard-client"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Fetch user profile and check if admin
  const { data: profile } = await supabase.from("allowed_users").select("*").eq("email", user.email).single()

  if (!profile || !profile.is_admin) {
    redirect("/dashboard")
  }

  // Fetch all slots
  const { data: slots } = await supabase.from("interview_slots").select("*").order("date", { ascending: true })

  // Fetch all reservations with user info
  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      "*, allowed_users:user_id(first_name, last_name, email), interview_slots:slot_id(date, time_start, time_end)",
    )
    .order("created_at", { ascending: false })

  return <AdminDashboardClient slots={slots || []} reservations={reservations || []} />
}

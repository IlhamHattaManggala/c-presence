'use server'

import { createClient } from '@supabase/supabase-js'

export async function deleteUserAction(userId: string) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Delete from Auth (This will trigger profile deletion if ON DELETE CASCADE is set)
    // If not, we should delete from DB first or after. 
    // Usually Auth delete is enough if the DB table 'users' is linked to 'auth.users' with cascade.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (authError) {
      return { success: false, error: authError.message }
    }

    // 2. Explicitly delete from public.users just in case cascade is not set
    await supabaseAdmin.from('users').delete().eq('id', userId)

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function bulkImportEmployees(employeesData: any[]) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const results = {
      totalSuccess: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const data of employeesData) {
      try {
        // 1. Invite User by Email (This sends the official Supabase invitation email)
        const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email)

        if (inviteErr) {
          results.failed++
          results.errors.push(`${data.email}: ${inviteErr.message}`)
          continue
        }

        if (inviteData.user) {
          // 2. Insert into public.users
          const { error: dbErr } = await supabaseAdmin.from('users').insert([{
            id: inviteData.user.id,
            email: data.email,
            nik: data.nik,
            full_name: data.full_name,
            position: data.position,
            phone_number: data.phone_number,
            station_id: data.station_id,
            shift_code: data.shift_code,
            role: 'user'
          }])

          if (dbErr) {
            results.failed++
            results.errors.push(`${data.email} (DB): ${dbErr.message}`)
          } else {
            results.totalSuccess++
          }
        }
      } catch (e: any) {
        results.failed++
        results.errors.push(`${data.email}: ${e.message}`)
      }
    }

    return { success: true, ...results }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

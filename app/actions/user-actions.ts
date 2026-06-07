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

    const chunkSize = 20
    for (let i = 0; i < employeesData.length; i += chunkSize) {
      const chunk = employeesData.slice(i, i + chunkSize)
      await Promise.all(chunk.map(async (data) => {
        try {
          // 1. Create Auth User directly (mark email as confirmed)
          const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: 'password123',
            email_confirm: true
          })

          if (authErr) {
            results.failed++
            results.errors.push(`${data.email}: ${authErr.message}`)
            return
          }

          if (authUser.user) {
            // 2. Insert into public.users
            const { error: dbErr } = await supabaseAdmin.from('users').insert([{
              id: authUser.user.id,
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
              // Clean up Auth user if DB insert fails
              await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
            } else {
              results.totalSuccess++
            }
          }
        } catch (e: any) {
          results.failed++
          results.errors.push(`${data.email}: ${e.message}`)
        }
      }))
    }

    return { success: true, ...results }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createUserAction(userData: {
  email: string
  password?: string
  full_name: string
  nik?: string
  role: 'user' | 'admin'
  position?: string
}) {
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

    // 1. Create user in Auth using Admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password || 'password123',
      email_confirm: true
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (authUser.user) {
      // 2. Insert/Upsert user profile in public.users
      const { error: dbError } = await supabaseAdmin.from('users').upsert({
        id: authUser.user.id,
        email: userData.email,
        full_name: userData.full_name,
        nik: userData.nik || null,
        role: userData.role || 'user',
        position: userData.position || null
      }, { onConflict: 'id' })

      if (dbError) {
        // Clean up Auth user if DB insert fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        return { success: false, error: dbError.message }
      }

      return { success: true, user: authUser.user }
    }

    return { success: false, error: 'Gagal membuat user' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function markSpecificNotificationAsReadAction(userId: string, notificationId: string) {
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

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('id', notificationId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}



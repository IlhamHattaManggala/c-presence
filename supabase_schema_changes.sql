-- ==========================================
-- SQL MIGRATION FOR C-PRESENCE KCI REVISIONS
-- Copy and run these queries in your Supabase SQL Editor
-- ==========================================

-- 1. Update users table with Dinasaan start and end times
ALTER TABLE users ADD COLUMN IF NOT EXISTS dinasan_start_time TIME;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dinasan_end_time TIME;

-- 2. Update attendance table with SLA calculation columns
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS nilai_awal_dinas NUMERIC DEFAULT 0;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS nilai_akhir_dinas NUMERIC DEFAULT 0;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS sla_harian NUMERIC DEFAULT 0;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_dinas_luar BOOLEAN DEFAULT FALSE;

-- 3. Update stations table to support custom radius per station
ALTER TABLE stations ADD COLUMN IF NOT EXISTS radius_meters INTEGER DEFAULT 600;

-- 4. Update approval_requests table to store dinas luar attachment URL
ALTER TABLE approval_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- 5. Add is_read column to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 6. Create storage bucket for Dinas Luar evidence photos if not already created
-- Note: You can also create this bucket named 'dinas-luar-evidence' via Supabase Storage dashboard
-- Make sure the bucket is set to 'Public' so the image URLs are accessible.

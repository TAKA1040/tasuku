/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://wgtrffjwdtytqgqybjwx.supabase.co'
// Using service role key for admin operations
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU2OTAxOSwiZXhwIjoyMDczMTQ1MDE5fQ.rACc-PmwtdPpAC63Z8BoJBudMN4YX20-B4601SuFxmY'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSchemaFix() {
  console.log('=== EXECUTING SCHEMA FIX WITH SERVICE ROLE ===\n')

  try {
    // SQL to add missing columns
    const sqlCommands = [
      `-- Add category column to recurring_tasks
       ALTER TABLE recurring_tasks ADD COLUMN IF NOT EXISTS category TEXT;`,

      `-- Add max_occurrences column to recurring_tasks
       ALTER TABLE recurring_tasks ADD COLUMN IF NOT EXISTS max_occurrences INTEGER;`
    ]

    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i].replace(/--.*$/gm, '').trim()
      console.log(`Executing command ${i + 1}:`)
      console.log(sql)

      const { data, error } = await supabase.rpc('exec_sql', { query: sql })

      if (error) {
        console.error(`❌ Command ${i + 1} failed:`, error.message)
        return false
      } else {
        console.log(`✅ Command ${i + 1} executed successfully`)
      }
    }

    // Verify the schema changes
    console.log('\n=== VERIFYING SCHEMA CHANGES ===')

    const { data: verifyData, error: verifyError } = await supabase
      .from('recurring_tasks')
      .select('id, title, category, max_occurrences')
      .limit(1)

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message)
      return false
    } else {
      console.log('✅ Schema verification successful!')
      console.log('   Both category and max_occurrences columns are now accessible')
      return true
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    return false
  }
}

// Also try direct SQL execution if RPC doesn't work
async function directSqlFix() {
  console.log('\n=== TRYING DIRECT SQL EXECUTION ===')

  try {
    // Try using the sql function directly
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          ALTER TABLE recurring_tasks ADD COLUMN IF NOT EXISTS category TEXT;
          ALTER TABLE recurring_tasks ADD COLUMN IF NOT EXISTS max_occurrences INTEGER;
        `
      })

    if (error) {
      console.error('❌ Direct SQL failed:', error.message)
      return false
    } else {
      console.log('✅ Direct SQL execution successful')
      return true
    }
  } catch (err) {
    console.error('❌ Direct SQL error:', err.message)
    return false
  }
}

async function main() {
  const success1 = await executeSchemaFix()

  if (!success1) {
    console.log('\nTrying alternative approach...')
    const success2 = await directSqlFix()

    if (!success2) {
      console.log('\n❌ AUTOMATIC FIX FAILED')
      console.log('Manual intervention required in Supabase Dashboard')
      console.log('\nSQL to execute manually:')
      console.log('ALTER TABLE recurring_tasks ADD COLUMN category TEXT;')
      console.log('ALTER TABLE recurring_tasks ADD COLUMN max_occurrences INTEGER;')
    }
  }

  // Final verification
  console.log('\n=== FINAL VERIFICATION ===')

  const { error: finalError } = await supabase
    .from('recurring_tasks')
    .select('category')
    .limit(0)

  if (finalError) {
    console.log('❌ Category column still missing')
  } else {
    console.log('🎉 SUCCESS: Category column is now available!')
    console.log('   Recurring tasks category functionality is ready')
  }
}

main().catch(console.error)
import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db/postgres-client'
import { requireUserId } from '@/lib/auth/get-user-id'
import { logger } from '@/lib/utils/logger'

interface FuelRecord {
  id: string
  user_id: string
  date: string
  amount: number
  cost: number
  mileage: number
  station: string
  vehicle_id: number
  created_at?: string
  updated_at?: string
}

// 燃費記録一覧取得
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicle_id') || '1'

    logger.info('🎯 API: Getting fuel records for vehicle:', vehicleId)

    const records = await query<FuelRecord>(
      `SELECT * FROM fuel_records
       WHERE user_id = $1 AND vehicle_id = $2
       ORDER BY date DESC`,
      [userId, parseInt(vehicleId, 10)]
    )

    logger.info('✅ API: Retrieved fuel records:', records.length)
    return NextResponse.json({ success: true, data: records })
  } catch (error) {
    logger.error('❌ API: Failed to get fuel records:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

// 燃費記録作成
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const body = await request.json()

    logger.info('🎯 API: Creating fuel record:', body.date, body.station)

    const now = new Date().toISOString()
    const result = await queryOne<FuelRecord>(
      `INSERT INTO fuel_records (
        user_id, date, amount, cost, mileage, station, vehicle_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        userId,
        body.date,
        body.amount,
        body.cost,
        body.mileage,
        body.station,
        body.vehicle_id || 1,
        now,
        now
      ]
    )

    logger.info('✅ API: Fuel record created:', result?.id)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('❌ API: Fuel record creation failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

// 燃費記録更新
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Record ID is required' }, { status: 400 })
    }

    logger.info('🎯 API: Updating fuel record:', id)

    const result = await queryOne<FuelRecord>(
      `UPDATE fuel_records SET
        date = $1, amount = $2, cost = $3, mileage = $4, station = $5, vehicle_id = $6, updated_at = $7
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        updates.date,
        updates.amount,
        updates.cost,
        updates.mileage,
        updates.station,
        updates.vehicle_id || 1,
        new Date().toISOString(),
        id,
        userId
      ]
    )

    if (!result) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
    }

    logger.info('✅ API: Fuel record updated')
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('❌ API: Fuel record update failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

// 燃費記録削除
export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Record ID is required' }, { status: 400 })
    }

    logger.info('🎯 API: Deleting fuel record:', id)

    await query(
      `DELETE FROM fuel_records WHERE id = $1 AND user_id = $2`,
      [id, userId]
    )

    logger.info('✅ API: Fuel record deleted')
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('❌ API: Fuel record deletion failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

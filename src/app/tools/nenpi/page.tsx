'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, TrendingUp, Pencil, Check, X } from 'lucide-react'

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

interface User {
  id: string
  email?: string
}

const DEFAULT_VEHICLE_NAMES = ['車両1', '車両2']

export default function NenpiPage() {
  const [records, setRecords] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null)
  const [stationList, setStationList] = useState<string[]>([])
  const [user, setUser] = useState<User | null>(null)

  // 車両管理
  const [activeVehicle, setActiveVehicle] = useState<number>(1)
  const [vehicleNames, setVehicleNames] = useState<string[]>(DEFAULT_VEHICLE_NAMES)
  const [editingVehicleName, setEditingVehicleName] = useState<number | null>(null)
  const [tempVehicleName, setTempVehicleName] = useState('')

  // デフォルトで今日の日付を設定
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    date: getTodayDate(),
    amount: '',
    cost: '',
    mileage: '',
    station: ''
  })

  const supabase = createClient()

  // 車両名をlocalStorageから読み込み
  useEffect(() => {
    const savedNames = localStorage.getItem('nenpi_vehicle_names')
    if (savedNames) {
      try {
        setVehicleNames(JSON.parse(savedNames))
      } catch {
        setVehicleNames(DEFAULT_VEHICLE_NAMES)
      }
    }
  }, [])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        console.log('🔍 ログイン中のユーザー:', user.email, 'ID:', user.id)
        await fetchRecordsForVehicle(user.id, activeVehicle)
      } else {
        console.log('⚠️ ユーザーがログインしていません')
      }

      setLoading(false)
    }

    checkUser()
  }, [])

  // 車両切替時にデータを再取得
  useEffect(() => {
    if (user) {
      fetchRecordsForVehicle(user.id, activeVehicle)
    }
  }, [activeVehicle, user])

  const fetchRecordsForVehicle = async (userId: string, vehicleId: number) => {
    try {
      const { data, error } = await supabase
        .from('fuel_records')
        .select('*')
        .eq('user_id', userId)
        .eq('vehicle_id', vehicleId)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching records:', error)
      } else {
        console.log(`📊 車両${vehicleId}のレコード数:`, data.length)
        setRecords(data as FuelRecord[])
        const stations = Array.from(new Set(data.map(r => r.station)))
        setStationList(stations)
      }
    } catch (error) {
      console.error('Error in fetchRecords:', error)
    }
  }

  const handleLogin = () => {
    window.location.href = '/login?redirect=/tools/nenpi'
  }

  const fetchRecords = async () => {
    if (!user) return
    await fetchRecordsForVehicle(user.id, activeVehicle)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const payload = {
      user_id: user.id,
      date: formData.date,
      amount: parseFloat(formData.amount),
      cost: parseInt(formData.cost, 10),
      mileage: parseFloat(formData.mileage),
      station: formData.station,
      vehicle_id: activeVehicle
    }

    if (editingRecord) {
      const { error } = await supabase
        .from('fuel_records')
        .update(payload)
        .eq('id', editingRecord.id)

      if (error) {
        alert(`エラー: ${error.message}`)
      } else {
        setEditingRecord(null)
        resetForm()
        fetchRecords()
      }
    } else {
      const { error } = await supabase
        .from('fuel_records')
        .insert(payload)

      if (error) {
        alert(`エラー: ${error.message}`)
      } else {
        resetForm()
        fetchRecords()
      }
    }
  }

  const handleEdit = (record: FuelRecord) => {
    setEditingRecord(record)
    setFormData({
      date: record.date,
      amount: record.amount.toString(),
      cost: record.cost.toString(),
      mileage: record.mileage.toString(),
      station: record.station
    })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('この記録を削除しますか？')) return

    const { error } = await supabase
      .from('fuel_records')
      .delete()
      .eq('id', id)

    if (error) {
      alert(`エラー: ${error.message}`)
    } else {
      fetchRecords()
    }
  }

  const resetForm = () => {
    setFormData({
      date: getTodayDate(),
      amount: '',
      cost: '',
      mileage: '',
      station: ''
    })
    setEditingRecord(null)
  }

  const calculateFuelEfficiency = (index: number): number | null => {
    if (index === records.length - 1) return null
    const current = records[index]
    const previous = records[index + 1]
    const distance = current.mileage - previous.mileage
    if (distance <= 0) return null
    return distance / current.amount
  }

  // 車両名の編集
  const startEditVehicleName = (vehicleIndex: number) => {
    setEditingVehicleName(vehicleIndex)
    setTempVehicleName(vehicleNames[vehicleIndex])
  }

  const saveVehicleName = () => {
    if (editingVehicleName === null) return
    const newNames = [...vehicleNames]
    newNames[editingVehicleName] = tempVehicleName.trim() || DEFAULT_VEHICLE_NAMES[editingVehicleName]
    setVehicleNames(newNames)
    localStorage.setItem('nenpi_vehicle_names', JSON.stringify(newNames))
    setEditingVehicleName(null)
    setTempVehicleName('')
  }

  const cancelEditVehicleName = () => {
    setEditingVehicleName(null)
    setTempVehicleName('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未ログイン時の表示
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f3f4f6',
        padding: '32px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card className="shadow-lg border overflow-hidden" style={{ maxWidth: '500px', width: '100%', backgroundColor: 'white' }}>
          <CardHeader style={{
            background: '#3b82f6',
            padding: '24px'
          }}>
            <CardTitle style={{
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: '600',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <img
                src="/nenpi-icon.png"
                alt="燃費記録"
                style={{ width: '40px', height: '40px' }}
              />
              燃費記録
            </CardTitle>
          </CardHeader>
          <CardContent style={{
            background: 'white',
            padding: '32px',
            textAlign: 'center'
          }}>
            <p style={{
              color: '#6b7280',
              fontSize: '1rem',
              marginBottom: '24px'
            }}>
              燃費記録を利用するにはログインが必要です
            </p>
            <Button
              onClick={handleLogin}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full"
              style={{ fontSize: '1rem', padding: '12px 24px' }}
            >
              🔑 ログインする
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      padding: '32px 16px'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '8px'
          }}>
            <img
              src="/nenpi-icon.png"
              alt="燃費記録"
              style={{ width: '48px', height: '48px' }}
            />
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: 0
            }}>
              燃費記録
            </h1>
          </div>
          <p style={{
            color: '#6b7280',
            fontSize: '1rem',
            fontWeight: '400'
          }}>
            給油記録を管理して燃費を追跡
          </p>
        </div>

        {/* Vehicle Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}>
          {[1, 2].map((vehicleId) => {
            const isActive = activeVehicle === vehicleId
            const isEditing = editingVehicleName === vehicleId - 1

            return (
              <div
                key={vehicleId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: isEditing ? '8px 12px' : '12px 24px',
                  background: isActive ? '#3b82f6' : 'white',
                  color: isActive ? 'white' : '#4b5563',
                  borderRadius: '12px',
                  cursor: isEditing ? 'default' : 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  border: isActive ? 'none' : '2px solid #e5e7eb',
                  boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
                onClick={() => !isEditing && setActiveVehicle(vehicleId)}
              >
                {isEditing ? (
                  <>
                    <Input
                      value={tempVehicleName}
                      onChange={(e) => setTempVehicleName(e.target.value)}
                      style={{
                        width: '120px',
                        height: '32px',
                        fontSize: '0.875rem'
                      }}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveVehicleName()
                        if (e.key === 'Escape') cancelEditVehicleName()
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        saveVehicleName()
                      }}
                      style={{ padding: '4px', minWidth: 'auto' }}
                    >
                      <Check className="w-4 h-4" style={{ color: isActive ? 'white' : '#16a34a' }} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        cancelEditVehicleName()
                      }}
                      style={{ padding: '4px', minWidth: 'auto' }}
                    >
                      <X className="w-4 h-4" style={{ color: isActive ? 'white' : '#dc2626' }} />
                    </Button>
                  </>
                ) : (
                  <>
                    <span>🚗 {vehicleNames[vehicleId - 1]}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditVehicleName(vehicleId - 1)
                      }}
                      style={{
                        padding: '4px',
                        minWidth: 'auto',
                        opacity: 0.7
                      }}
                    >
                      <Pencil className="w-3 h-3" style={{ color: isActive ? 'white' : '#6b7280' }} />
                    </Button>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Input Form */}
        <Card className="shadow-lg border overflow-hidden" style={{ marginBottom: '24px', backgroundColor: 'white' }}>
          <CardHeader style={{
            background: '#3b82f6',
            padding: '20px 24px'
          }}>
            <CardTitle style={{
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {editingRecord ? '✏️ 記録の編集' : `➕ ${vehicleNames[activeVehicle - 1]}の給油記録`}
            </CardTitle>
          </CardHeader>
          <CardContent style={{
            background: 'white',
            padding: '24px'
          }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-gray-700 font-semibold">給油日</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="station" className="text-gray-700 font-semibold">スタンド名</Label>
                  <Input
                    id="station"
                    type="text"
                    list="station-list"
                    value={formData.station}
                    onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                    placeholder="例: ENEOS ○○店"
                    required
                  />
                  <datalist id="station-list">
                    {stationList.map((station) => (
                      <option key={station} value={station} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label htmlFor="amount" className="text-gray-700 font-semibold">給油量 (L)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="例: 40.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cost" className="text-gray-700 font-semibold">金額 (円)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="例: 6500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mileage" className="text-gray-700 font-semibold">走行距離 (km)</Label>
                  <Input
                    id="mileage"
                    type="number"
                    step="0.1"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    placeholder="例: 12345.6"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  {editingRecord ? '更新' : '登録'}
                </Button>
                {editingRecord && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    キャンセル
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Records List */}
        <Card className="shadow-lg border overflow-hidden" style={{ marginBottom: '24px', backgroundColor: 'white' }}>
          <CardHeader style={{
            background: '#64748b',
            padding: '20px 24px'
          }}>
            <CardTitle style={{
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📋 {vehicleNames[activeVehicle - 1]}の給油履歴 <span style={{ opacity: 0.9, fontSize: '1rem', fontWeight: 500 }}>({records.length}件)</span>
            </CardTitle>
          </CardHeader>
          <CardContent style={{
            background: 'white',
            padding: '24px'
          }}>
            {records.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                まだ記録がありません
              </p>
            ) : (
              <div className="space-y-3">
                {records.map((record, index) => {
                  const efficiency = calculateFuelEfficiency(index)
                  const pricePerLiter = record.cost / record.amount

                  return (
                    <div
                      key={record.id}
                      style={{
                        padding: '16px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        marginBottom: '12px',
                        overflow: 'hidden',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          <div style={{ flex: '1', minWidth: '200px' }}>
                            <div style={{
                              marginBottom: '12px',
                              paddingBottom: '12px',
                              borderBottom: '1px solid #f3f4f6'
                            }}>
                              <span style={{
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                color: '#1f2937'
                              }}>
                                {record.date}
                              </span>
                            </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* スタンド名と給油量 - 横並び */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <div style={{
                                flex: '1',
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '8px',
                                background: '#f9fafb',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                              }}>
                                <span style={{ fontWeight: '600', color: '#1f2937' }}>{record.station}</span>
                              </div>
                              <div style={{
                                flex: '1',
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '8px',
                                background: '#f9fafb',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                              }}>
                                <span style={{ color: '#6b7280' }}>給油量</span>
                                <span style={{ fontWeight: '600', color: '#1f2937' }}>{record.amount.toFixed(2)} L</span>
                              </div>
                            </div>

                            {/* 金額と単価 - 横並び */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <div style={{
                                flex: '1',
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '8px',
                                background: '#f9fafb',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                              }}>
                                <span style={{ color: '#6b7280' }}>金額</span>
                                <span style={{ fontWeight: '600', color: '#1f2937' }}>¥{record.cost.toLocaleString()}</span>
                              </div>
                              <div style={{
                                flex: '1',
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '8px',
                                background: '#f9fafb',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                              }}>
                                <span style={{ color: '#6b7280' }}>単価</span>
                                <span style={{ fontWeight: '600', color: '#1f2937' }}>¥{pricePerLiter.toFixed(1)}/L</span>
                              </div>
                            </div>

                            {/* 走行距離 - 1行 */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '8px',
                              background: '#f9fafb',
                              borderRadius: '6px',
                              fontSize: '0.875rem'
                            }}>
                              <span style={{ color: '#6b7280' }}>走行距離</span>
                              <span style={{ fontWeight: '600', color: '#1f2937' }}>{record.mileage.toFixed(1)} km</span>
                            </div>
                          </div>
                          </div>
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(record)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(record.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            {efficiency && (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                background: '#dcfce7',
                                borderRadius: '20px',
                                border: '1px solid #86efac',
                                whiteSpace: 'nowrap'
                              }}>
                                <TrendingUp className="w-4 h-4" style={{ color: '#16a34a' }} />
                                <span style={{
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  color: '#16a34a'
                                }}>
                                  {efficiency.toFixed(2)} km/L
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Summary */}
        {records.length > 0 && (
          <Card className="shadow-lg border overflow-hidden" style={{ marginBottom: '24px', backgroundColor: 'white' }}>
            <CardHeader style={{
              background: '#475569',
              padding: '20px 24px'
            }}>
              <CardTitle style={{
                color: 'white',
                fontSize: '1.25rem',
                fontWeight: '600'
              }}>
                📊 {vehicleNames[activeVehicle - 1]}の統計情報
              </CardTitle>
            </CardHeader>
            <CardContent style={{
              background: 'white',
              padding: '24px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  background: '#f3f4f6',
                  padding: '24px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    fontSize: '2.25rem',
                    fontWeight: '700',
                    color: '#1f2937'
                  }}>
                    {records.length}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginTop: '8px',
                    fontWeight: '500'
                  }}>件の記録</div>
                </div>
                <div style={{
                  background: '#f3f4f6',
                  padding: '24px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    fontSize: '2.25rem',
                    fontWeight: '700',
                    color: '#1f2937'
                  }}>
                    {records.reduce((sum, r) => sum + r.amount, 0).toFixed(0)}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginTop: '8px',
                    fontWeight: '500'
                  }}>総給油量 (L)</div>
                </div>
                <div style={{
                  background: '#f3f4f6',
                  padding: '24px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    fontSize: '2.25rem',
                    fontWeight: '700',
                    color: '#1f2937'
                  }}>
                    ¥{records.reduce((sum, r) => sum + r.cost, 0).toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginTop: '8px',
                    fontWeight: '500'
                  }}>総金額</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Link */}
        <div className="text-center py-6">
          <a
            href="/tools/nenpi/manual"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transition-all"
          >
            📖 使い方マニュアル
          </a>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, TrendingUp, LogIn, Grid3x3 } from 'lucide-react'
import Link from 'next/link'

interface FuelRecord {
  id: string
  user_id: string
  date: string
  amount: number
  cost: number
  mileage: number
  station: string
  created_at?: string
  updated_at?: string
}

export default function NenpiPage() {
  const [records, setRecords] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null)
  const [stationList, setStationList] = useState<string[]>([])

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

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('fuel_records')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching records:', error)
      } else {
        setRecords(data as FuelRecord[])

        // スタンド名リストを作成（重複を除去）
        const stations = Array.from(new Set(data.map(r => r.station)))
        setStationList(stations)
      }
    } catch (error) {
      console.error('Error in fetchRecords:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      date: formData.date,
      amount: parseFloat(formData.amount),
      cost: parseInt(formData.cost, 10),
      mileage: parseFloat(formData.mileage),
      station: formData.station
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⛽</span>
              </div>
              <h1 className="text-2xl font-bold text-white">
                燃費記録
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/tools">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  ツール
                </Button>
              </Link>
              <Link href="/login?redirectTo=/tools/nenpi">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <LogIn className="w-4 h-4 mr-2" />
                  ログイン
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Input Form Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {editingRecord ? '記録を編集' : '新しい給油記録'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-sm font-medium mb-1.5 block">
                    給油日
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="station" className="text-sm font-medium mb-1.5 block">
                    スタンド名
                  </Label>
                  <Input
                    id="station"
                    type="text"
                    list="station-list"
                    value={formData.station}
                    onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                    placeholder="ENEOS ○○店"
                    required
                    className="h-11"
                  />
                  <datalist id="station-list">
                    {stationList.map((station) => (
                      <option key={station} value={station} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <Label htmlFor="amount" className="text-sm font-medium mb-1.5 block">
                    給油量 (L)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="40.5"
                    required
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="cost" className="text-sm font-medium mb-1.5 block">
                    金額 (円)
                  </Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="6500"
                    required
                    className="h-11"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="mileage" className="text-sm font-medium mb-1.5 block">
                    走行距離 (km)
                  </Label>
                  <Input
                    id="mileage"
                    type="number"
                    step="0.1"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    placeholder="12345.6"
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 md:flex-none">
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
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">給油履歴</CardTitle>
              <span className="text-sm text-muted-foreground">
                {records.length}件
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                記録がありません
              </div>
            ) : (
              <div className="divide-y">
                {records.map((record, index) => {
                  const efficiency = calculateFuelEfficiency(index)
                  const pricePerLiter = record.cost / record.amount

                  return (
                    <div key={record.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      {/* Date and Station Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-base">
                            {record.date}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {record.station}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(record)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Data Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                          <div className="text-xs text-blue-700 dark:text-blue-400 mb-0.5">
                            給油量
                          </div>
                          <div className="text-xl font-bold text-blue-900 dark:text-blue-300">
                            {record.amount.toFixed(2)} L
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                          <div className="text-xs text-green-700 dark:text-green-400 mb-0.5">
                            金額
                          </div>
                          <div className="text-xl font-bold text-green-900 dark:text-green-300">
                            ¥{record.cost.toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg">
                          <div className="text-xs text-purple-700 dark:text-purple-400 mb-0.5">
                            単価
                          </div>
                          <div className="text-xl font-bold text-purple-900 dark:text-purple-300">
                            ¥{pricePerLiter.toFixed(1)}/L
                          </div>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg">
                          <div className="text-xs text-orange-700 dark:text-orange-400 mb-0.5">
                            走行距離
                          </div>
                          <div className="text-xl font-bold text-orange-900 dark:text-orange-300">
                            {record.mileage.toFixed(1)} km
                          </div>
                        </div>
                      </div>

                      {/* Fuel Efficiency Badge */}
                      {efficiency && (
                        <div className="inline-flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-full">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-semibold">
                            燃費: {efficiency.toFixed(2)} km/L
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Card */}
        {records.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">統計情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {records.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    件の記録
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {records.reduce((sum, r) => sum + r.amount, 0).toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    総給油量 (L)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ¥{records.reduce((sum, r) => sum + r.cost, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    総金額
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
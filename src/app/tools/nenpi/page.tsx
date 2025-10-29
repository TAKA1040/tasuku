'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, TrendingUp } from 'lucide-react'

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
    setLoading(false)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-1 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4 w-full">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            ⛽ 燃費記録
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg">
            給油記録を管理して燃費を追跡
          </p>
        </div>

        {/* Input Form */}
        <Card className="shadow-lg border-2 border-blue-100 dark:border-blue-900">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 py-4">
            <CardTitle className="text-blue-900 dark:text-blue-100 text-xl md:text-2xl">
              {editingRecord ? '✏️ 記録の編集' : '➕ 新しい給油記録'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label htmlFor="date" className="text-xl md:text-2xl font-bold mb-3 block text-gray-800 dark:text-gray-200">給油日</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="h-16 md:h-20 text-xl md:text-2xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <Label htmlFor="station" className="text-xl md:text-2xl font-bold mb-3 block text-gray-800 dark:text-gray-200">スタンド名</Label>
                  <Input
                    id="station"
                    type="text"
                    list="station-list"
                    value={formData.station}
                    onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                    placeholder="例: ENEOS ○○店"
                    required
                    className="h-16 md:h-20 text-xl md:text-2xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <datalist id="station-list">
                    {stationList.map((station) => (
                      <option key={station} value={station} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label htmlFor="amount" className="text-xl md:text-2xl font-bold mb-3 block text-gray-800 dark:text-gray-200">給油量 (L)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="例: 40.5"
                    required
                    className="h-16 md:h-20 text-xl md:text-2xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <Label htmlFor="cost" className="text-xl md:text-2xl font-bold mb-3 block text-gray-800 dark:text-gray-200">金額 (円)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="例: 6500"
                    required
                    className="h-16 md:h-20 text-xl md:text-2xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <Label htmlFor="mileage" className="text-xl md:text-2xl font-bold mb-3 block text-gray-800 dark:text-gray-200">走行距離 (km)</Label>
                  <Input
                    id="mileage"
                    type="number"
                    step="0.1"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    placeholder="例: 12345.6"
                    required
                    className="h-16 md:h-20 text-xl md:text-2xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-16 md:h-20 text-xl md:text-2xl font-bold shadow-lg">
                  <Plus className="w-6 h-6 mr-2" />
                  {editingRecord ? '更新' : '登録'}
                </Button>
                {editingRecord && (
                  <Button type="button" variant="outline" size="lg" onClick={resetForm} className="h-16 md:h-20 text-xl md:text-2xl border-2">
                    キャンセル
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Records List */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
            <CardTitle className="text-purple-900 dark:text-purple-100">
              📋 給油履歴 ({records.length}件)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                まだ記録がありません
              </p>
            ) : (
              <div className="space-y-2">
                {records.map((record, index) => {
                  const efficiency = calculateFuelEfficiency(index)
                  const pricePerLiter = record.cost / record.amount

                  return (
                    <div
                      key={record.id}
                      className="p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                              {record.date}
                            </span>
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                              {record.station}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                              <div className="text-blue-600 dark:text-blue-400 text-xs mb-1">給油量</div>
                              <div className="font-bold text-blue-900 dark:text-blue-100">{record.amount.toFixed(2)} L</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                              <div className="text-green-600 dark:text-green-400 text-xs mb-1">金額</div>
                              <div className="font-bold text-green-900 dark:text-green-100">¥{record.cost.toLocaleString()}</div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
                              <div className="text-purple-600 dark:text-purple-400 text-xs mb-1">単価</div>
                              <div className="font-bold text-purple-900 dark:text-purple-100">¥{pricePerLiter.toFixed(1)}/L</div>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                              <div className="text-orange-600 dark:text-orange-400 text-xs mb-1">走行距離</div>
                              <div className="font-bold text-orange-900 dark:text-orange-100">{record.mileage.toFixed(1)} km</div>
                            </div>
                          </div>
                          {efficiency && (
                            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full border-2 border-green-300 dark:border-green-700">
                              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-bold text-green-700 dark:text-green-300">
                                燃費: {efficiency.toFixed(2)} km/L
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
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
          <Card className="shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-2 border-indigo-200 dark:border-indigo-800">
            <CardHeader>
              <CardTitle className="text-indigo-900 dark:text-indigo-100">
                📊 統計情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {records.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">件の記録</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {records.reduce((sum, r) => sum + r.amount, 0).toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">総給油量 (L)</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    ¥{records.reduce((sum, r) => sum + r.cost, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">総金額</div>
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

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
    if (!user) return

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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Clean Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">⛽</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
                燃費記録
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fuel Tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Input Form */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {editingRecord ? '記録を編集' : '新規記録'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              給油情報を入力してください
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  給油日
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="h-14 text-base bg-white dark:bg-black border-gray-300 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="station" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  className="h-14 text-base bg-white dark:bg-black border-gray-300 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <datalist id="station-list">
                  {stationList.map((station) => (
                    <option key={station} value={station} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  className="h-14 text-base bg-white dark:bg-black border-gray-300 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  金額 (円)
                </Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="6500"
                  required
                  className="h-14 text-base bg-white dark:bg-black border-gray-300 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="mileage" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  className="h-14 text-base bg-white dark:bg-black border-gray-300 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="h-12 px-8 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium rounded-xl transition-colors"
              >
                {editingRecord ? '更新' : '追加'}
              </Button>
              {editingRecord && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="h-12 px-6 border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  キャンセル
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Records List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              履歴
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {records.length}件
            </span>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
              <p className="text-gray-500 dark:text-gray-400">
                記録がありません
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record, index) => {
                const efficiency = calculateFuelEfficiency(index)
                const pricePerLiter = record.cost / record.amount

                return (
                  <div
                    key={record.id}
                    className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">
                          {record.date}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {record.station}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 uppercase tracking-wide">
                          給油量
                        </div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {record.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          リットル
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1 uppercase tracking-wide">
                          金額
                        </div>
                        <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                          ¥{record.cost.toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          総額
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1 uppercase tracking-wide">
                          単価
                        </div>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          ¥{pricePerLiter.toFixed(1)}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          1リットル
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                        <div className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1 uppercase tracking-wide">
                          走行距離
                        </div>
                        <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                          {record.mileage.toFixed(1)}
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          キロメートル
                        </div>
                      </div>
                    </div>

                    {efficiency && (
                      <div className="mt-4">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl flex items-center gap-3 shadow-lg">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-xs font-medium opacity-90 uppercase tracking-wide">燃費効率</div>
                            <div className="text-2xl font-bold">{efficiency.toFixed(2)} km/L</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Statistics Summary */}
        {records.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              統計
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">総記録数</div>
                <div className="text-3xl font-semibold text-gray-900 dark:text-white">
                  {records.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">総給油量</div>
                <div className="text-3xl font-semibold text-gray-900 dark:text-white">
                  {records.reduce((sum, r) => sum + r.amount, 0).toFixed(0)} L
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">総支出額</div>
                <div className="text-3xl font-semibold text-gray-900 dark:text-white">
                  ¥{records.reduce((sum, r) => sum + r.cost, 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
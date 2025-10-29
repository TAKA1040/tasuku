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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
              ⛽
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                燃費記録
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                給油データの管理と分析
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Input Form */}
        <Card className="shadow-xl border-0 overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
            <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
              {editingRecord ? (
                <>
                  <Edit className="w-6 h-6" />
                  記録を編集
                </>
              ) : (
                <>
                  <Plus className="w-6 h-6" />
                  新規記録を追加
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    給油日
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="h-14 text-lg border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="station" className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
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
                    className="h-14 text-lg border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <datalist id="station-list">
                    {stationList.map((station) => (
                      <option key={station} value={station} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
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
                    className="h-14 text-lg border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost" className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    金額 (円)
                  </Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="6500"
                    required
                    className="h-14 text-lg border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mileage" className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
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
                    className="h-14 text-lg border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {editingRecord ? '更新する' : '記録を追加'}
                </Button>
                {editingRecord && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="h-14 text-lg font-semibold border-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    キャンセル
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Records List */}
        <Card className="shadow-xl border-0 overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-700 dark:to-slate-600 text-white py-5">
            <CardTitle className="text-xl font-bold flex items-center justify-between">
              <span>給油履歴</span>
              <span className="text-sm font-normal bg-white/20 px-3 py-1 rounded-full">
                {records.length}件
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {records.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                  まだ記録がありません
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
                  上のフォームから給油記録を追加しましょう
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record, index) => {
                  const efficiency = calculateFuelEfficiency(index)
                  const pricePerLiter = record.cost / record.amount

                  return (
                    <div
                      key={record.id}
                      className="group relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                            {new Date(record.date).getDate()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-lg">
                              {record.date}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {record.station}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(record)}
                            className="h-9 w-9 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                          >
                            <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                            className="h-9 w-9 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-blue-500/10 dark:bg-blue-500/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wide mb-1">
                            給油量
                          </div>
                          <div className="font-bold text-blue-900 dark:text-blue-100 text-xl">
                            {record.amount.toFixed(2)} <span className="text-sm">L</span>
                          </div>
                        </div>
                        <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <div className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-1">
                            金額
                          </div>
                          <div className="font-bold text-emerald-900 dark:text-emerald-100 text-xl">
                            ¥{record.cost.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-purple-500/10 dark:bg-purple-500/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                          <div className="text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase tracking-wide mb-1">
                            単価
                          </div>
                          <div className="font-bold text-purple-900 dark:text-purple-100 text-xl">
                            ¥{pricePerLiter.toFixed(1)}<span className="text-sm">/L</span>
                          </div>
                        </div>
                        <div className="bg-orange-500/10 dark:bg-orange-500/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                          <div className="text-orange-600 dark:text-orange-400 text-xs font-semibold uppercase tracking-wide mb-1">
                            走行距離
                          </div>
                          <div className="font-bold text-orange-900 dark:text-orange-100 text-xl">
                            {record.mileage.toFixed(1)} <span className="text-sm">km</span>
                          </div>
                        </div>
                      </div>

                      {efficiency && (
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full shadow-lg">
                          <TrendingUp className="w-5 h-5" />
                          <span className="font-bold">
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

        {/* Statistics Summary */}
        {records.length > 0 && (
          <Card className="shadow-xl border-0 overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-7 h-7" />
                統計サマリー
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl hover:bg-white/20 transition-all">
                  <div className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-2">
                    総記録数
                  </div>
                  <div className="text-4xl font-bold mb-1">
                    {records.length}
                  </div>
                  <div className="text-sm opacity-80">
                    件の給油記録
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl hover:bg-white/20 transition-all">
                  <div className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-2">
                    総給油量
                  </div>
                  <div className="text-4xl font-bold mb-1">
                    {records.reduce((sum, r) => sum + r.amount, 0).toFixed(0)}
                  </div>
                  <div className="text-sm opacity-80">
                    リットル
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl hover:bg-white/20 transition-all">
                  <div className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-2">
                    総支出額
                  </div>
                  <div className="text-4xl font-bold mb-1">
                    ¥{records.reduce((sum, r) => sum + r.cost, 0).toLocaleString()}
                  </div>
                  <div className="text-sm opacity-80">
                    累計コスト
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Link */}
        <div className="text-center pb-8 pt-4">
          <a
            href="/tools/nenpi/manual"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl hover:shadow-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 font-semibold transition-all duration-300 hover:-translate-y-1"
          >
            <span className="text-2xl">📖</span>
            <span className="text-lg">使い方マニュアル</span>
          </a>
        </div>
      </div>
    </div>
  )
}

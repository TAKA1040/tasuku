'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Plus, Edit, Trash2, TrendingUp, X } from 'lucide-react'

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

export default function Nenpi2Page() {
  const [records, setRecords] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
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
    setShowForm(true)
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
      date: '',
      amount: '',
      cost: '',
      mileage: '',
      station: ''
    })
    setEditingRecord(null)
    setShowForm(false)
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ⛽ 燃費記録
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            シンプルな給油管理
          </p>
        </div>

        {/* Add Button */}
        {!showForm && (
          <div className="flex justify-center">
            <Button
              onClick={() => setShowForm(true)}
              size="lg"
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              <Plus className="w-5 h-5 mr-2" />
              新しい記録を追加
            </Button>
          </div>
        )}

        {/* Input Form */}
        {showForm && (
          <Card className="p-6 shadow-lg border-2 border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingRecord ? '記録を編集' : '新しい給油記録'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">給油日 *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="station">スタンド名 *</Label>
                  <Input
                    id="station"
                    type="text"
                    value={formData.station}
                    onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                    placeholder="ENEOS ○○店"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">給油量 (L) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="40.5"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cost">金額 (円) *</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="6500"
                    required
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="mileage">走行距離 (km) *</Label>
                  <Input
                    id="mileage"
                    type="number"
                    step="0.1"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    placeholder="12345.6"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  {editingRecord ? '更新' : '登録'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  キャンセル
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Records List */}
        {records.length === 0 ? (
          <Card className="p-12 text-center shadow-lg">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              まだ記録がありません
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              「新しい記録を追加」から始めましょう
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {records.map((record, index) => {
              const efficiency = calculateFuelEfficiency(index)
              const pricePerLiter = record.cost / record.amount

              return (
                <Card
                  key={record.id}
                  className="p-5 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Date and Station */}
                      <div className="flex items-baseline gap-3 mb-3">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {new Date(record.date).toLocaleDateString('ja-JP', {
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {record.station}
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                          <div className="text-gray-600 dark:text-gray-400 text-xs">給油量</div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            {record.amount.toFixed(2)} L
                          </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                          <div className="text-gray-600 dark:text-gray-400 text-xs">金額</div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            ¥{record.cost.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
                          <div className="text-gray-600 dark:text-gray-400 text-xs">単価</div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            ¥{pricePerLiter.toFixed(1)}/L
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                          <div className="text-gray-600 dark:text-gray-400 text-xs">走行距離</div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            {record.mileage.toFixed(1)} km
                          </div>
                        </div>
                      </div>

                      {/* Fuel Efficiency Badge */}
                      {efficiency && (
                        <div className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-4 py-2 rounded-full border border-green-200 dark:border-green-800">
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="font-bold text-green-700 dark:text-green-300">
                            {efficiency.toFixed(2)} km/L
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(record)}
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                        className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Summary Stats */}
        {records.length > 0 && (
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">📊 統計</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {records.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">件の記録</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {records.reduce((sum, r) => sum + r.amount, 0).toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">総給油量 (L)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ¥{records.reduce((sum, r) => sum + r.cost, 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">総金額</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTodayJST } from '@/lib/utils/date-jst'

export default function DebugPage() {
  const [data, setData] = useState<any[]>([])
  const [completedData, setCompletedData] = useState<any[]>([])
  const [doneData, setDoneData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const today = getTodayJST()

      // 今日のタスクを取得
      const { data: todayTasks } = await supabase
        .from('unified_tasks')
        .select('*')
        .eq('due_date', today)
        .order('created_at', { ascending: false })

      // 完了済みタスクを取得
      const { data: completed } = await supabase
        .from('unified_tasks')
        .select('*')
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(20)

      // doneテーブルのデータを取得
      const { data: done } = await supabase
        .from('done')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(20)

      setData(todayTasks || [])
      setCompletedData(completed || [])
      setDoneData(done || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Page - Database Status</h1>

      <h2>Today&apos;s Tasks ({getTodayJST()})</h2>
      <div style={{ marginBottom: '20px', backgroundColor: '#f0f0f0', padding: '10px' }}>
        {data.length === 0 ? (
          <p>No tasks for today</p>
        ) : (
          data.map(task => (
            <div key={task.id} style={{ marginBottom: '10px', padding: '5px', border: '1px solid #ccc' }}>
              <strong>{task.display_number}: {task.title}</strong><br/>
              due_date: {task.due_date}<br/>
              completed: {task.completed ? 'true' : 'false'}<br/>
              completed_at: {task.completed_at || 'null'}<br/>
              recurring_pattern: {task.recurring_pattern || 'null'}<br/>
              task_type: {task.task_type || 'null'}<br/>
              created_at: {task.created_at}
            </div>
          ))
        )}
      </div>

      <h2>Recent Completed Tasks (unified_tasks.completed=true)</h2>
      <div style={{ marginBottom: '20px', backgroundColor: '#e8f5e8', padding: '10px' }}>
        {completedData.length === 0 ? (
          <p>No completed tasks</p>
        ) : (
          completedData.map(task => (
            <div key={task.id} style={{ marginBottom: '10px', padding: '5px', border: '1px solid #ccc' }}>
              <strong>{task.display_number}: {task.title}</strong><br/>
              due_date: {task.due_date}<br/>
              completed_at: {task.completed_at}<br/>
              recurring_pattern: {task.recurring_pattern || 'null'}<br/>
              task_type: {task.task_type || 'null'}
            </div>
          ))
        )}
      </div>

      <h2>Done Table Records</h2>
      <div style={{ marginBottom: '20px', backgroundColor: '#fff8e1', padding: '10px' }}>
        {doneData.length === 0 ? (
          <p>No done records</p>
        ) : (
          doneData.map(record => (
            <div key={record.id} style={{ marginBottom: '10px', padding: '5px', border: '1px solid #ccc' }}>
              <strong>Done ID: {record.id}</strong><br/>
              original_task_id: {record.original_task_id}<br/>
              completed_at: {record.completed_at}<br/>
              original_title: {record.original_title}<br/>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <a href="/today" style={{ color: 'blue', textDecoration: 'underline' }}>
          Back to Today Page
        </a>
      </div>
    </div>
  )
}
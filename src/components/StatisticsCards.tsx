'use client'

import type { StatisticsData } from '@/hooks/useStatistics'

interface StatisticsCardsProps {
  stats: StatisticsData
}

export function StatisticsCards({ stats }: StatisticsCardsProps) {
  const StatCard = ({ title, value, subtitle, color = '#3b82f6' }: {
    title: string
    value: string | number
    subtitle?: string
    color?: string
  }) => (
    <div style={{
      backgroundColor: '#f8fafc',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '140px'
    }}>
      <div style={{ 
        fontSize: '20px', 
        fontWeight: '600',
        color: color,
        minWidth: '40px'
      }}>
        {value}
      </div>
      <div>
        <div style={{ 
          fontSize: '13px', 
          color: '#374151',
          fontWeight: '500',
          lineHeight: '1.2'
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ 
            fontSize: '11px', 
            color: '#6b7280',
            lineHeight: '1.2'
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )

  const ProgressBar = ({ completed, total, label }: {
    completed: number
    total: number
    label: string
  }) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '6px',
        gap: '8px'
      }}>
        <div style={{ 
          fontSize: '12px', 
          color: '#374151',
          minWidth: '80px'
        }}>
          {label}
        </div>
        <div style={{
          flex: 1,
          height: '6px',
          backgroundColor: '#e5e7eb',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            borderRadius: '3px'
          }} />
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: '#6b7280',
          minWidth: '50px',
          textAlign: 'right'
        }}>
          {completed}/{total}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 基本統計カード */}
      <section style={{ marginBottom: '16px' }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#1f2937'
        }}>
          基本統計
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '8px'
        }}>
          <StatCard
            title="総タスク数"
            value={stats.totalTasks}
            subtitle="全期間"
            color="#3b82f6"
          />
          <StatCard
            title="完了率"
            value={`${stats.completionRate}%`}
            subtitle={`${stats.completedTasks}/${stats.totalTasks}`}
            color="#10b981"
          />
          <StatCard
            title="今日のタスク"
            value={stats.todayTotal}
            subtitle={`完了: ${stats.todayCompleted}`}
            color="#f59e0b"
          />
          <StatCard
            title="今日の完了率"
            value={`${stats.todayCompletionRate}%`}
            subtitle={`${stats.todayCompleted}/${stats.todayTotal}`}
            color="#8b5cf6"
          />
        </div>
      </section>

      {/* 緊急度別統計 */}
      <section style={{ marginBottom: '16px' }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#1f2937'
        }}>
          緊急度別統計
        </h2>
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '8px 12px'
        }}>
          {Object.entries(stats.urgencyStats)
            .filter(([_, stat]) => stat.total > 0)
            .map(([urgency, stat]) => (
              <ProgressBar
                key={urgency}
                completed={stat.completed}
                total={stat.total}
                label={urgency}
              />
            ))
          }
        </div>
      </section>

      {/* カテゴリ別統計 */}
      <section style={{ marginBottom: '16px' }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#1f2937'
        }}>
          カテゴリ別統計
        </h2>
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '8px 12px'
        }}>
          {Object.entries(stats.categoryStats)
            .filter(([_, stat]) => stat.total > 0)
            .map(([category, stat]) => (
              <ProgressBar
                key={category}
                completed={stat.completed}
                total={stat.total}
                label={category}
              />
            ))
          }
        </div>
      </section>

      {/* 重要度別統計 */}
      <section style={{ marginBottom: '16px' }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#1f2937'
        }}>
          重要度別統計
        </h2>
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '8px 12px'
        }}>
          {Object.entries(stats.importanceStats)
            .filter(([_, stat]) => stat.total > 0)
            .sort(([a], [b]) => Number(b) - Number(a)) // 重要度の高い順
            .map(([importance, stat]) => (
              <ProgressBar
                key={importance}
                completed={stat.completed}
                total={stat.total}
                label={stat.label}
              />
            ))
          }
        </div>
      </section>

      {/* 繰り返しタスク統計 */}
      {stats.recurringStats.total > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#1f2937'
          }}>
            繰り返しタスク
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '8px'
          }}>
            <StatCard
              title="繰り返しタスク数"
              value={stats.recurringStats.total}
              subtitle="登録済み"
              color="#06b6d4"
            />
            <StatCard
              title="今日完了"
              value={stats.recurringStats.completedToday}
              subtitle="繰り返しタスク"
              color="#10b981"
            />
            <StatCard
              title="今日未完了"
              value={stats.recurringStats.pendingToday}
              subtitle="繰り返しタスク"
              color="#ef4444"
            />
          </div>
        </section>
      )}

      {/* 週間統計 */}
      <section>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#1f2937'
        }}>
          週間アクティビティ（過去7日間）
        </h2>
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '8px 12px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '8px'
          }}>
            {Object.values(stats.weeklyStats).map((day, index) => (
              <div key={day.date} style={{
                textAlign: 'center',
                padding: '4px 2px',
                backgroundColor: day.completed > 0 ? '#dbeafe' : '#f3f4f6'
              }}>
                <div style={{
                  fontSize: '9px',
                  color: '#6b7280',
                  marginBottom: '2px'
                }}>
                  {new Date(day.date).toLocaleDateString('ja-JP', { 
                    day: 'numeric' 
                  })}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {day.completed}
                </div>
              </div>
            ))}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            各日の完了タスク数を表示
          </div>
        </div>
      </section>
    </div>
  )
}
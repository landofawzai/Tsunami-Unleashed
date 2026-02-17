// Calendar Page
// Production calendar with date navigation and upcoming deadlines

'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const ENTRY_BADGES: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  deadline: 'warning',
  milestone: 'success',
  publish_date: 'info',
}

const ENTRY_LABELS: Record<string, string> = {
  deadline: 'Deadline',
  milestone: 'Milestone',
  publish_date: 'Publish Date',
}

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  // Create form state
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newType, setNewType] = useState('deadline')
  const [newDescription, setNewDescription] = useState('')

  const { startDate, endDate } = getMonthRange(year, month)
  const params = new URLSearchParams({ startDate, endDate, limit: '100' })
  const apiUrl = `/api/calendar?${params.toString()}`

  const { data, error } = useSWR(apiUrl, fetcher, { refreshInterval: 30000 })

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
  }
  function goToday() {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !newDate) return
    setCreating(true)
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          date: newDate,
          entryType: newType,
          description: newDescription.trim() || undefined,
        }),
      })
      if (res.ok) {
        setNewTitle('')
        setNewDate('')
        setNewDescription('')
        setShowCreate(false)
        mutate(apiUrl)
      }
    } finally {
      setCreating(false)
    }
  }

  const entries = data?.entries || []
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Group entries by day
  const grouped: Record<string, any[]> = {}
  entries.forEach((entry: any) => {
    const day = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(entry)
  })

  return (
    <div className="calendar-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Production schedule & deadlines</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Entry'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card title="Create Calendar Entry">
          <form onSubmit={handleCreate} className="create-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Entry title..." required />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                  <option value="deadline">Deadline</option>
                  <option value="milestone">Milestone</option>
                  <option value="publish_date">Publish Date</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} placeholder="Optional description..." />
            </div>
            <button type="submit" className="btn-primary" disabled={creating || !newTitle.trim() || !newDate}>
              {creating ? 'Creating...' : 'Create Entry'}
            </button>
          </form>
        </Card>
      )}

      {/* Month Navigation */}
      <div className="month-nav">
        <button className="nav-btn" onClick={prevMonth}>&larr;</button>
        <h2 className="month-title">{monthName}</h2>
        <button className="nav-btn" onClick={nextMonth}>&rarr;</button>
        <button className="today-btn" onClick={goToday}>Today</button>
      </div>

      {/* Calendar Entries */}
      {error ? (
        <Card><p className="error-text">Failed to load calendar</p></Card>
      ) : !data ? (
        <Card>
          <div className="loading"><div className="spinner" /><span>Loading...</span></div>
        </Card>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <p className="empty-text">No entries for {monthName}</p>
        </Card>
      ) : (
        <div className="entries-list">
          {Object.entries(grouped).map(([day, dayEntries]) => (
            <div key={day} className="day-group">
              <div className="day-label">{day}</div>
              <div className="day-entries">
                {dayEntries.map((entry: any) => (
                  <div key={entry.id} className="entry-card">
                    <div className="entry-header">
                      <Badge variant={ENTRY_BADGES[entry.entryType] || 'neutral'} size="sm">
                        {ENTRY_LABELS[entry.entryType] || entry.entryType}
                      </Badge>
                      {entry.isCompleted && <Badge variant="success" size="sm">Done</Badge>}
                    </div>
                    <h4 className="entry-title">{entry.title}</h4>
                    {entry.description && <p className="entry-desc">{entry.description}</p>}
                    {entry.contentItem && (
                      <a href={`/content/${entry.contentItem.id}`} className="entry-link">
                        {entry.contentItem.contentId}: {entry.contentItem.title}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .calendar-page { padding: 2rem; max-width: 900px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .page-subtitle { font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0; }
        .btn-primary {
          background: linear-gradient(135deg, #10b981, #047857); color: white; border: none;
          padding: 0.625rem 1.25rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer;
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .create-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
        .form-group input, .form-group select, .form-group textarea {
          padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; color: #111827;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }

        .month-nav { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .month-title { margin: 0; font-size: 1.25rem; color: #111827; min-width: 200px; text-align: center; }
        .nav-btn {
          background: #f3f4f6; border: 1px solid #d1d5db; width: 36px; height: 36px;
          border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex;
          align-items: center; justify-content: center; color: #374151;
        }
        .nav-btn:hover { background: #e5e7eb; }
        .today-btn {
          background: white; border: 1px solid #10b981; color: #10b981;
          padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.8rem;
          font-weight: 600; cursor: pointer;
        }
        .today-btn:hover { background: #d1fae5; }

        .entries-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .day-group { display: flex; gap: 1.5rem; }
        .day-label {
          font-size: 0.8rem; font-weight: 700; color: #10b981; min-width: 100px;
          padding-top: 0.5rem; text-align: right;
        }
        .day-entries { flex: 1; display: flex; flex-direction: column; gap: 0.75rem; }
        .entry-card {
          background: white; border-radius: 10px; padding: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 3px solid #10b981;
        }
        .entry-header { display: flex; gap: 0.5rem; margin-bottom: 0.375rem; }
        .entry-title { margin: 0 0 0.25rem 0; font-size: 0.95rem; color: #111827; font-weight: 600; }
        .entry-desc { margin: 0 0 0.25rem 0; font-size: 0.8rem; color: #6b7280; }
        .entry-link { font-size: 0.8rem; color: #10b981; text-decoration: none; font-weight: 500; }
        .entry-link:hover { text-decoration: underline; }

        .error-text { color: #991b1b; text-align: center; margin: 0; }
        .empty-text { color: #9ca3af; text-align: center; margin: 0; }
        .loading { display: flex; align-items: center; justify-content: center; gap: 0.75rem; color: #6b7280; }
        .spinner { width: 20px; height: 20px; border: 3px solid #e5e7eb; border-top: 3px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .calendar-page { padding: 1rem; }
          .page-header { flex-direction: column; gap: 1rem; }
          .form-row { grid-template-columns: 1fr; }
          .day-group { flex-direction: column; gap: 0.5rem; }
          .day-label { text-align: left; min-width: auto; }
        }
      `}</style>
    </div>
  )
}

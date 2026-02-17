'use client'

// Contact Directory Page
// Browse, search, and manage contacts

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const CHANNEL_ICONS: Record<string, string> = {
  email: '📧',
  phone: '📱',
  whatsapp: '💬',
  telegram: '✈️',
  signal: '🔒',
}

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContact, setNewContact] = useState({
    name: '', email: '', phone: '', whatsapp: '', telegram: '', signal: '',
    region: '', city: '', country: '', language: 'en', timezone: '', notes: '',
    segmentNames: [] as string[],
  })
  const [addError, setAddError] = useState('')

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (regionFilter) params.set('region', regionFilter)
  if (languageFilter) params.set('language', languageFilter)
  if (segmentFilter) params.set('segment', segmentFilter)

  const { data, error, mutate } = useSWR(
    `/api/contacts?${params.toString()}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const { data: segmentData } = useSWR('/api/segments', fetcher)

  const handleAddContact = async () => {
    if (!newContact.name.trim()) {
      setAddError('Name is required')
      return
    }
    try {
      setAddError('')
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      setShowAddForm(false)
      setNewContact({
        name: '', email: '', phone: '', whatsapp: '', telegram: '', signal: '',
        region: '', city: '', country: '', language: 'en', timezone: '', notes: '',
        segmentNames: [],
      })
      mutate()
    } catch (err: any) {
      setAddError(err.message)
    }
  }

  const toggleSegment = (name: string) => {
    setNewContact((prev) => ({
      ...prev,
      segmentNames: prev.segmentNames.includes(name)
        ? prev.segmentNames.filter((s) => s !== name)
        : [...prev.segmentNames, name],
    }))
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading contacts</h1>
      </div>
    )
  }

  return (
    <div className="contacts-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">Manage your global contact directory</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="add-btn">
          {showAddForm ? 'Cancel' : '+ Add Contact'}
        </button>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <Card title="Add New Contact">
          {addError && <p className="form-error">{addError}</p>}
          <div className="add-form">
            <div className="form-row">
              <div className="form-field">
                <label>Name *</label>
                <input value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} placeholder="Full name" />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input value={newContact.email} onChange={(e) => setNewContact({...newContact, email: e.target.value})} placeholder="email@example.com" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Phone/SMS</label>
                <input value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} placeholder="+1..." />
              </div>
              <div className="form-field">
                <label>WhatsApp</label>
                <input value={newContact.whatsapp} onChange={(e) => setNewContact({...newContact, whatsapp: e.target.value})} placeholder="+1..." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Telegram</label>
                <input value={newContact.telegram} onChange={(e) => setNewContact({...newContact, telegram: e.target.value})} placeholder="@handle" />
              </div>
              <div className="form-field">
                <label>Signal</label>
                <input value={newContact.signal} onChange={(e) => setNewContact({...newContact, signal: e.target.value})} placeholder="+1..." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Region</label>
                <input value={newContact.region} onChange={(e) => setNewContact({...newContact, region: e.target.value})} placeholder="e.g. East Africa" />
              </div>
              <div className="form-field">
                <label>Country</label>
                <input value={newContact.country} onChange={(e) => setNewContact({...newContact, country: e.target.value})} placeholder="e.g. Kenya" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>City</label>
                <input value={newContact.city} onChange={(e) => setNewContact({...newContact, city: e.target.value})} placeholder="e.g. Nairobi" />
              </div>
              <div className="form-field">
                <label>Language</label>
                <select value={newContact.language} onChange={(e) => setNewContact({...newContact, language: e.target.value})}>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="pt">Portuguese</option>
                  <option value="sw">Swahili</option>
                  <option value="ar">Arabic</option>
                  <option value="hi">Hindi</option>
                  <option value="ko">Korean</option>
                  <option value="de">German</option>
                  <option value="tl">Filipino</option>
                  <option value="ja">Japanese</option>
                  <option value="id">Indonesian</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Timezone</label>
                <input value={newContact.timezone} onChange={(e) => setNewContact({...newContact, timezone: e.target.value})} placeholder="e.g. Africa/Nairobi" />
              </div>
              <div className="form-field">
                <label>Notes</label>
                <input value={newContact.notes} onChange={(e) => setNewContact({...newContact, notes: e.target.value})} placeholder="Optional notes" />
              </div>
            </div>
            {segmentData && (
              <div className="form-field">
                <label>Segments</label>
                <div className="segment-checkboxes">
                  {segmentData.segments.map((seg: any) => (
                    <label key={seg.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newContact.segmentNames.includes(seg.name)}
                        onChange={() => toggleSegment(seg.name)}
                      />
                      {seg.name.replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleAddContact} className="save-btn">Save Contact</button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, country..."
          className="search-input"
        />
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="filter-select">
          <option value="">All Regions</option>
          <option value="North America">North America</option>
          <option value="Europe">Europe</option>
          <option value="East Africa">East Africa</option>
          <option value="West Africa">West Africa</option>
          <option value="Southern Africa">Southern Africa</option>
          <option value="Southeast Asia">Southeast Asia</option>
          <option value="South Asia">South Asia</option>
          <option value="Middle East">Middle East</option>
          <option value="South America">South America</option>
          <option value="Central America">Central America</option>
          <option value="East Asia">East Asia</option>
          <option value="Oceania">Oceania</option>
        </select>
        <select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)} className="filter-select">
          <option value="">All Segments</option>
          {segmentData?.segments?.map((seg: any) => (
            <option key={seg.id} value={seg.name}>{seg.name.replace(/_/g, ' ')}</option>
          ))}
        </select>
        {data && (
          <span className="result-count">{data.total} contact{data.total !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Contact List */}
      {!data ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading contacts...</div>
      ) : data.contacts.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            No contacts found.
          </div>
        </Card>
      ) : (
        <div className="contact-grid">
          {data.contacts.map((contact: any) => (
            <Card key={contact.id}>
              <div className="contact-card">
                <div className="contact-top">
                  <h3 className="contact-name">{contact.name}</h3>
                  {!contact.isActive && <Badge variant="neutral" size="sm">Inactive</Badge>}
                </div>
                <div className="contact-location">
                  {[contact.city, contact.country, contact.region].filter(Boolean).join(', ') || 'No location'}
                </div>
                <div className="contact-lang">
                  <Badge variant="info" size="sm">{contact.language}</Badge>
                  {contact.timezone && <span className="tz">{contact.timezone}</span>}
                </div>
                <div className="contact-channels">
                  {contact.email && <span title={contact.email}>{CHANNEL_ICONS.email}</span>}
                  {contact.phone && <span title={contact.phone}>{CHANNEL_ICONS.phone}</span>}
                  {contact.whatsapp && <span title={contact.whatsapp}>{CHANNEL_ICONS.whatsapp}</span>}
                  {contact.telegram && <span title={contact.telegram}>{CHANNEL_ICONS.telegram}</span>}
                  {contact.signal && <span title={contact.signal}>{CHANNEL_ICONS.signal}</span>}
                </div>
                <div className="contact-segments">
                  {contact.segments.map((cs: any) => (
                    <Badge key={cs.segment.name} variant="purple" size="sm">
                      {cs.segment.name.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
                <div className="contact-footer">
                  <span>{contact._count.deliveries} message{contact._count.deliveries !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <style jsx>{`
        .contacts-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .page-subtitle {
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        .add-btn {
          background: #2563eb;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
        }
        .add-btn:hover { background: #1d4ed8; }
        .form-error {
          color: #ef4444;
          font-size: 0.875rem;
          margin: 0 0 0.75rem 0;
        }
        .add-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .form-field label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
        }
        .form-field input, .form-field select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
        }
        .segment-checkboxes {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: #374151;
          text-transform: capitalize;
          cursor: pointer;
        }
        .save-btn {
          background: #10b981;
          color: white;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .save-btn:hover { background: #059669; }
        .filters {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .search-input {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          min-width: 250px;
          flex: 1;
        }
        .filter-select {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
        }
        .result-count {
          font-size: 0.875rem;
          color: #6b7280;
          margin-left: auto;
        }
        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }
        .contact-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .contact-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .contact-name {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .contact-location {
          font-size: 0.8125rem;
          color: #6b7280;
        }
        .contact-lang {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .tz {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .contact-channels {
          display: flex;
          gap: 0.5rem;
          font-size: 1.25rem;
        }
        .contact-segments {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }
        .contact-footer {
          font-size: 0.75rem;
          color: #9ca3af;
          padding-top: 0.25rem;
          border-top: 1px solid #f3f4f6;
        }
        @media (max-width: 640px) {
          .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .form-row { grid-template-columns: 1fr; }
          .contact-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

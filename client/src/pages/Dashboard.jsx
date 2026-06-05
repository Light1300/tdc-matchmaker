import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, logout } from '../lib/auth'
import { fetchProfiles } from '../lib/api'

const STATUS_COLORS = {
  'Active':  { bg: '#f0fdf4', text: '#16a34a', dot: '#16a34a' },
  'On Hold': { bg: '#fffbeb', text: '#d97706', dot: '#d97706' },
}

const JOURNEY_COLORS = {
  'Actively Matching': { bg: '#f0fdf4', text: '#16a34a' },
  'Profile Review':    { bg: '#eff6ff', text: '#1d4ed8' },
  'On Hold':           { bg: '#fffbeb', text: '#d97706' },
  'Match Sent':        { bg: '#fdf4ff', text: '#9333ea' },
  'Introductions Made':{ bg: '#fff1f2', text: '#e11d48' },
}

export default function Dashboard() {
  const navigate  = useNavigate()
  const user      = getUser()

  const [profiles,      setProfiles]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [search,        setSearch]        = useState('')
  const [filterGender,  setFilterGender]  = useState('All')
  const [filterStatus,  setFilterStatus]  = useState('All')

  useEffect(() => {
    if (!user) { navigate('/login'); return }

    fetchProfiles()
      .then(data => { setProfiles(data); setLoading(false) })
      .catch(err  => { setError(err.message); setLoading(false) })
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const customers = profiles.filter(p => {
    const matchSearch = search === '' ||
      `${p.firstName} ${p.lastName} ${p.city} ${p.designation}`
        .toLowerCase().includes(search.toLowerCase())
    const matchGender = filterGender === 'All' || p.gender === filterGender
    const matchStatus = filterStatus === 'All' || p.status === filterStatus
    return matchSearch && matchGender && matchStatus
  })

  const stats = {
    total:  profiles.length,
    active: profiles.filter(p => p.status === 'Active').length,
    male:   profiles.filter(p => p.gender === 'Male').length,
    female: profiles.filter(p => p.gender === 'Female').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>💍</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e', fontFamily: 'Georgia, serif' }}>The Date Crew</span>
          <span style={{ color: '#d1d5db', margin: '0 8px' }}>|</span>
          <span style={{ color: '#6b7280', fontSize: 14 }}>Matchmaker Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#374151' }}>👋 {user?.name}</span>
          <button onClick={handleLogout} style={{ padding: '6px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6b7280' }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Profiles', value: stats.total,  icon: '👥', color: '#6366f1' },
            { label: 'Active Clients', value: stats.active, icon: '✅', color: '#16a34a' },
            { label: 'Male Profiles',  value: stats.male,   icon: '👨', color: '#3b82f6' },
            { label: 'Female Profiles',value: stats.female, icon: '👩', color: '#ec4899' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 700, color: s.color }}>
                    {loading ? '—' : s.value}
                  </p>
                </div>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            placeholder="Search by name, city, role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 220, padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff' }}
          />
          {['All', 'Male', 'Female'].map(g => (
            <button key={g} onClick={() => setFilterGender(g)} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid', borderColor: filterGender === g ? '#ec4899' : '#e5e7eb', background: filterGender === g ? '#fdf2f8' : '#fff', color: filterGender === g ? '#ec4899' : '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>{g}</button>
          ))}
          {['All', 'Active', 'On Hold'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid', borderColor: filterStatus === s ? '#6366f1' : '#e5e7eb', background: filterStatus === s ? '#eef2ff' : '#fff', color: filterStatus === s ? '#6366f1' : '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>{s}</button>
          ))}
          <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 'auto' }}>{customers.length} profiles</span>
        </div>

        {/* Error state */}
        {error && (
          <div style={{ padding: 20, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 14, marginBottom: 20 }}>
            Failed to load profiles: {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
            Loading profiles...
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                  {['Profile', 'Age / City', 'Role', 'Marital Status', 'Status', 'Journey Stage', ''].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                              </tbody>
            </table>
            {customers.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>No profiles match your search.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
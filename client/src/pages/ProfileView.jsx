import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMatches, getScoreLabel } from '../lib/matchingEngine'
// import { , scoreMatch } from '../lib/api'
import { sendMatch, scoreMatch ,generateIntro  } from '../lib/api'
import { generateReason } from '../lib/reasoningEngine'


import profilesRaw from '../data/profiles.json'
const profiles = Array.isArray(profilesRaw) ? profilesRaw : Object.values(profilesRaw)

const fmt = (n) => n ? `₹${(n/100000).toFixed(1)}L/yr` : 'N/A'
const fmtHeight = (cm) => { const ft = Math.floor(cm/30.48); const inch = Math.round((cm/30.48 - ft)*12); return `${ft}'${inch}" (${cm} cm)` }

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #f9fafb' }}>
    <span style={{ width: 180, fontSize: 13, color: '#9ca3af', fontWeight: 500, flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{value || '—'}</span>
  </div>
)

const Section = ({ title, children }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f3f4f6', padding: '24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
    <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#374151', borderBottom: '2px solid #fce7f3', paddingBottom: 10 }}>{title}</h3>
    {children}
  </div>
)

export default function ProfileView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const customer = profiles.find(p => p.id === id)
  const [matches, setMatches] = useState([])
  const [note, setNote] = useState('')
  const [savedNote, setSavedNote] = useState('')
  const [sentMatches, setSentMatches] = useState([])
  const [generatingIntro, setGeneratingIntro] = useState(null)
  const [introText, setIntroText] = useState({})
  const [aiReasons, setAiReasons] = useState({})
  const [showTop, setShowTop] = useState(10)

  useEffect(() => {
    if (!customer) return
    const computed = getMatches(customer, profiles)
    setMatches(computed)
    const savedNote = localStorage.getItem(`note_${id}`) || ''
    setSavedNote(savedNote)
    setNote(savedNote)
    const sent = JSON.parse(localStorage.getItem(`sent_${id}`) || '[]')
    setSentMatches(sent)

    const reasons = {}
computed.forEach(m => {
  if (m.breakdown) {
    reasons[m.id] = generateReason(customer.firstName, m.firstName, m.breakdown)
  }
})
setAiReasons(reasons)
  }, [id])

  if (!customer) return <div style={{ padding: 40, textAlign: 'center' }}>Profile not found.</div>

  const saveNote = () => {
    localStorage.setItem(`note_${id}`, note)
    setSavedNote(note)
    alert('Note saved!')
  }

  const handleSendMatch = async (match) => {
    setGeneratingIntro(match.id)
    try {
      // NEW — what it should be
      const result = await sendMatch(customer, match)
       setIntroText(prev => ({
      ...prev,
      [match.id]: result.customerEmail?.body || 'Email sent successfully.'
    }))

    if (result.sent) {
      console.log(`✅ Emails sent to ${result.customerEmail?.to} and ${result.matchEmail?.to}`)
    } else {
      console.warn('⚠️ Email delivery failed but content was generated:', result.detail)
    }

  } catch (err) {
    setIntroText(prev => ({
      ...prev,
      [match.id]: 'Could not generate or send email. Please try again.'
    }))
    console.error('sendMatch error:', err)
  }
  setGeneratingIntro(null)
}
  const visibleMatches = matches.slice(0, showTop)

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '0 32px', display: 'flex', alignItems: 'center', height: 64, gap: 16 }}>
        <button onClick={() => navigate('/dashboard')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e', fontFamily: 'Georgia, serif' }}>💍 The Date Crew</span>
        <span style={{ color: '#d1d5db' }}>|</span>
        <span style={{ color: '#6b7280', fontSize: 14 }}>{customer.firstName} {customer.lastName} — Profile & Matches</span>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
        {/* Left: Profile */}
        <div>
          {/* Hero Card */}
          <div style={{ background: 'linear-gradient(135deg, #fdf2f8, #f0f9ff)', borderRadius: 20, padding: 28, border: '1px solid #f3f4f6', marginBottom: 20, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <img src={customer.profilePhoto} alt="" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid #ec4899', marginBottom: 14 }} />
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#1a1a2e', fontFamily: 'Georgia, serif' }}>{customer.firstName} {customer.lastName}</h2>
            <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: 14 }}>{customer.designation} at {customer.company}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {[customer.city, customer.religion, customer.maritalStatus].map(tag => (
                <span key={tag} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: '3px 12px', fontSize: 12, color: '#374151' }}>{tag}</span>
              ))}
            </div>
          </div>

          <Section title="Personal Details">
            <InfoRow label="Date of Birth" value={customer.dateOfBirth} />
            <InfoRow label="Age" value={`${customer.age} years`} />
            <InfoRow label="Gender" value={customer.gender} />
            <InfoRow label="Height" value={fmtHeight(customer.height)} />
            <InfoRow label="Country" value={customer.country} />
            <InfoRow label="City" value={customer.city} />
          </Section>

          <Section title="Contact">
            <InfoRow label="Email" value={customer.email} />
            <InfoRow label="Phone" value={customer.phone} />
          </Section>

          <Section title="Professional">
            <InfoRow label="Company" value={customer.company} />
            <InfoRow label="Designation" value={customer.designation} />
            <InfoRow label="Annual Income" value={fmt(customer.income)} />
            <InfoRow label="College" value={customer.college} />
            <InfoRow label="Degree" value={customer.degree} />
          </Section>

          <Section title="Family & Values">
            <InfoRow label="Religion" value={customer.religion} />
            <InfoRow label="Caste" value={customer.caste} />
            <InfoRow label="Marital Status" value={customer.maritalStatus} />
            <InfoRow label="Siblings" value={customer.siblings} />
            <InfoRow label="Family Type" value={customer.familyType} />
            <InfoRow label="Family Values" value={customer.familyValues} />
            <InfoRow label="Manglik" value={customer.manglik} />
          </Section>

          <Section title="Lifestyle & Preferences">
            <InfoRow label="Languages" value={customer.languages?.join(', ')} />
            <InfoRow label="Hobbies" value={customer.hobbies?.join(', ')} />
            <InfoRow label="Diet" value={customer.dietaryPreference} />
            <InfoRow label="Drinking" value={customer.drinkingHabits} />
            <InfoRow label="Smoking" value={customer.smokingHabits} />
            <InfoRow label="Wants Kids" value={customer.wantsKids} />
            <InfoRow label="Open to Relocate" value={customer.openToRelocate} />
            <InfoRow label="Open to Pets" value={customer.openToPets} />
          </Section>

          {/* Notes */}
          <Section title="📝 Matchmaker Notes">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add notes about this client..."
              style={{ width: '100%', minHeight: 100, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'system-ui, sans-serif', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
            />
            <button onClick={saveNote} style={{ marginTop: 10, padding: '8px 20px', background: '#ec4899', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Save Note</button>
          </Section>
        </div>

        {/* Right: Matches */}
        <div>
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f3f4f6', padding: '24px 28px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e', fontFamily: 'Georgia, serif' }}>Suggested Matches</h2>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>{matches.length} candidates scored</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
              {customer.gender === 'Male' ? 'Scored on age, height, income, family views & relocation alignment' : 'Scored on profession fit, income stability, family values & lifestyle compatibility'}
            </p>
          </div>

          {visibleMatches.map((match) => {
            const sl = getScoreLabel(match.matchScore)
            const isSent = sentMatches.includes(match.id)
            const isLoading = generatingIntro === match.id
            const intro = introText[match.id]

            return (
              <div key={match.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1 }}>
                    <img src={match.profilePhoto} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{match.firstName} {match.lastName}</span>
                        <span style={{ background: sl.bg, color: sl.color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{sl.label}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{match.age} yrs · {match.city} · {match.designation} at {match.company}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{match.religion} · {fmtHeight(match.height)} · {fmt(match.income)} · Wants Kids: {match.wantsKids}</div>
                    </div>
                  </div>

                  {/* Score ring */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', border: `3px solid ${sl.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: sl.bg }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: sl.color }}>{match.matchScore}</span>
                    </div>
                    <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>/ 100</span>
                  </div>
                </div>

                {/* AI Reason */}
                {aiReasons[match.id] && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #6366f1', fontSize: 13, color: '#374151', fontStyle: 'italic' }}>
                    🤖 {aiReasons[match.id]}
                  </div>
                )}

                {/* Action */}
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  {!isSent ? (
                    <button
                      onClick={() => handleSendMatch(match)}
                      disabled={isLoading}
                      style={{ padding: '8px 20px', background: isLoading ? '#f9a8d4' : '#ec4899', color: '#fff', border: 'none', borderRadius: 8, cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
                    >
                      {isLoading ? '✨ Generating...' : '💌 Send Match'}
                    </button>
                  ) : (
                    <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>✅ Match Sent</span>
                  )}
                </div>

                {/* Generated intro email */}
                {intro && (
                  <div style={{ marginTop: 14, padding: '16px 20px', background: '#fdf2f8', borderRadius: 10, border: '1px solid #fce7f3' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#ec4899', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>✉️ AI-Generated Intro Email</div>
                    <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{intro}</p>
                  </div>
                )}
              </div>
            )
          })}

          {showTop < matches.length && (
            <button onClick={() => setShowTop(showTop + 10)} style={{ width: '100%', padding: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, cursor: 'pointer', fontSize: 14, color: '#6b7280', marginTop: 8 }}>
              Load more matches ({matches.length - showTop} remaining)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
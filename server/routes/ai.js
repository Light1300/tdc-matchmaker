import dotenv from 'dotenv'
import { Router } from 'express'
import Groq from 'groq-sdk'
import { Resend } from 'resend'
dotenv.config()


const router = Router()

// Groq client 
let _groq
const getGroq = () => {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    console.log('[Groq] ✅ Client initialised')
  }
  return _groq
}



const toEmail = process.env.DEMO_EMAIL || customer.email  // override for demo
let _resend
const getResend = () => {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
    console.log('[Resend] ✅ Client initialised')
  }
  return _resend
}
console.log(`[Resend] API key present: ${!!process.env.RESEND_API_KEY}`)



const kidsScore = (a, b) => {
  if (!a || !b) return 50
  if (a === b) return 100
  const combo = [a, b].sort().join('|')
  if (combo === 'Maybe|Yes') return 65
  if (combo === 'Maybe|No')  return 40
  if (combo === 'No|Yes')    return 10
  return 50
}

const relocateScore = (a, b) => {
  if (!a || !b) return 60
  if (a === b && a === 'Yes')     return 100
  if (a === b && a === 'No')      return 85
  if (a === b && a === 'Maybe')   return 70
  if (a === 'Yes' || b === 'Yes') return 75
  return 55
}

const religionScore    = (a, b) => (!a || !b) ? 60 : a === b ? 100 : 55

const locationScore = (cityA, cityB, countryA, countryB) => {
  if (!cityA || !cityB) return 60
  if (cityA.toLowerCase() === cityB.toLowerCase()) return 100
  if ((countryA || '').toLowerCase() === (countryB || '').toLowerCase()) return 70
  return 40
}

const familyValuesScore = (a, b) => {
  if (!a || !b) return 60
  if (a === b) return 100
  const order = ['Traditional', 'Moderate', 'Progressive']
  const diff = Math.abs(order.indexOf(a) - order.indexOf(b))
  return diff === 1 ? 65 : 30
}

const intentScore = (a, b) => {
  if (!a || !b) return 70
  if (a === b) return 100
  const tier = (v) => {
    if (!v) return 2
    v = v.toLowerCase()
    if (v.includes('casual'))                  return 0
    if (v.includes('long'))                    return 1
    if (v.includes('1') || v.includes('one'))  return 3
    if (v.includes('marriage'))                return 2
    return 1
  }
  const diff = Math.abs(tier(a) - tier(b))
  if (diff === 0) return 100
  if (diff === 1) return 70
  if (diff === 2) return 40
  return 15
}

const lifestyleScore = (a, b) => {
  let s = 0, total = 0
  if (a.dietaryPreference && b.dietaryPreference) {
    total += 40
    if (a.dietaryPreference === b.dietaryPreference) {
      s += 40
    } else {
      const veg = ['Vegetarian', 'Eggetarian']
      s += (veg.includes(a.dietaryPreference) === veg.includes(b.dietaryPreference)) ? 28 : 10
    }
  }
  if (a.drinkingHabits && b.drinkingHabits) {
    total += 35
    if (a.drinkingHabits === b.drinkingHabits) { s += 35 }
    else {
      const both = [a.drinkingHabits, b.drinkingHabits]
      if (both.includes('Never') && both.includes('Occasionally'))  s += 18
      else if (both.includes('Occasionally') && both.includes('Socially')) s += 28
      else s += 8
    }
  }
  if (a.smokingHabits && b.smokingHabits) {
    total += 25
    if (a.smokingHabits === b.smokingHabits) { s += 25 }
    else if (a.smokingHabits === 'Never' || b.smokingHabits === 'Never') s += 5
    else s += 14
  }
  return total > 0 ? Math.round((s / total) * 100) : 60
}

const interestsScore = (ha, hb) => {
  if (!ha?.length || !hb?.length) return 50
  const setA = new Set(ha.map(h => h.toLowerCase()))
  const setB = new Set(hb.map(h => h.toLowerCase()))
  const intersection = [...setA].filter(h => setB.has(h)).length
  const union = new Set([...setA, ...setB]).size
  return Math.round((intersection / union) * 100)
}

const ageScore = (ageA, ageB, genderA) => {
  if (!ageA || !ageB) return 60
  const diff = genderA === 'Male' ? ageA - ageB : ageB - ageA
  if (diff >= 0 && diff <= 5)  return 100
  if (diff > 5  && diff <= 10) return 70
  if (diff < 0  && diff >= -3) return 65
  if (diff < -3 && diff >= -7) return 40
  return 20
}

export const  computeMatchScore = (customer, candidate)=> {
  const weights = {
    children: 0.20, intent: 0.15, family: 0.15, religion: 0.15,
    age: 0.10, location: 0.10, lifestyle: 0.10, interests: 0.05,
  }
  const breakdown = {
    children:  kidsScore(customer.wantsKids, candidate.wantsKids),
    intent:    intentScore(customer.relationshipIntent, candidate.relationshipIntent),
    family:    familyValuesScore(customer.familyValues, candidate.familyValues),
    religion:  religionScore(customer.religion, candidate.religion),
    age:       ageScore(customer.age, candidate.age, customer.gender),
    location:  Math.round(
                 locationScore(customer.city, candidate.city, customer.country, candidate.country) * 0.5
                 + relocateScore(customer.openToRelocate, candidate.openToRelocate) * 0.5
               ),
    lifestyle: lifestyleScore(customer, candidate),
    interests: interestsScore(customer.hobbies, candidate.hobbies),
  }
  const total = Math.round(
    Object.entries(breakdown).reduce((sum, [key, val]) => sum + val * weights[key], 0)
  )
  return { total, breakdown }
}

const scoreLabel = (score) => {
  if (score >= 75) return 'High Potential'
  if (score >= 55) return 'Good Match'
  return 'Low Potential'
}

const fmt = (n) => n ? `₹${(n / 100000).toFixed(1)}L/yr` : 'not disclosed'


// GROQ HELPER

async function callGroq(label, systemPrompt, userPrompt, maxTokens = 500) {
  console.log(`[Groq] ⏳ Calling model for: ${label}`)
  const start = Date.now()
  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt  },
    ],
    max_tokens: maxTokens,
    temperature: 0.75,
  })
  const ms = Date.now() - start
  const tokens = completion.usage?.total_tokens ?? '?'
  console.log(`[Groq] ✅ ${label} — ${ms}ms | ${tokens} tokens`)
  return completion.choices[0].message.content.trim()
}



function breakdownSummary(breakdown) {
  const icons = {
    children: '👶', intent: '💍', family: '🏠', religion: '🙏',
    age: '🎂', location: '📍', lifestyle: '🥗', interests: '🎯'
  }
  return Object.entries(breakdown)
    .map(([k, v]) => `${icons[k]} ${k}: ${v}/100`)
    .join('  |  ')
}

function breakdownTable(breakdown) {
  return Object.entries(breakdown)
    .map(([k, v]) => `    ${k.padEnd(12)} ${v}/100  ${v >= 75 ? '✅' : v >= 55 ? '🟡' : '❌'}`)
    .join('\n')
}

function buildEmailHTML({ matchName, matchDesignation, matchCompany, matchCity, emailBody, score, label, breakdown }) {
  const scoreColor = score >= 75 ? '#16a34a' : score >= 55 ? '#d97706' : '#dc2626'

  const breakdownHTML = Object.entries(breakdown)
    .map(([k, v]) => `
      <div style="display:inline-block;margin:4px 6px;padding:6px 12px;background:#f9fafb;border-radius:20px;font-size:12px;color:#374151;font-family:system-ui,sans-serif;">
        <strong style="text-transform:capitalize;">${k}</strong>:
        <span style="color:${v >= 75 ? '#16a34a' : v >= 55 ? '#d97706' : '#dc2626'};font-weight:600;">${v}</span>
      </div>`
    ).join('')

  const bodyHTML = emailBody
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#1a1a2e;font-family:Georgia,serif;">${line}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#fdf2f8 0%,#f0f9ff 100%);padding:36px 40px 28px;text-align:center;border-bottom:1px solid #fce7f3;">
      <div style="font-size:36px;margin-bottom:8px;">💍</div>
      <div style="font-size:24px;font-weight:700;color:#be185d;letter-spacing:-0.5px;font-family:Georgia,serif;">The Date Crew</div>
      <div style="font-size:13px;color:#9ca3af;margin-top:4px;font-family:system-ui,sans-serif;">Premium Matchmaking · Thoughtfully Curated</div>
    </div>
    <div style="padding:36px 40px 24px;">${bodyHTML}</div>
    <div style="margin:0 40px 28px;padding:22px 26px;background:#fdf2f8;border-radius:14px;border:1px solid #fce7f3;">
      <div style="font-size:11px;font-weight:600;color:#ec4899;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;font-family:system-ui,sans-serif;">✨ Your Suggested Match</div>
      <div style="font-size:19px;font-weight:700;color:#1a1a2e;margin-bottom:4px;font-family:Georgia,serif;">${matchName}</div>
      <div style="font-size:13px;color:#6b7280;font-family:system-ui,sans-serif;">${matchDesignation} · ${matchCompany} · ${matchCity}</div>
      <div style="margin-top:14px;">
        <span style="font-size:26px;font-weight:700;color:${scoreColor};font-family:system-ui,sans-serif;">${score}</span>
        <span style="font-size:13px;color:#9ca3af;font-family:system-ui,sans-serif;margin-left:6px;">/ 100 compatibility</span>
        <span style="margin-left:8px;padding:4px 14px;background:${score >= 75 ? '#f0fdf4' : score >= 55 ? '#fffbeb' : '#fef2f2'};color:${scoreColor};border-radius:20px;font-size:12px;font-weight:600;font-family:system-ui,sans-serif;">${label}</span>
      </div>
    </div>
    <div style="margin:0 40px 32px;">
      <div style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;font-family:system-ui,sans-serif;">Compatibility Breakdown</div>
      <div>${breakdownHTML}</div>
    </div>
    <div style="margin:0 40px 36px;padding:18px 22px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;text-align:center;">
      <p style="font-size:13px;color:#374151;font-family:system-ui,sans-serif;margin:0;">Interested in this introduction? Simply reply to this email or reach out to your matchmaker directly.</p>
    </div>
    <div style="background:#fafafa;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
      <div style="font-size:11px;color:#9ca3af;font-family:system-ui,sans-serif;line-height:1.7;">
        © The Date Crew · This introduction was thoughtfully curated by your personal matchmaker.<br>
        Please contact your matchmaker directly for next steps.
      </div>
    </div>
  </div>
</body>
</html>`
}

router.post('/score-match', async (req, res) => {
  const { customer, match } = req.body
  if (!customer || !match) return res.status(400).json({ error: 'customer and match required' })

  const { total, breakdown } = computeMatchScore(customer, match)
  const label = scoreLabel(total)

  console.log(`\n[score-match] ${customer.firstName} ↔ ${match.firstName}`)
  console.log(`[score-match] Score: ${total}/100 — ${label}`)
  console.log('[score-match] Breakdown:')
  console.log(breakdownTable(breakdown))

  const system = `You are a senior Indian matrimonial matchmaker at The Date Crew.
Write ONE warm sentence (max 20 words) explaining the compatibility.
Reference the strongest 1-2 alignment points from the data.
Return ONLY the sentence. Nothing else.`

  const user = `${customer.firstName} (${customer.age}, ${customer.designation}, ${customer.city})
matched with ${match.firstName} (${match.age}, ${match.designation}, ${match.city})
Score: ${total}/100 — ${label}
Breakdown: ${breakdownSummary(breakdown)}`

  try {
    const reason = await callGroq('score-match reason', system, user, 80)
    console.log(`[score-match] AI reason: "${reason}"`)
    res.json({ total, breakdown, label, reason })
  } catch (err) {
    console.error(`[score-match] Groq failed: ${err.message}`)
    res.json({ total, breakdown, label, reason: null })
  }
})

router.post('/generate-intro', async (req, res) => {
  const { customer, match } = req.body
  if (!customer || !match) return res.status(400).json({ error: 'customer and match required' })

  console.log(`\n[generate-intro] ${customer.firstName} ↔ ${match.firstName}`)

  const { total, breakdown } = computeMatchScore(customer, match)
  const label = scoreLabel(total)

  console.log(`[generate-intro] Score: ${total}/100 — ${label}`)

  const system = `You are a warm, empathetic senior matchmaker at The Date Crew, a premium Indian matrimonial service.
Write a personalised introduction email from the matchmaker to the customer, introducing their potential match.
Tone: warm, human, like a trusted family friend who genuinely cares — not a corporate newsletter.
6-8 lines. No bullet points. Pure flowing prose.
Mention 2-3 specific compatibility reasons grounded in the data.
Sign off as: Warm regards,\nThe Date Crew Team
Return ONLY the email body.`

  const user = `Introduce ${match.firstName} ${match.lastName} to ${customer.firstName} ${customer.lastName}.

${customer.firstName}: ${customer.age} yrs, ${customer.designation} at ${customer.company}, ${customer.city}. Wants kids: ${customer.wantsKids}. Relocate: ${customer.openToRelocate}. Values: ${customer.familyValues}. Diet: ${customer.dietaryPreference}. Hobbies: ${customer.hobbies?.join(', ')}.
${match.firstName}: ${match.age} yrs, ${match.designation} at ${match.company}, ${match.city}. Wants kids: ${match.wantsKids}. Relocate: ${match.openToRelocate}. Values: ${match.familyValues}. Diet: ${match.dietaryPreference}. Hobbies: ${match.hobbies?.join(', ')}.

Score: ${total}/100 (${label})
Breakdown: ${breakdownSummary(breakdown)}`

  try {
    const intro = await callGroq('generate-intro', system, user, 450)
    console.log(`[generate-intro] Email preview generated (${intro.length} chars)`)
    res.json({ intro, score: total, label })
  } catch (err) {
    console.error(`[generate-intro] Groq failed: ${err.message}`)
    res.status(500).json({ error: 'Failed to generate intro', detail: err.message })
  }
})

router.post('/send-match', async (req, res) => {
  const { customer, match } = req.body
  if (!customer || !match) return res.status(400).json({ error: 'customer and match required' })

  console.log('\n============================================================')
  console.log('[send-match] NEW REQUEST')
  console.log(`             Customer : ${customer.firstName} ${customer.lastName} <${customer.email}>`)
  console.log(`             Match    : ${match.firstName} ${match.lastName} <${match.email}>`)
  console.log('============================================================')

  // 1. Score
  const { total, breakdown } = computeMatchScore(customer, match)
  const label = scoreLabel(total)
  const bdSummary = breakdownSummary(breakdown)

  console.log(`[send-match] Score: ${total}/100 — ${label}`)
  console.log('[send-match] Breakdown:')
  console.log(breakdownTable(breakdown))

  const profileSummary = (p) =>
    `${p.age} years old, ${p.designation} at ${p.company}, based in ${p.city}. ` +
    `Income: ${fmt(p.income)}. Religion: ${p.religion}. Family values: ${p.familyValues || 'Moderate'}. ` +
    `Wants kids: ${p.wantsKids}. Open to relocate: ${p.openToRelocate}. ` +
    `Diet: ${p.dietaryPreference || 'N/A'}. Hobbies: ${p.hobbies?.join(', ') || 'N/A'}.`

  // 2. Build prompts
  const system1 = `You are a warm, empathetic senior matchmaker at The Date Crew, a premium Indian matrimonial service.
Write a heartfelt introduction email to a client, introducing them to someone your team has carefully chosen for them.
Tone rules:
- Address them by first name. Warm, personal, like a trusted family friend.
- Acknowledge that finding the right person is a meaningful journey — not transactional.
- Explain WHY this specific person was chosen — name 2-3 concrete compatibility reasons from the data.
- Do NOT be generic. Do NOT say "we think you'll be a great match" without explaining why.
- End with an encouraging, open invitation to share their thoughts.
- Sign off as: Warm regards,\nThe Date Crew Team
- 6-8 lines. Pure prose. No bullet points. No subject line.`

  const user1 = `Write to ${customer.firstName} ${customer.lastName}, introducing ${match.firstName} ${match.lastName}.
About ${customer.firstName}: ${profileSummary(customer)}
About ${match.firstName}: ${profileSummary(match)}
Compatibility score: ${total}/100 — ${label}
What aligns strongly: ${bdSummary}
Write the email to ${customer.firstName} now.`

  const system2 = `You are a warm, empathetic senior matchmaker at The Date Crew, a premium Indian matrimonial service.
Write a heartfelt introduction email to a client, letting them know that someone special has been curated for them.
Tone rules:
- Address them by first name. Warm, personal, like a trusted confidant.
- Make them feel this is a thoughtful, human recommendation — not an algorithm.
- Explain WHY this person was chosen for them specifically — name 2-3 concrete reasons grounded in the data.
- Be emotionally intelligent — acknowledge that this kind of introduction takes courage and care.
- End with a warm, gentle invitation to share whether they'd like to know more.
- Sign off as: Warm regards,\nThe Date Crew Team
- 6-8 lines. Pure prose. No bullet points. No subject line.`

  const user2 = `Write to ${match.firstName} ${match.lastName}, introducing ${customer.firstName} ${customer.lastName}.
About ${match.firstName}: ${profileSummary(match)}
About ${customer.firstName}: ${profileSummary(customer)}
Compatibility score: ${total}/100 — ${label}
What aligns strongly: ${bdSummary}
Write the email to ${match.firstName} now.`

  // 3. Generate both emails in parallel
  console.log('[send-match] ⏳ Generating both emails via Groq (parallel)...')
  let customerEmailBody, matchEmailBody
  try {
    ;[customerEmailBody, matchEmailBody] = await Promise.all([
      callGroq(`email → ${customer.firstName}`, system1, user1, 500),
      callGroq(`email → ${match.firstName}`,    system2, user2, 500),
    ])
    console.log(`[send-match] Both emails generated`)
    console.log(`             → ${customer.firstName}'s email: ${customerEmailBody.length} chars`)
    console.log(`             → ${match.firstName}'s email:    ${matchEmailBody.length} chars`)
    console.log('[send-match] Email preview (first 120 chars):')
    console.log(`             "${customerEmailBody.substring(0, 120).replace(/\n/g, ' ')}..."`)
  } catch (err) {
    console.error(`[send-match] Groq generation failed :::: ${err.message}`)
    return res.status(500).json({ error: 'Failed to generate emails', detail: err.message })
  }

  // 4. Build HTML wrappers
  const customerHTML = buildEmailHTML({
    matchName: `${match.firstName} ${match.lastName}`,
    matchDesignation: match.designation,
    matchCompany: match.company,
    matchCity: match.city,
    emailBody: customerEmailBody,
    score: total, label, breakdown,
  })
  const matchHTML = buildEmailHTML({
    matchName: `${customer.firstName} ${customer.lastName}`,
    matchDesignation: customer.designation,
    matchCompany: customer.company,
    matchCity: customer.city,
    emailBody: matchEmailBody,
    score: total, label, breakdown,
  })

  const subject = `💍 A Thoughtful Introduction from The Date Crew`

  // 5. Send both emails
  console.log('[send-match] ⏳ Sending emails via nodemailer...')
  console.log(`             To #1 : ${customer.email}`)
  console.log(`             To #2 : ${match.email}`)

  try {
    const resend = getResend()
const [res1, res2] = await Promise.all([
  resend.emails.send({
    from: 'The Date Crew <onboarding@resend.dev>',
    to: DEV_EMAIL,
    subject,
    text: customerEmailBody,
    html: customerHTML,
  }),
  resend.emails.send({
    from: 'The Date Crew <onboarding@resend.dev>',
    to: DEV_EMAIL,
    subject,
    text: matchEmailBody,
    html: matchHTML,
  }),
])

if (res1.error || res2.error) {
  throw new Error(res1.error?.message || res2.error?.message)
}

console.log(`[send-match] ✅ BOTH EMAILS SENT`)
console.log(`             id #1 : ${res1.data?.id}`)
console.log(`             id #2 : ${res2.data?.id}`)    

  res.json({
      sent: true,
      score: total,
      label,
      breakdown,
      customerEmail: { to: customer.email, body: customerEmailBody },
      matchEmail:    { to: match.email,    body: matchEmailBody    },
    })


  } catch (err) {
    console.error(`[send-match] Resend   FAILED :::`)
    console.error(`             Error   : ${err.message}`)
    console.error(`             Hint    : Check EMAIL_USER / EMAIL_PASS in .env`)
    console.error(`             Hint    : Gmail needs an App Password, not your login password`)
    console.log('============================================================\n')

    // Still return generated content so the UI can display it
    res.status(500).json({
      sent: false,
      error: 'Email delivery failed',
      detail: err.message,
      hint: 'Check EMAIL_USER / EMAIL_PASS in .env — Gmail requires an App Password',
      score: total,
      label,
      customerEmail: { to: customer.email, body: customerEmailBody },
      matchEmail:    { to: match.email,    body: matchEmailBody    },
    })
  }
})
 

export default router
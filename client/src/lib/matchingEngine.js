// Gender-specific matching logic
// For male customers: match with women who are younger, shorter, earn less, aligned on kids
// For female customers: profession compatibility, relocation, values, income stability

const TECH_ROLES = ['Software Engineer','Senior Software Engineer','Data Scientist','DevOps Engineer','Cloud Architect','Product Manager']
const FINANCE_ROLES = ['Financial Analyst','Investment Banker','Consultant','Business Analyst']
const MGMT_ROLES = ['Marketing Manager','Operations Manager','Sales Manager','HR Manager']


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

const familyValuesScore = (a, b) => {
  if (!a || !b) return 60
  if (a === b) return 100
  const order = ['Traditional', 'Moderate', 'Progressive']
  const diff = Math.abs(order.indexOf(a) - order.indexOf(b))
  return diff === 1 ? 65 : 30
}

const locationScore = (cityA, cityB) => {
  if (!cityA || !cityB) return 60
  return cityA.toLowerCase() === cityB.toLowerCase() ? 100 : 70
}

const lifestyleScore = (a, b) => {
  let s = 0, total = 0
  if (a.dietaryPreference && b.dietaryPreference) {
    total += 40
    if (a.dietaryPreference === b.dietaryPreference) { s += 40 }
    else {
      const veg = ['Vegetarian', 'Eggetarian']
      s += (veg.includes(a.dietaryPreference) === veg.includes(b.dietaryPreference)) ? 28 : 10
    }
  }
  if (a.drinkingHabits && b.drinkingHabits) {
    total += 35
    if (a.drinkingHabits === b.drinkingHabits) { s += 35 }
    else {
      const both = [a.drinkingHabits, b.drinkingHabits]
      if (both.includes('Never') && both.includes('Occasionally')) s += 18
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
const getRoleCategory = (designation) => {
  if (TECH_ROLES.includes(designation)) return 'tech'
  if (FINANCE_ROLES.includes(designation)) return 'finance'
  if (MGMT_ROLES.includes(designation)) return 'management'
  return 'other'
}

const kidsScore = (a, b) => {
  if (a === b) return 100
  if ((a === 'Yes' && b === 'Maybe') || (a === 'Maybe' && b === 'Yes')) return 65
  if ((a === 'No' && b === 'Maybe') || (a === 'Maybe' && b === 'No')) return 40
  return 0 // Yes vs No is a dealbreaker
}

const relocateScore = (a, b) => {
  if (a === 'Yes' || b === 'Yes') return 100
  if (a === 'Maybe' && b === 'Maybe') return 70
  if (a === 'No' && b === 'No') return 85 // both settled — actually fine
  return 55
}

const religionScore = (a, b) => a === b ? 100 : 60

const dietScore = (a, b) => {
  if (a === b) return 100
  if (a === 'Eggetarian' && b === 'Vegetarian') return 75
  if (a === 'Vegetarian' && b === 'Eggetarian') return 75
  return 45
}

// For male customer matching with female pool
const scoreMaleCustomer = (customer, candidate) => {
  let score = 0
  const weights = { age: 20, height: 15, income: 20, kids: 25, relocation: 10, religion: 10 }

  // Age: prefer women younger by 0-5 years
  const ageDiff = customer.age - candidate.age
  if (ageDiff >= 0 && ageDiff <= 5) score += weights.age * 1.0
  else if (ageDiff > 5 && ageDiff <= 10) score += weights.age * 0.6
  else if (ageDiff < 0 && ageDiff >= -2) score += weights.age * 0.7 // slightly older is ok
  else score += weights.age * 0.2

  // Height: prefer shorter
  const heightDiff = customer.height - candidate.height
  if (heightDiff >= 5) score += weights.height * 1.0
  else if (heightDiff >= 0) score += weights.height * 0.8
  else score += weights.height * 0.4

  // Income: prefer earning less
  const incomeRatio = candidate.income / customer.income
  if (incomeRatio <= 0.6) score += weights.income * 1.0
  else if (incomeRatio <= 0.9) score += weights.income * 0.8
  else if (incomeRatio <= 1.1) score += weights.income * 0.5
  else score += weights.income * 0.2

  // Kids views
  score += (kidsScore(customer.wantsKids, candidate.wantsKids) / 100) * weights.kids

  // Relocation
  score += (relocateScore(customer.openToRelocate, candidate.openToRelocate) / 100) * weights.relocation

  // Religion
  score += (religionScore(customer.religion, candidate.religion) / 100) * weights.religion

  return Math.round(score)
}

// For female customer matching with male pool
const scoreFemaleCustomer = (customer, candidate) => {
  let score = 0
  const weights = { profession: 20, income: 20, kids: 20, relocation: 15, values: 15, diet: 10 }

  // Profession compatibility
  const custCat = getRoleCategory(customer.designation)
  const candCat = getRoleCategory(candidate.designation)
  if (custCat === candCat) score += weights.profession * 1.0
  else if ((custCat === 'tech' && candCat === 'finance') || (custCat === 'finance' && candCat === 'tech')) score += weights.profession * 0.8
  else score += weights.profession * 0.5

  // Income: male should earn stable (not necessarily more, but stable)
  const incomeRatio = candidate.income / customer.income
  if (incomeRatio >= 1.0 && incomeRatio <= 2.0) score += weights.income * 1.0
  else if (incomeRatio >= 0.8) score += weights.income * 0.75
  else if (incomeRatio >= 0.6) score += weights.income * 0.5
  else score += weights.income * 0.3

  // Kids alignment
  score += (kidsScore(customer.wantsKids, candidate.wantsKids) / 100) * weights.kids

  // Relocation
  score += (relocateScore(customer.openToRelocate, candidate.openToRelocate) / 100) * weights.relocation

  // Family values alignment
  if (customer.familyValues === candidate.familyValues) score += weights.values * 1.0
  else if (
    (customer.familyValues === 'Moderate' && candidate.familyValues !== 'Moderate') ||
    (candidate.familyValues === 'Moderate')
  ) score += weights.values * 0.6
  else score += weights.values * 0.3

  // Diet compatibility
  score += (dietScore(customer.dietaryPreference, candidate.dietaryPreference) / 100) * weights.diet

  return Math.round(score)
}


export const getMatches = (customer, allProfiles) => {
  const pool = allProfiles.filter(p => p.gender !== customer.gender && p.status === 'Active')

  const scored = pool.map(candidate => {
    // Your existing score calculation
    const score = customer.gender === 'Male'
      ? scoreMaleCustomer(customer, candidate)
      : scoreFemaleCustomer(customer, candidate)

    const label = score >= 75 ? 'High Potential' : score >= 50 ? 'Good Match' : 'Low Potential'
    const color = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'

    // ADD: build breakdown from existing score functions
    const breakdown = {
      children:  kidsScore(candidate.wantsKids, customer.wantsKids),
      intent:    intentScore(candidate.relationshipIntent, customer.relationshipIntent),
      family:    familyValuesScore(candidate.familyValues, customer.familyValues),
      religion:  religionScore(candidate.religion, customer.religion),
      age:       ageScore(customer.age, candidate.age, customer.gender),
      location:  Math.round(
                   locationScore(customer.city, candidate.city) * 0.5 +
                   relocateScore(customer.openToRelocate, candidate.openToRelocate) * 0.5
                 ),
      lifestyle: lifestyleScore(customer, candidate),
      interests: interestsScore(customer.hobbies, candidate.hobbies),
    }

    return { ...candidate, matchScore: score, matchLabel: label, matchColor: color, breakdown }
  })

  return scored.sort((a, b) => b.matchScore - a.matchScore)
}

export const getScoreLabel = (score) => {
  if (score >= 75) return { label: 'High Potential', color: '#16a34a', bg: '#f0fdf4' }
  if (score >= 50) return { label: 'Good Match', color: '#d97706', bg: '#fffbeb' }
  return { label: 'Low Potential', color: '#dc2626', bg: '#fef2f2' }
}
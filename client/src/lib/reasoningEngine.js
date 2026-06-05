// client/src/lib/reasonEngine.js

const LABELS = {
  children:  'views on children',
  intent:    'relationship timeline',
  family:    'family values',
  religion:  'religious beliefs',
  age:       'age compatibility',
  location:  'location & relocation',
  lifestyle: 'lifestyle habits',
  interests: 'shared interests',
}

export function generateReason(customerName, matchName, breakdown) {
  // Find top 2 scoring dimensions
  const sorted = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)

  const strengths = sorted.map(([key]) => LABELS[key])

  // Find any red flags (score < 50)
  const weak = Object.entries(breakdown)
    .filter(([, v]) => v < 50)
    .map(([key]) => LABELS[key])

  const strengthLine = `${customerName} and ${matchName} align strongly on ${strengths[0]} and ${strengths[1]}.`

  const cautionLine = weak.length > 0
    ? ` Worth discussing: ${weak[0]}.`
    : ''

  return strengthLine + cautionLine
}
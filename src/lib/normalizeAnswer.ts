const CURLY_APOSTROPHES = /[\u2018\u2019\u201A\u201B\u2032\u02BC]/g

export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(CURLY_APOSTROPHES, "'").replace(/\s+/g, " ")
}

export function answersMatch(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)
}

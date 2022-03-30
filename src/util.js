

export function isWhiteSpace(str) {
  return ['', '\n'].includes(str.trim())
}

export function isEmptyToken(token) {
  if (token.type && !isWhiteSpace(token.type)) {
    return false
  }
  if (token.name && !isWhiteSpace(token.name)) {
    return false
  }
  if (token.value && !isWhiteSpace(token.value)) {
    return false
  }
  return true
}

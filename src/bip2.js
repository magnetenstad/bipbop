

export function runBip(data) {
  const tokens = lex(data)
  const ast = parseTokens(tokens)
  console.log(JSON.stringify(ast, null, 2))
  // interpret(ast)
}

function lex(data) {
  return data.split('').map((e) => {
    return {type: new Set(), value: e}
  })
}

function parseTokens(tokens) {
  const rulesA = [
    commentSymbolRule,
    commentRule,
    stringRule,
    characterRule,
    wordRule,
    zeroNineRule,
    integerRule,
    floatRule,
    integerWordRule,
  ]
  for (let i = 0; i < rulesA.length; i++) {
    if (rulesA[i](tokens)) {
      i = -1
    }
  }
  while (whitespaceRule(tokens));
  const rulesB = [
    assignmentRule,
    constantAssignmentRule,
    expressionRule,
    parenthesisExpressionRule,
    (tokens) => binaryOperatorExpressionRule(tokens, '*'),
    (tokens) => binaryOperatorExpressionRule(tokens, '/'),
    (tokens) => binaryOperatorExpressionRule(tokens, '+'),
    (tokens) => binaryOperatorExpressionRule(tokens, '-'),
    tupleRule,
    appendTupleRule,
    parenthesisTupleRule,
    functionCallRule,
  ]
  for (let i = 0; i < rulesB.length; i++) {
    if (rulesB[i](tokens)) {
      i = -1
    }
  }
  return tokens
}

function stringRule(tokens) {
  let start = null
  for (const [i, token] of tokens.entries()) {
    if (token.value === '"' &&
        (i === 0 || tokens[i - 1].value !== '\\')) {
      if (start === null) {
        start = i
      } else {
        let end = i
        const token = { type: new Set(['string']) }
        token.value = tokens
          .splice(start, end - start + 1, token)
          .slice(1, end - start)
          .map(t => t.value)
          .join('')
        return true
      }
    }
  }
  if (start !== null) {
    console.error('String is never terminated!')
  }
  return false
}

function commentSymbolRule(tokens) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].value === '-' &&
        tokens[i + 1].value === '-' &&
        tokens[i + 2].value === '-') {
      const token = {
        type: new Set(['symbol.comment']),
        value: '---'
      }
      tokens.splice(i, 3, token)
      return true
    }
  }
  return false
}

function commentRule(tokens) {
  let start = null
  for (const [i, token] of tokens.entries()) {
    if (token.value === '---') {
      if (start === null) {
        start = i
      } else {
        let end = i
        const token = { type: new Set(['comment']) }
        token.value = tokens
          .splice(start, end - start + 1)
          .slice(1, end - start)
          .map(t => t.value)
          .join('')
        return true
      }
    }
  }
  if (start !== null) {
    console.error('Comment is never terminated!')
  }
  return false
}

function zeroNineRule(tokens) {
  for (let token of tokens) {
    if (!token.type.size && token.value.match(/[0-9]/)) {
      token.type.add('integer')
      return true
    }
  }
  return false
}

function integerRule(tokens) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].type.has('integer')
        && tokens[i + 1].type.has('integer')) {
      tokens[i].value += tokens[i + 1].value
      tokens.splice(i + 1, 1)
      return true
    }
  }
  return false
}

function floatRule(tokens) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].type.has('integer')
        && tokens[i + 1].value === '.'
        && tokens[i + 2].type.has('integer')) {
      tokens[i].value += '.' + tokens[i + 2].value
      tokens.splice(i + 1, 2)
      return true
    }
  }
  return false
}

function characterRule(tokens) {
  for (let token of tokens) {
    if (!token.type.size && token.value.match(/[A-Za-z]/)) {
      token.type.add('word')
      return true
    }
  }
  return false
}

function wordRule(tokens) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].type.has('word')
        && tokens[i + 1].type.has('word')) {
      tokens[i].value += tokens[i + 1].value
      tokens.splice(i + 1, 1)
      return true
    }
  }
  return false
}

function integerWordRule(tokens) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].type.has('word')
        && tokens[i + 1].type.has('integer')) {
      tokens[i].value += tokens[i + 1].value
      tokens.splice(i + 1, 1)
      return true
    }
  }
  return false
}

function whitespaceRule(tokens) {
  for (const [i, token] of tokens.entries()) {
    if (['\r', '\n', ' '].includes(token.value)) {
      tokens.splice(i, 1)
      return true
    }
  }
  return false
}

function assignmentRule(tokens) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].type.has('word')
        && tokens[i + 1].value === '=') {
      tokens[i].type.add('assignment')
      tokens.splice(i + 1, 1)
      return true
    }
  }
  return false
}

function constantAssignmentRule(tokens) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].type.has('word')
        && tokens[i + 1].value === ':'
        && tokens[i + 2].value === ':') {
      tokens[i].type.add('assignment.constant')
      tokens.splice(i + 1, 2)
      return true
    }
  }
  return false
}

function expressionRule(tokens) {
  for (let token of tokens) {
    if (!token.type.has('expression') &&
        ['string', 'integer', 'float', 'word', 'function.call']
        .some(e => token.type.has(e))) {
      token.type.add('expression')
      return true
    }
  }
  return false
}

function parenthesisExpressionRule(tokens) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].value === '('
        && tokens[i + 1].type.has('expression')
        && tokens[i + 2].value === ')') {
      tokens[i + 1].type.add('parenthesis')
      tokens.splice(i, 3, tokens[i + 1])
      return true
    }
  }
  return false
}

function binaryOperatorExpressionRule(tokens, operator) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].type.has('expression')
        && tokens[i + 1].value === operator
        && tokens[i + 2].type.has('expression')) {
      tokens[i + 1].type.add('expression')
      tokens[i + 1].children = [tokens[i], tokens[i + 2]]
      tokens.splice(i, 3, tokens[i + 1])
      return true
    }
  }
  return false
}

function tupleRule(tokens) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].type.has('expression')
        && tokens[i + 1].value === ','
        && tokens[i + 2].type.has('expression')) {
      tokens[i + 1].type.add('tuple')
      tokens[i + 1].children = [tokens[i], tokens[i + 2]]
      tokens.splice(i, 3, tokens[i + 1])
      return true
    }
  }
  return false
}

function appendTupleRule(tokens) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].type.has('tuple')
        && tokens[i + 1].value === ','
        && tokens[i + 2].type.has('expression')) {
      tokens[i].children.push(tokens[i + 2])
      tokens.splice(i + 1, 2)
      return true
    }
  }
  return false
}

function parenthesisTupleRule(tokens) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].value === '('
        && tokens[i + 1].type.has('tuple')
        && tokens[i + 2].value === ')') {
      tokens[i + 1].type.add('parenthesis')
      tokens.splice(i, 3, tokens[i + 1])
      return true
    }
  }
  return false
}

function functionCallRule(tokens) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].type.has('word')
        && tokens[i + 1].type.has('parenthesis')) {
      tokens[i].type.add('function.call')
      tokens[i].children = [tokens[i + 1]]
      tokens.splice(i + 1, 1)
      return true
    }
  }
  return false
}

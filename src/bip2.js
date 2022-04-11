

export function runBip(data) {
  const tokens = lex(data)
  const ast = parseTokens(tokens)

  convertToArrays(ast)
  console.log(JSON.stringify(ast, null, 2))
  // interpret(ast)
}

function convertToArrays(ast) {
  for (let token of ast) {
    token.type = new Array(...token.type)
    if (token.children) {
      convertToArrays(token.children)
    }
  }
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
    booleanRule,
    zeroNineRule,
    intRule,
    floatRule,
    intWordRule,
    typeRule,
  ]
  for (let i = 0; i < rulesA.length; i++) {
    if (rulesA[i](tokens)) {
      i = -1
    }
  }
  while (whitespaceRule(tokens));
  const rulesB = [
    typeWordRule,
    tupleBaseRule,
    tupleRule,
    functionInterfaceRule,
    expressionRule,
    parenthesisExpressionRule,
    (tokens) => binaryOperatorExpressionRule(tokens, '*'),
    (tokens) => binaryOperatorExpressionRule(tokens, '/'),
    (tokens) => binaryOperatorExpressionRule(tokens, '+'),
    (tokens) => binaryOperatorExpressionRule(tokens, '-'),
    functionCallRule,
    functionRule,
    bracketsStatementRule,
    statementListRule,
    statementListBaseRule,
    statementRule,
    assignmentRule,
    constantAssignmentRule,
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
      token.type.add('int')
      return true
    }
  }
  return false
}

function intRule(tokens) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].type.has('int')
        && tokens[i + 1].type.has('int')) {
      tokens[i].value += tokens[i + 1].value
      tokens.splice(i + 1, 1)
      return true
    }
  }
  return false
}

function floatRule(tokens) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].type.has('int')
        && tokens[i + 1].value === '.'
        && tokens[i + 2].type.has('int')) {
      tokens[i].type.delete('int')
      tokens[i].type.add('float')
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

function booleanRule(tokens) {
  for (let token of tokens) {
    if (token.type.has('word') && ['true', 'false'].includes(token.value)) {
      token.type.delete('word')
      token.type.add('bool')
      return true
    }
  }
  return false
}

function intWordRule(tokens) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].type.has('word')
        && tokens[i + 1].type.has('int')) {
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

function typeRule(tokens) {
  for (let token of tokens) {
    if (token.type.has('word') && !token.type.has('type') &&
        ['int', 'float', 'string', 'bool'].includes(token.value)) {
      token.type.add('type')
      return true
    }
  }
  return false
}

function typeWordRule(tokens) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].type.has('type')
        && tokens[i + 1].type.has('word')) {
      tokens[i + 1].type.add(tokens[i].value)
      tokens.splice(i, 1)
      return true
    }
  }
  return false
}

function assignmentRule(tokens) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].type.has('word')
        && tokens[i + 1].value === '='
        && tokens[i + 2].type.has('expression')) {
      tokens[i + 1].type.add('assignment')
      tokens[i + 1].children = [tokens[i], tokens[i + 2]]
      tokens.splice(i, 3, tokens[i + 1])
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

function tupleBaseRule(tokens) {
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

function tupleRule(tokens) {
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

function expressionRule(tokens) {
  for (let token of tokens) {
    if (!token.type.has('expression') &&
        ['string', 'int', 'float', 'bool', 'word', 'function.call', 'tuple', 'function.interface']
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

function functionInterfaceRule(tokens) {
  for (let i = 0; i < tokens.length - 3; i++) {
    if (tokens[i + 1].value === '-'
        && tokens[i + 2].value === '>') {
      const token = {
        type: new Set(['function.interface']),
        children: [],
      }
      let start = i + 1
      let end = i + 3
      if ((tokens[i].type.has('word')
          || tokens[i].type.has('tuple'))) {
        token.children.push(tokens[i])
        start -= 1
      }
      if ((tokens[i + 3].type.has('type')
          || tokens[i + 3].type.has('tuple'))) {
        token.children.push(tokens[i + 3])
        end += 1
      }
      tokens.splice(start, end - start, token)
      return true
    }
  }
  return false
}

function functionRule(tokens) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].type.has('function.interface')
        && tokens[i + 1].type.has('statement')) {
      const token = {
        type: new Set(['function']),
      }
      token.children = [tokens[i], tokens[i + 1]]
      tokens.splice(i, 2, token)
      return true
    }
  }
  return false
}

function bracketsStatementRule(tokens) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].value === '{'
        && (tokens[i + 1].type.has('statement')
          || tokens[i + 1].type.has('statement.list'))
        && tokens[i + 2].value === '}') {
      tokens[i + 1].type.add('statement')
      tokens.splice(i, 3, tokens[i + 1])
      return true
    }
  }
  return false
}

function statementRule(tokens) {
  for (let token of tokens) {
    if (!token.type.has('statement') && token.type.has('function.call')) {
      token.type.add('statement')
      return true
    }
  }
  return false
}

function statementListBaseRule(tokens) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].type.has('statement')
        && tokens[i + 1].type.has('statement')) {
      const token = {
        type: new Set(['statement.list'])
      }
      token.children = [tokens[i], tokens[i + 1]]
      tokens.splice(i, 3, token)
      return true
    }
  }
  return false
}

function statementListRule(tokens) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].type.has('statement.list')
        && tokens[i + 1].type.has('statement')) {
      tokens[i].children.push(tokens[i + 1])
      tokens.splice(i + 1, 1)
      return true
    }
  }
  return false
}

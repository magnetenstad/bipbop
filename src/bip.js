import { isEmptyToken } from './util.js'

const delimiters = [';', '{', '}', '(', ')', '\'', '\"', ',']
const operators = ['=', '::', '+', '-', '*', '/', '+=', '-=',
    '*=', '/=', '>_', '>>', '==', '!=']
// const datatypes = ['int', 'float', 'string', 'bool']

export function runBip(data) {
  const tokens = lex('{' + data + '}')
  const ast = parseTokens(tokens)
  console.log(JSON.stringify(ast, null, 2))
  interpret(ast)
}

// Lexing

function lex(data) {
  delimiters.forEach((d) => data = data.replaceAll(d, ` ${d} `))
  return data.split(' ').map((item) => {
    return tokenize(item.trim())
  })
}

function tokenize(item) {
  const token = {
    type: '',
    name: item,
  }
  if (operators.includes(item)) {
    token.type = 'operator'
  }
  else if (delimiters.includes(item)) {
    token.type = 'delimiter'
  }
  else if (!isNaN(parseInt(token.name))) {
    token.type = 'int'
    token.value = parseInt(token.name)
  }
  else if (!isNaN(parseFloat(token.name))) {
    token.type = 'float'
    token.value = parseFloat(token.name)
  }
  else if (token.name === 'true' || token.name === 'false') {
    token.type = 'bool'
    token.value = token.name === 'true'
  } else if (token.name.match(/^[A-Za-z]+$/)) {
    token.type = 'var'
  }

  return token
}

// Parsing

function parseTokens(tokens) {
  let startString = -1
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.name === '\'' || token.name === '\"') {
      if (startString === -1) {
        startString = i
      } else {
        const str = {
          type: 'string',
        }
        const strContent = tokens.splice(startString, i + 1 - startString, str)
        str.value = strContent.slice(1, strContent.length - 1)
          .map(t => t.name).join(' ')
        i = startString + 1
        startString = -1
      }
    }
  }

  tokens = tokens.filter(t => !isEmptyToken(t))

  while (true) {
    let curlyStart = -1
    let curlyEnd = -1
    let roundStart = -1
    let roundEnd = -1
    for (const [i, token] of tokens.entries()) {  
      if (token.name === '{') curlyStart = i
      if (token.name === '(') roundStart = i

      if (token.name === '}') {
        curlyEnd = i
        const block = {
          type: 'block',
        }
        const blockContent = tokens.splice(
            curlyStart, curlyEnd - curlyStart + 1, block)
        block.children = parseBlock(
            blockContent.slice(1, blockContent.length - 1))
        break
      }

      if (token.name === ')') {
        roundEnd = i
        const block = {
          type: 'expression',
        }
        const blockContent = tokens.splice(
            roundStart, roundEnd - roundStart + 1, block)
        block.children = blockContent.slice(1, blockContent.length - 1)
        break
      }
    }
    if (curlyEnd + roundEnd === -2) {
      break
    }
  }
  
  return tokens[0]
}

function parseBlock(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]  
    if (token.name === '->') {
      const func = {
        type: 'function',
        from: tokens[i - 1],
        to: tokens[i + 1]
      }
      tokens.splice(i - 1, 3, func)
    }

    if (token.name === '?') {
      const cond = {
        type: 'conditional',
        condition: tokens[i - 1],
        block: tokens[i + 1]
      }
      tokens.splice(i - 1, 3, cond)
      cond.condition.children = parseExpression(cond.condition.children)
    }
  }

  const children = []
  let start = 0
  for (const [i, token] of tokens.entries()) {  
    if (token.name === ';' || i === tokens.length - 1) {
      children.push({
        type: 'statement',
        children: parseStatement(
            tokens.slice(start, i + (token.name === ';' ? 0 : 1)))
      })
      start = i + 1
      continue
    }
  }
  return children
}

function parseStatement(tokens) {
  for (let token of tokens) {
    if (token.type === 'expression') {
      token.children = parseExpression(token.children)
    }
  }
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i]
    const token_next = tokens[i + 1]
    if (token.type === 'var' && token_next.type === 'expression') {
      const call = {type: 'call'}
      call.children = tokens.splice(i, 2, call)
      i -= 1
    }
  }
  return tokens
}

function parseExpression(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.type === 'expression') {
      token.children = parseExpression(token.children)
    }
  }
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.name === '*' || token.name === '/') {
      token.type = 'operation'
      token.children = [tokens[i - 1], tokens[i + 1]]
      tokens.splice(i - 1, 3, token)
      i -= 1
    }
  }
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.name === '+' || token.name === '-') {
      token.type = 'operation'
      token.children = [tokens[i - 1], tokens[i + 1]]
      tokens.splice(i - 1, 3, token)
      i -= 1
    }
  }
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.name === '!') {
      token.type = 'operation'
      token.children = [tokens[i + 1]]
      tokens.splice(i, 2, token)
    }
  }
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.name === '==' || token.name === '!=') {
      token.type = 'operation'
      token.children = [tokens[i - 1], tokens[i + 1]]
      tokens.splice(i - 1, 3, token)
      i -= 1
    }
  }
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i]
    const token_next = tokens[i + 1]
    if (token.type === 'var' && token_next.type === 'expression') {
      const call = {type: 'call'}
      call.children = tokens.splice(i, 2, call)
      i -= 1
    }
  }
  return tokens
}

// Interpretation

function interpret(node, vars=null, scope=false) {

  vars = 
      vars === null ? new Map()
    : scope         ? new Map(vars)
    : vars

  if (node.children && node.children.length) {

    if (node.children[0].name == '//') {
      return
    }

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      const value = vars.get(child.name)
      
      if (value === undefined) {
        const scope = ['block'].includes(child.type)
        interpret(child, vars, scope)
      } else {
        child.value = vars.get(child.name).value
      }
    }
  }

  if (['block', 'statement', 'expression'].includes(node.type)) {
    if (node.children.length) {
      node.value = node.children[node.children.length-1].value
    }
  }

  if (node.type === 'call') {
    const func = vars.get(node.children[0].name)
    const args = node.children[1]
    if (func.type !== 'function') console.warn('Expected a function')
    interpret(args, vars)
    executeFunction(func, args.children, vars)
    node.value = func.value
  }

  if (node.type === 'statement') {
    if (node.children.length > 1) {
      if (node.children[1].name === '=' || node.children[1].name === '::') {
        vars.set(node.children[0].name, node.children[2])
        return
      }
    }
    if (node.children.length > 0) {
      const first = node.children[0]
      if (first.name === '>_') {
        console.log(node.children.length > 1 ? node.children[1].value : '')
      }
      if (node.children[0].name === '>>') {
        return {
          message: 'return', 
          value: node.children.length > 1 
            ? node.children[1]
            : null
        }
      }
      if (first.type === 'conditional') {
        interpret(first.condition, vars)
        if (first.condition.value) {
          interpret(first.block, vars)
        }
      }
    }
  }

  if (node.type === 'operation') {
    if (node.name === '+') {
      node.value = 
        node.children[0].value + 
        node.children[1].value
    }
    if (node.name === '-') {
      node.value = 
        node.children[0].value - 
        node.children[1].value
    }
    if (node.name === '*') {
      node.value = 
        node.children[0].value * 
        node.children[1].value
    }
    if (node.name === '/') {
      node.value = 
        node.children[0].value / 
        node.children[1].value
    }
    if (node.name === '==') {
      node.value = 
        node.children[0].value ==
        node.children[1].value
    }
    if (node.name === '!=') {
      node.value = 
        node.children[0].value !=
        node.children[1].value
    }
    if (node.name === '!') {
      node.value = !node.children[0].value
    }
  }
}

function executeFunction(func, args, vars=null) {
  if (vars === null) {
    vars = new Map()
  } else {
    vars = new Map(vars)
  }

  for (let i = 0; i < func.from.children.length; i++) {

    const value = 
        i >= args.length       ? {type: 'null', value: null}
      : vars.get(args[i].name) ? vars.get(args[i].name)
      :                          args[i]
    
    vars.set(func.from.children[i].name, value)
  }

  for (let node of func.to.children) {
    const result = interpret(node, vars)
    if (result !== undefined && result.message === 'return') {
      func.value = result.value.value
      return
    }
  }
}

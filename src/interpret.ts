import { Token, TokenType } from './token'

function interpret(
  node: Token,
  vars: Map<string, any> | null = null,
  scope = false
) {
  vars = vars === null ? new Map() : scope ? new Map(vars) : vars

  if (node.children && node.children.length) {
    if (node.children[0].key == '//') {
      return
    }

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      const value = vars.get(child.key)

      if (value === undefined) {
        const scope = child.hasType(TokenType.StatementList)
        interpret(child, vars, scope)
      } else {
        child.value = vars.get(child.key).value
      }
    }
  }

  if (
    node.hasAnyOfTypes([TokenType.StatementList, TokenType.Statement]) ||
    node.isExpression()
  ) {
    if (node.children.length) {
      node.value = node.children[node.children.length - 1].value
    }
  }

  if (node.hasType(TokenType.FunctionCall)) {
    const func = vars.get(node.children[0].key)
    const args = node.children[1]
    if (func.type !== 'function') console.warn('Expected a function')
    interpret(args, vars)
    executeFunction(func, args.children, vars)
    node.value = func.value
  }

  if (node.hasType(TokenType.Statement)) {
    if (node.children.length > 1) {
      if (node.children[1].key === '=' || node.children[1].key === '::') {
        vars.set(node.children[0].key, node.children[2])
        return
      }
    }
    if (node.children.length > 0) {
      const first = node.children[0]
      if (first.key === '>_') {
        console.log(node.children.length > 1 ? node.children[1].value : '')
      }
      if (node.children[0].key === '>>') {
        return {
          message: 'return',
          value: node.children.length > 1 ? node.children[1] : null,
        }
      }
      // if (first.hasType(TokenType.Conditional)) {
      //   interpret(first.condition, vars)
      //   if (first.condition.value) {
      //     interpret(first.block, vars)
      //   }
      // }
    }
  }

  if (node.hasType(TokenType.BinaryOperation)) {
    if (node.key === '+') {
      node.value = node.children[0].value + node.children[1].value
    }
    if (node.key === '-') {
      node.value = node.children[0].value - node.children[1].value
    }
    if (node.key === '*') {
      node.value = node.children[0].value * node.children[1].value
    }
    if (node.key === '/') {
      node.value = node.children[0].value / node.children[1].value
    }
    if (node.key === '==') {
      node.value = node.children[0].value == node.children[1].value
    }
    if (node.key === '!=') {
      node.value = node.children[0].value != node.children[1].value
    }
    if (node.key === '!') {
      node.value = !node.children[0].value
    }
  }
}

function executeFunction(
  func: { from: Token; to: Token; value: any },
  args: Token[],
  vars: Map<string, any> | null = null
) {
  if (vars === null) {
    vars = new Map()
  } else {
    vars = new Map(vars)
  }

  for (let i = 0; i < func.from.children.length; i++) {
    const value =
      i >= args.length
        ? { type: 'null', value: null }
        : vars.get(args[i].key)
        ? vars.get(args[i].key)
        : args[i]

    vars.set(func.from.children[i].key, value)
  }

  for (let node of func.to.children) {
    const result = interpret(node, vars)
    if (result !== undefined && result.message === 'return') {
      func.value = result.value?.value
      return
    }
  }
}

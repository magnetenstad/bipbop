
export function compileBipToJavaScript(data) {
  data = 'import * as std from \'./std.js\'\n' + data

  return data
}

(comment) @comment
(string) @string
(number) @number
(boolean) @boolean
(null) @constant

[
  "fun"
  "mcfun"
  "var"
  "if"
  "else"
  "for"
  "while"
  "return"
  "break"
  "continue"
  "import"
  "execute"
  "as"
] @keyword

(number_type) @type
(type_name) @type
(list_type "list" @type)
(type_field name: (identifier) @property)
(compound_entry key: (identifier) @property)

(function_definition name: (identifier) @function)
(call_expression function: (identifier) @function)
((call_expression function: (identifier) @function.builtin)
  (#any-of? @function.builtin "append" "prepend" "insert" "remove" "len" "text" "snbt" "onEvent"))
(parameter) @variable.parameter
(for_statement capture: (identifier) @variable.parameter)

; `#x` is a score, `$x` is data storage, `@s` is a selector.
(score_variable) @variable.special
(data_variable) @property
(data_path) @property
(selector) @tag

; `/say ...;` and `execute (...)` hold raw Minecraft text.
(command "/" @punctuation.special)
(command name: (command_name) @function)
(command_text) @string.special
(insert ["{{" "}}"] @punctuation.special)

(binary_expression operator: _ @operator)
(unary_expression operator: _ @operator)
["=" ".."] @operator

["(" ")" "{" "}" "|"] @punctuation.bracket
[";" "," "."] @punctuation.delimiter

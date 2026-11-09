// The end of a line, the start and end of an indented block, and the colon that starts a block, as
// in Poplar's own lexer. The layout tokens have no width, and the scanner gives one only where the
// grammar accepts it, so inside brackets a line break stays whitespace.

#include "tree_sitter/array.h"
#include "tree_sitter/parser.h"

#include <stdint.h>

enum TokenType { NEWLINE, INDENT, DEDENT, BLOCK_COLON };

typedef struct {
  Array(uint16_t) indents;
} Scanner;

static void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

void *tree_sitter_poplar_external_scanner_create(void) {
  Scanner *scanner = ts_calloc(1, sizeof(Scanner));
  array_init(&scanner->indents);
  array_push(&scanner->indents, 0);
  return scanner;
}

void tree_sitter_poplar_external_scanner_destroy(void *payload) {
  Scanner *scanner = payload;
  array_delete(&scanner->indents);
  ts_free(scanner);
}

unsigned tree_sitter_poplar_external_scanner_serialize(void *payload, char *buffer) {
  Scanner *scanner = payload;
  unsigned size = 0;
  // The first indent is always 0, so it is not stored.
  for (uint32_t i = 1; i < scanner->indents.size; i++) {
    if (size + 2 > TREE_SITTER_SERIALIZATION_BUFFER_SIZE) break;
    uint16_t indent = *array_get(&scanner->indents, i);
    buffer[size++] = (char)(indent & 0xFF);
    buffer[size++] = (char)(indent >> 8);
  }
  return size;
}

void tree_sitter_poplar_external_scanner_deserialize(void *payload, const char *buffer,
                                                     unsigned length) {
  Scanner *scanner = payload;
  array_clear(&scanner->indents);
  array_push(&scanner->indents, 0);
  for (unsigned i = 0; i + 1 < length; i += 2) {
    uint16_t indent = (uint8_t)buffer[i] | ((uint16_t)(uint8_t)buffer[i + 1] << 8);
    array_push(&scanner->indents, indent);
  }
}

bool tree_sitter_poplar_external_scanner_scan(void *payload, TSLexer *lexer,
                                              const bool *valid_symbols) {
  Scanner *scanner = payload;
  // During error recovery every token is valid. Giving none lets the parser recover.
  if (valid_symbols[NEWLINE] && valid_symbols[INDENT] && valid_symbols[DEDENT]) return false;

  // A `:` followed by a space, a comment or the end of the line starts a block. Any other `:` is
  // part of a name, as in `magic:heal`.
  if (valid_symbols[BLOCK_COLON]) {
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') skip(lexer);
    if (lexer->lookahead == ':') {
      lexer->advance(lexer, false);
      lexer->mark_end(lexer);
      int32_t next = lexer->lookahead;
      bool starts_block = next == ' ' || next == '\t' || next == '\r' || next == '\n' ||
                          lexer->eof(lexer);
      if (next == '/') {
        lexer->advance(lexer, false);
        starts_block = lexer->lookahead == '/';
      }
      if (!starts_block) return false;
      lexer->result_symbol = BLOCK_COLON;
      return true;
    }
  }

  lexer->mark_end(lexer);
  bool found_end_of_line = false;
  uint32_t indent = 0;
  for (;;) {
    if (lexer->lookahead == '\n') {
      found_end_of_line = true;
      indent = 0;
      skip(lexer);
    } else if (lexer->lookahead == ' ') {
      indent++;
      skip(lexer);
    } else if (lexer->lookahead == '\t') {
      indent += 8;
      skip(lexer);
    } else if (lexer->lookahead == '\r' || lexer->lookahead == '\f') {
      skip(lexer);
    } else if (lexer->lookahead == '/' && found_end_of_line) {
      // A line with only a `//` comment does not change the indentation. A `//` after code on the
      // same line is left to the grammar: after a command it is text, elsewhere a comment.
      skip(lexer);
      if (lexer->lookahead != '/') break;
      while (lexer->lookahead != '\n' && !lexer->eof(lexer)) skip(lexer);
    } else if (lexer->eof(lexer)) {
      found_end_of_line = true;
      indent = 0;
      break;
    } else {
      break;
    }
  }
  if (!found_end_of_line) return false;

  uint16_t current = *array_back(&scanner->indents);
  if (valid_symbols[INDENT] && indent > current) {
    array_push(&scanner->indents, indent);
    lexer->result_symbol = INDENT;
    return true;
  }
  if (valid_symbols[DEDENT] && indent < current) {
    array_pop(&scanner->indents);
    lexer->result_symbol = DEDENT;
    return true;
  }
  if (valid_symbols[NEWLINE]) {
    lexer->result_symbol = NEWLINE;
    return true;
  }
  return false;
}

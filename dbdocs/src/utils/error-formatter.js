function createSyntaxErrorMessage (line, column, msg) {
  return `Syntax error at line ${line} column ${column}. ${msg}`;
}

function formatParserV2ErrorMessage (error) {
  if (!Array.isArray(error)) {
    if (!error.location) {
      // this is a runtime error
      return '';
    }

    return createSyntaxErrorMessage(error.location.start.line, error.location.start.column, error.message);
  }

  const messageList = [];
  error.forEach((err) => {
    messageList.push(createSyntaxErrorMessage(err.location.start.line, err.location.start.column, err.message));
  });

  return messageList.join('\n');
}

module.exports = {
  formatParserV2ErrorMessage,
};

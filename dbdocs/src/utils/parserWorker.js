const { parentPort, workerData } = require('worker_threads');
const { Parser } = require('@dbml/core');

function parse (content) {
  const parser = new Parser();
  const databaseObject = parser.parse(content, 'dbmlv2');
  const schemas = databaseObject.schemas.map((schema) => ({
    name: schema.name,
    tables: schema.tables.map((table) => table.name),
  }));

  return {
    name: databaseObject.name,
    description: databaseObject.note,
    schemas,
  };
}

const { content } = workerData;
const result = parse(content);
parentPort.postMessage(result);

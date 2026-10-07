const fs = require('fs');
const path = require('path');

class Logger {
  constructor(filePath = path.join(__dirname, '..', 'logs', 'errors.log')) {
    this.filePath = filePath;
  }

  error(error, context = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...context,
    };

    try {
      fs.appendFileSync(this.filePath, `${JSON.stringify(entry)}\n`, 'utf8');
    } catch (logError) {
      console.error('Não foi possível gravar o arquivo de log:', logError.message);
    }
  }
}

module.exports = new Logger();
module.exports.Logger = Logger;

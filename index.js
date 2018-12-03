const cluster = require ('cluster');

if (cluster.isMaster) {
  for (let i = 0; i < 4; i++) {
    cluster.fork();
  }
} else {
  const net = require ('net');
  const vm = require ('vm');
  const parser = require ('ldjson-stream');
  const os = require('os');

  const server = net.createServer ((c) => {
    const input = parser();

    c.on ('error', (error) => { console.log('CONNECTION ERROR', error);});
    input.on('error', (error) => { console.log('INPUT ERROR:', error); });

    input.on('data', (job) => {
      processJob (job).then ((result) => {
        c.write(JSON.stringify(result) + os.EOL);
      }).catch((err) => {
        console.log ('processing error', err);
        c.write(JSON.stringify({ error: err.message }) + os.EOL);
      });
    });

    c.pipe(input);
  });

  server.listen (5555, () => {
    console.error ('Server listening on ', server.address ());
  });

  function processJob ({ scripts, content }) {
    try {
      const callbacks = compile (scripts);
      return executor ({ callbacks, content });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function compile (scripts) {
    return scripts.map ((code) => {
      let context = {
        setTimeout,
        require
      };
      vm.runInNewContext (code, context);
      return context.preStore;
    });
  }

  function executor ({ callbacks, content }) {
    return callbacks.reduce ((p, callback) => {
      return p.then (callback);
    }, Promise.resolve (content));
  }

}

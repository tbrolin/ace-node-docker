const net = require ('net');
const vm = require ('vm');
const parser = require('ldjson-stream');

const server = net.createServer ((c) => {
  const input = parser();
  const output = parser.serialize();

  c.on ('error', (error) => { console.log('CONNECTION ERROR', error);});
  input.on('error', (error) => { console.log('INPUT ERROR:', error); });
  output.on('error', (error) => { console.log('OUTPUT ERROR:',error); });

  input.on('data', (job) => {
    process.stderr.write ('.');
    processJob (job).then ((result) => {
      c.write(JSON.stringify(result));
    }).catch((err) => {
      console.log ('processing error', err);
      c.write(JSON.stringify({ error: err.message }));
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
    let context = {};
    vm.runInNewContext (code, context);
    return context.preStore;
  });
}

function executor ({ callbacks, content }) {
  return callbacks.reduce ((p, callback) => {
    return p.then (callback);
  }, Promise.resolve(content))
}

const net = require('net');
const os = require('os');

const client = new net.Socket();

const job = {
	scripts: ["function preStore (content) { content.prestoreOne = 'oneCalled'; return content; }", "function preStore (content) { content.prestoreTwo = 'twoCalled'; return content; }"],
	content: {
		hej: 'hopp'
	}
};

client.connect(5555, 'localhost', function () {
  client.write(JSON.stringify(job) + os.EOL);
});

client.on ('error', (error) => {
  console.error(error);
});

client.on('data', function(data) {
  console.error ('' + data);
  client.destroy(); // kill client after server's response
});

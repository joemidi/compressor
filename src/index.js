const program = require('commander');
const opn = require('opn');
const fs = require('fs');
const net = require('net');

const defaultFormat = 'jpg';
const version = 1;

const settings = {
  host: 'compress-or-die.com',
  api: '/api',
  process: `/${defaultFormat}-process`,
};

program
  .version(process.env.npm_package_version)
  .description(process.env.npm_package_description);

const sendDataToServer = (_settings, headerData, data) => {
  const regex = /(_.+):(.+)/g;
  const fields = {};
  let match;

  const socket = net.createConnection({
    port: 80,
    host: _settings.host,
  }, () => {
    console.log('Connected to server!');
    socket.write(`POST ${_settings.api} HTTP/1.0\r\n`);
    socket.write(`Host: ${_settings.host}\r\n`);
    socket.write('Content-Type: image/png\r\n');
    socket.write(`Content-Length: ${data.length}\r\n`);

    Object.keys(headerData).map(key => socket.write(`${key}: ${headerData[key]}\r\n`));
    socket.write('Connection: close\r\n');
    socket.write('\r\n');
    socket.write(data);
  }).on('data', (_data) => {
    console.log(_data);

    while (match = regex.exec(_data.toString())) {
      fields[match[1]] = match[2];
    }

    socket.end();
  }).on('end', () => {
    if (fields._VERSION !== version) {
      console.warn('This version of your Photoshop script is outdated. Get the new one at compress-or-die.com');
    }

    const url = `https://${_settings.host}${_settings.process}?session=${fields._SESSION}`;

    console.log(`Opening: ${url}`);

    opn(url);
  });

  socket.setEncoding('binary');
};

program
  .command('jpg <file>')
  .action((file) => {
    fs.readFile(file, 'binary', (err, data) => {
      if (err) throw err;

      sendDataToServer(settings, {
        'X-Document-Name': 'bannertime',
      }, data);
    });
  });

program.parse(process.argv);

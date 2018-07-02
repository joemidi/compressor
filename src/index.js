const program = require('commander');
// const opn = require('opn');
const fs = require('fs');
const net = require('net');

const defaultFormat = 'jpg';

const settings = {
  host: 'compress-or-die.com',
  api: '/api',
  process: `/${defaultFormat}-process`,
};

program
  .version(process.env.npm_package_version)
  .description(process.env.npm_package_description);

const sendDataToServer = (_settings, headerData, data) => {
  const socket = new net.Socket();
  const regex = /(_.+):(.+)/g;
  const fields = {};
  let answer;
  let match;

  socket.setEncoding('binary');
  socket.setTimeout(3000);
  socket.connect({
    port: 80,
    host: _settings.host,
  });

  socket.on('ready', () => {
    socket.write(`POST ${_settings.api}HTTP/1.0\r\n`);
    socket.write(`Host: ${_settings.host}\r\n`);
    socket.write(`Content-Type: image/${defaultFormat}\r\n`);
    socket.write(`Content-Length: ${data.length}\r\n`);

    Object.keys(headerData).map(key => socket.write(`${key}: ${headerData[key]}\r\n`));

    socket.write('Connection: close\r\n');
    socket.write('\r\n');
    socket.write(data);
    answer = socket.read(9999999);
    do {
      fields[match[1]] = match[2];
    } while ((match = regex.exec(answer)));
    socket.close();
  });

  return fields;
};

program
  .command('jpg <file>')
  .action((file) => {
    fs.readFile(file, 'binary', (err, data) => {
      if (err) throw err;

      const buffer = data;
      const answer = sendDataToServer(settings, {
        'X-Document-Name': 'bannertime',
      }, buffer);
      const url = `http://${settings.host}${settings.process}?session=${answer}`;
      console.log(url);
      console.log(answer);
      console.log('Sending %s to https://compress-or-die.com', file);
      // opn(url);
    });
  });

program.parse(process.argv);

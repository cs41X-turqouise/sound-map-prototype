const { exec } = require('child_process');
const os = require('os');

function runScript(script) {
  return new Promise((resolve, reject) => {
    const process = exec(script, (error, stdout, stderr) => {
      if (error) {
        console.log(error);
        reject(error);
        return;
      }
      console.log(stdout);
      resolve(stdout ? stdout : stderr);
    });

    process.stdout.on('data', (data) => {
      console.log(data);
    });

    process.stderr.on('data', (data) => {
      console.error(data);
    });
  });
}

async function main() {
  if (os.platform() === 'win32') {
    await runScript('npm run dev:win');
  } else {
    await runScript('npm run dev:linux');
  }
}

main();

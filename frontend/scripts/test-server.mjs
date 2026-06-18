import server from '../dist/server/server.js';

async function run() {
  const req = new Request('http://localhost/');
  try {
    const res = await server.fetch(req, {}, {});
    console.log('STATUS', res.status);
    const text = await res.text();
    console.log('BODY PREVIEW:', text.slice(0, 400));
  } catch (err) {
    console.error('ERROR', err);
  }
}

run();

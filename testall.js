const chai = require('chai');
const server = require('./server');
const User = require('./Users');
const http = require('http');

const expect = chai.expect;

function postJson(port, path, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: '127.0.0.1',
            port: port,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
                resolve({ status: res.statusCode, body: parsed });
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

describe('User registration', function() {
    this.timeout(20000);
    let srv;
    let port;

    before(async () => {
        try { await User.deleteMany({}); } catch (e) {}
        srv = server.listen(0);
        port = srv.address().port;
    });

    

    it('should create a new user', async () => {
        const username = 'testuser_' + Math.random().toString(36).substring(2, 2);
        const res = await postJson(port, '/api/register', { username, password: 'Password123', email: username + '@example.com' });
        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('message');
    });


}); 

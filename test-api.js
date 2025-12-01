import https from 'https';

const apiKey = 'e25b25db91msh15de2e9aee31d5fp1288f4jsneb3e3653385';
const host = 'exercisedb.p.rapidapi.com';

const options = {
    hostname: host,
    path: '/exercises?limit=5',
    method: 'GET',
    headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': host
    }
};

console.log('Testing ExerciseDB API...');

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('API Response Sample (First Item):');
            console.log(JSON.stringify(json[0], null, 2));

            if (json.length > 0 && json[0].gifUrl) {
                console.log('\nSUCCESS: API is returning exercises with GIFs!');
            } else {
                console.log('\nWARNING: API returned data but gifUrl might be missing.');
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw Data:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();

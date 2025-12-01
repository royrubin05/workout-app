import fetch from 'node-fetch';

const FREE_DB_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json';
const IMAGE_BASE_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';

async function testCDN() {
    console.log('Testing CDN URLs...');

    // 1. Fetch JSON
    try {
        console.log(`Fetching JSON from: ${FREE_DB_URL}`);
        const res = await fetch(FREE_DB_URL);
        console.log(`JSON Status: ${res.status}`);

        if (!res.ok) {
            console.error('Failed to fetch JSON');
            return;
        }

        const data = await res.json();
        console.log(`Fetched ${data.length} exercises.`);

        if (data.length > 0) {
            const ex = data[0];
            console.log(`Sample Exercise: ${ex.name}`);
            console.log(`Image Path: ${ex.images[0]}`);

            const imgUrl = `${IMAGE_BASE_URL}${ex.images[0]}`;
            console.log(`Testing Image URL: ${imgUrl}`);

            const imgRes = await fetch(imgUrl);
            console.log(`Image Status: ${imgRes.status}`);

            if (imgRes.ok) {
                console.log('SUCCESS: Image is accessible via CDN.');
            } else {
                console.error('FAILURE: Image not accessible.');
            }
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

testCDN();

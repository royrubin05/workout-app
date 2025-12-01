import fetch from 'node-fetch';

const FREE_DB_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json';

async function analyzeEquipment() {
    try {
        const res = await fetch(FREE_DB_URL);
        const data = await res.json();

        const equipmentCounts = {};
        data.forEach(ex => {
            const eq = ex.equipment || 'body weight';
            equipmentCounts[eq] = (equipmentCounts[eq] || 0) + 1;
        });

        console.log('--- Unique Equipment Types in API ---');
        Object.entries(equipmentCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([eq, count]) => {
                console.log(`${eq}: ${count}`);
            });

    } catch (e) {
        console.error(e);
    }
}

analyzeEquipment();

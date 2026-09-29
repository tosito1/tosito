const fs = require('fs');
let js = fs.readFileSync('public/admin.js', 'utf8');

const seedScript = `
// ==== SEED COMPONENTS FROM LINKTREE ====
window.seedComponents = async function() {
    const defaultComponents = [
        { name: 'Timegrapher - Calibrar Reloj', category: 'otro', stock: 1, cost: 150, supplier: 'MacWatches', link: 'https://macwatches.com/tools/timegrapher' },
        { name: 'Pegatinas Personalizables para Dial', category: 'esfera', stock: 10, cost: 5, supplier: 'AliExpress', link: 'https://s.click.aliexpress.com/e/_EImLH58' },
        { name: 'Dial Personalizable Submariner/GMT', category: 'esfera', stock: 5, cost: 15, supplier: 'AliExpress', link: 'https://s.click.aliexpress.com/e/_EHLMLJo' },
        { name: 'Dial Personalizable Daytona', category: 'esfera', stock: 5, cost: 15, supplier: 'AliExpress', link: 'https://s.click.aliexpress.com/e/_EHNlBZk' },
        { name: 'Dial Personalizable AP', category: 'esfera', stock: 2, cost: 22, supplier: 'AliExpress', link: 'https://s.click.aliexpress.com/e/_EGgkviO' },
        { name: 'Caja Daytona + Correa Caucho', category: 'caja', stock: 3, cost: 45, supplier: 'AliExpress', link: 'https://s.click.aliexpress.com/e/_EvGDvDG' },
        { name: 'Caja Daytona + Armis Metálico', category: 'caja', stock: 2, cost: 40, supplier: 'AliExpress', link: 'https://s.click.aliexpress.com/e/_EuvrcQw' },
        { name: 'Manecillas Daytona', category: 'esfera', stock: 10, cost: 4, supplier: 'AliExpress', link: 'https://s.click.aliexpress.com/e/_EI8lvYa' }
    ];
    
    if (parts.length === 0) {
        console.log('Seeding components to Firestore...');
        for (const comp of defaultComponents) {
            await addDoc(collection(db, 'relojes_toust', 'admin', 'componentes'), comp);
        }
        await loadParts();
        showToast('Componentes semilla añadidos');
    } else {
        showToast('El inventario ya tiene componentes');
    }
};
`;

if (!js.includes('seedComponents')) {
    fs.writeFileSync('public/admin.js', js + '\n' + seedScript);
    console.log('Seed script appended');
}

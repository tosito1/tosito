const fs = require('fs');
let js = fs.readFileSync('public/app.js', 'utf8');

const newData = `    {
        id: "mod-timegrapher",
        name: "Timegrapher - Calibrar Reloj",
        category: "componentes",
        categoryLabel: "Herramienta",
        price: 150,
        badge: "Herramienta",
        image: "https://macwatches.com/wp-content/uploads/2021/08/timegrapher-1000.jpg",
        specsSummary: "Calibración de Calibres • Pantalla LCD",
        description: "Instrumento profesional para medir y calibrar la precisión, amplitud y error de beat de los movimientos mecánicos.",
        specs: {
            enlace: "https://macwatches.com/tools/timegrapher"
        }
    },
    {
        id: "mod-pegatinas-dial",
        name: "Pegatinas Personalizables para Dial",
        category: "componentes",
        categoryLabel: "Personalización",
        price: 5,
        badge: "Custom",
        image: "https://ae01.alicdn.com/kf/S8f5b8c3d9a1e4c7ba1c2b1e2c3d4e5f6A.jpg",
        specsSummary: "Stickers Metálicos • Varios Diseños",
        description: "Pegatinas metálicas adhesivas para personalizar diales estériles y crear tu propia marca o diseño único.",
        specs: {
            enlace: "https://s.click.aliexpress.com/e/_EImLH58"
        }
    },
    {
        id: "mod-dial-sub",
        name: "Dial Personalizable Submariner/GMT",
        category: "componentes",
        categoryLabel: "Dial Modding",
        price: 15,
        badge: "Custom",
        image: "https://ae01.alicdn.com/kf/S1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6P.jpg",
        specsSummary: "28.5mm • Lume C3/BGW9 • Compatible NH35",
        description: "Dial estéril o personalizable compatible con movimientos Seiko NH35/NH36. Estilo clásico de buceo o GMT.",
        specs: {
            enlace: "https://s.click.aliexpress.com/e/_EHLMLJo"
        }
    },
    {
        id: "mod-dial-daytona",
        name: "Dial Personalizable Daytona",
        category: "componentes",
        categoryLabel: "Dial Modding",
        price: 15,
        badge: "Custom",
        image: "https://ae01.alicdn.com/kf/S2b3c4d5e6f7g8h9i0j1k2l3m4n5o6Pq.jpg",
        specsSummary: "Subdiales Funcionales • Compatible VK63",
        description: "Esfera estilo cronógrafo de carreras con tres subdiales, ideal para construcciones con calibres meca-quartz VK63.",
        specs: {
            enlace: "https://s.click.aliexpress.com/e/_EHNlBZk"
        }
    },
    {
        id: "mod-dial-ap",
        name: "Dial Personalizable AP",
        category: "componentes",
        categoryLabel: "Dial Modding",
        price: 22,
        badge: "Premium",
        image: "https://ae01.alicdn.com/kf/S3c4d5e6f7g8h9i0j1k2l3m4n5o6Pqr.jpg",
        specsSummary: "Textura Tapisserie • 28.5mm",
        description: "Dial con patrón clásico 'Grande Tapisserie', perfecto para construcciones de estilo Royal Oak.",
        specs: {
            enlace: "https://s.click.aliexpress.com/e/_EGgkviO"
        }
    },
    {
        id: "mod-caja-daytona-caucho",
        name: "Caja Daytona + Correa Caucho",
        category: "componentes",
        categoryLabel: "Kit Caja",
        price: 45,
        badge: "Kit",
        image: "https://ae01.alicdn.com/kf/S4d5e6f7g8h9i0j1k2l3m4n5o6Pqrs.jpg",
        specsSummary: "Acero 316L / Oro / Plata / Rosa • Cristal Zafiro",
        description: "Kit completo de caja estilo cronógrafo con bisel cerámico y correa de caucho integrada. Compatible con movimientos VK63.",
        specs: {
            enlace: "https://s.click.aliexpress.com/e/_EvGDvDG"
        }
    },
    {
        id: "mod-caja-daytona-manilla",
        name: "Caja Daytona + Armis Metálico",
        category: "componentes",
        categoryLabel: "Kit Caja",
        price: 40,
        badge: "Kit",
        image: "https://ae01.alicdn.com/kf/S5e6f7g8h9i0j1k2l3m4n5o6Pqrst.jpg",
        specsSummary: "Acero Inoxidable 316L • Cristal Zafiro",
        description: "Kit de caja con brazalete metálico estilo Oyster. Ideal para montajes de cronógrafo de alta calidad.",
        specs: {
            enlace: "https://s.click.aliexpress.com/e/_EuvrcQw"
        }
    },
    {
        id: "mod-manecillas-daytona",
        name: "Manecillas Daytona",
        category: "componentes",
        categoryLabel: "Manecillas",
        price: 4,
        badge: "Accesorios",
        image: "https://ae01.alicdn.com/kf/S6f7g8h9i0j1k2l3m4n5o6Pqrstu.jpg",
        specsSummary: "Set de 6 manecillas • Lume Suizo",
        description: "Set completo de manecillas (horas, minutos, trotadora central y tres subdiales) para cronógrafos estilo Daytona.",
        specs: {
            enlace: "https://s.click.aliexpress.com/e/_EI8lvYa"
        }
    }
];`;

const endOfArray = js.indexOf('];', js.indexOf('const DEFAULT_WATCHES'));
if (endOfArray > -1) {
    js = js.substring(0, endOfArray) + ',\n' + newData + js.substring(endOfArray + 2);
    fs.writeFileSync('public/app.js', js);
    console.log('Appended to app.js');
} else {
    console.log('Could not find end of array');
}

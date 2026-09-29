import React, { useState } from 'react';
import AppFLX4 from './FLX4';
import AppXDJAZ from './XDJ_AZ';
import { SVG3D } from "3dsvg";

const flx4Svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 800 400"><path fill="black" fill-rule="evenodd" d="M 10,10 L 790,10 L 790,390 L 10,390 Z M 100,160 A 80,80 0 1,1 260,160 A 80,80 0 1,1 100,160 Z M 108,160 A 72,72 0 1,0 252,160 A 72,72 0 1,0 108,160 Z M 170,160 A 10,10 0 1,1 190,160 A 10,10 0 1,1 170,160 Z M 175,160 A 5,5 0 1,0 185,160 A 5,5 0 1,0 175,160 Z M 100,270 L 130,270 L 130,290 L 100,290 Z M 100,300 L 130,300 L 130,320 L 100,320 Z M 140,270 L 170,270 L 170,290 L 140,290 Z M 140,300 L 170,300 L 170,320 L 140,320 Z M 180,270 L 210,270 L 210,290 L 180,290 Z M 180,300 L 210,300 L 210,320 L 180,320 Z M 220,270 L 250,270 L 250,290 L 220,290 Z M 220,300 L 250,300 L 250,320 L 220,320 Z M 30,310 A 20,20 0 1,1 70,310 A 20,20 0 1,1 30,310 Z M 35,310 A 15,15 0 1,0 65,310 A 15,15 0 1,0 35,310 Z M 30,260 A 20,20 0 1,1 70,260 A 20,20 0 1,1 30,260 Z M 35,260 A 15,15 0 1,0 65,260 A 15,15 0 1,0 35,260 Z M 300,50 L 310,50 L 310,100 L 300,100 Z M 300,120 L 310,120 L 310,150 L 300,150 Z M 540,160 A 80,80 0 1,1 700,160 A 80,80 0 1,1 540,160 Z M 548,160 A 72,72 0 1,0 692,160 A 72,72 0 1,0 548,160 Z M 610,160 A 10,10 0 1,1 630,160 A 10,10 0 1,1 610,160 Z M 615,160 A 5,5 0 1,0 625,160 A 5,5 0 1,0 615,160 Z M 540,270 L 570,270 L 570,290 L 540,290 Z M 540,300 L 570,300 L 570,320 L 540,320 Z M 580,270 L 610,270 L 610,290 L 580,290 Z M 580,300 L 610,300 L 610,320 L 580,320 Z M 620,270 L 650,270 L 650,290 L 620,290 Z M 620,300 L 650,300 L 650,320 L 620,320 Z M 660,270 L 690,270 L 690,290 L 660,290 Z M 660,300 L 690,300 L 690,320 L 660,320 Z M 730,310 A 20,20 0 1,1 770,310 A 20,20 0 1,1 730,310 Z M 735,310 A 15,15 0 1,0 765,310 A 15,15 0 1,0 735,310 Z M 730,260 A 20,20 0 1,1 770,260 A 20,20 0 1,1 730,260 Z M 735,260 A 15,15 0 1,0 765,260 A 15,15 0 1,0 735,260 Z M 490,50 L 500,50 L 500,80 L 490,80 Z M 490,100 L 500,100 L 500,150 L 490,150 Z M 352,50 A 8,8 0 1,1 368,50 A 8,8 0 1,1 352,50 Z M 355,50 A 5,5 0 1,0 365,50 A 5,5 0 1,0 355,50 Z M 352,80 A 8,8 0 1,1 368,80 A 8,8 0 1,1 352,80 Z M 355,80 A 5,5 0 1,0 365,80 A 5,5 0 1,0 355,80 Z M 352,110 A 8,8 0 1,1 368,110 A 8,8 0 1,1 352,110 Z M 355,110 A 5,5 0 1,0 365,110 A 5,5 0 1,0 355,110 Z M 352,140 A 8,8 0 1,1 368,140 A 8,8 0 1,1 352,140 Z M 355,140 A 5,5 0 1,0 365,140 A 5,5 0 1,0 355,140 Z M 348,180 A 12,12 0 1,1 372,180 A 12,12 0 1,1 348,180 Z M 352,180 A 8,8 0 1,0 368,180 A 8,8 0 1,0 352,180 Z M 355,230 L 365,230 L 365,271.24744057956906 L 355,271.24744057956906 Z M 355,286.24744057956906 L 365,286.24744057956906 L 365,300 L 355,300 Z M 432,50 A 8,8 0 1,1 448,50 A 8,8 0 1,1 432,50 Z M 435,50 A 5,5 0 1,0 445,50 A 5,5 0 1,0 435,50 Z M 432,80 A 8,8 0 1,1 448,80 A 8,8 0 1,1 432,80 Z M 435,80 A 5,5 0 1,0 445,80 A 5,5 0 1,0 435,80 Z M 432,110 A 8,8 0 1,1 448,110 A 8,8 0 1,1 432,110 Z M 435,110 A 5,5 0 1,0 445,110 A 5,5 0 1,0 435,110 Z M 432,140 A 8,8 0 1,1 448,140 A 8,8 0 1,1 432,140 Z M 435,140 A 5,5 0 1,0 445,140 A 5,5 0 1,0 435,140 Z M 428,180 A 12,12 0 1,1 452,180 A 12,12 0 1,1 428,180 Z M 432,180 A 8,8 0 1,0 448,180 A 8,8 0 1,0 432,180 Z M 435,230 L 445,230 L 445,269.2022876619531 L 435,269.2022876619531 Z M 435,284.2022876619531 L 445,284.2022876619531 L 445,300 L 435,300 Z M 350,330 L 450,330 L 450,390 L 350,390 Z M 350,410 L 450,410 L 450,340 L 350,340 Z"/></svg>`;
const xdjAzSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1000 500"><path fill="black" fill-rule="evenodd" d="M 10,10 L 990,10 L 990,490 L 10,490 Z M 350,40 L 650,40 L 650,140 L 350,140 Z M 100,250 A 100,100 0 1,1 300,250 A 100,100 0 1,1 100,250 Z M 110,250 A 90,90 0 1,0 290,250 A 90,90 0 1,0 110,250 Z M 160,250 A 40,40 0 1,1 240,250 A 40,40 0 1,1 160,250 Z M 100,380 L 130,380 L 130,400 L 100,400 Z M 100,410 L 130,410 L 130,430 L 100,430 Z M 140,380 L 170,380 L 170,400 L 140,400 Z M 140,410 L 170,410 L 170,430 L 140,430 Z M 180,380 L 210,380 L 210,400 L 180,400 Z M 180,410 L 210,410 L 210,430 L 180,430 Z M 220,380 L 250,380 L 250,400 L 220,400 Z M 220,410 L 250,410 L 250,430 L 220,430 Z M 30,420 A 20,20 0 1,1 70,420 A 20,20 0 1,1 30,420 Z M 35,420 A 15,15 0 1,0 65,420 A 15,15 0 1,0 35,420 Z M 30,370 A 20,20 0 1,1 70,370 A 20,20 0 1,1 30,370 Z M 35,370 A 15,15 0 1,0 65,370 A 15,15 0 1,0 35,370 Z M 320,180 L 330,180 L 330,250 L 320,250 Z M 320,270 L 330,270 L 330,330 L 320,330 Z M 700,250 A 100,100 0 1,1 900,250 A 100,100 0 1,1 700,250 Z M 710,250 A 90,90 0 1,0 890,250 A 90,90 0 1,0 710,250 Z M 760,250 A 40,40 0 1,1 840,250 A 40,40 0 1,1 760,250 Z M 700,380 L 730,380 L 730,400 L 700,400 Z M 700,410 L 730,410 L 730,430 L 700,430 Z M 740,380 L 770,380 L 770,400 L 740,400 Z M 740,410 L 770,410 L 770,430 L 740,430 Z M 780,380 L 810,380 L 810,400 L 780,400 Z M 780,410 L 810,410 L 810,430 L 780,430 Z M 820,380 L 850,380 L 850,400 L 820,400 Z M 820,410 L 850,410 L 850,430 L 820,430 Z M 930,420 A 20,20 0 1,1 970,420 A 20,20 0 1,1 930,420 Z M 935,420 A 15,15 0 1,0 965,420 A 15,15 0 1,0 935,420 Z M 930,370 A 20,20 0 1,1 970,370 A 20,20 0 1,1 930,370 Z M 935,370 A 15,15 0 1,0 965,370 A 15,15 0 1,0 935,370 Z M 670,180 L 680,180 L 680,200 L 670,200 Z M 670,220 L 680,220 L 680,330 L 670,330 Z M 400,160 A 10,10 0 1,1 420,160 A 10,10 0 1,1 400,160 Z M 403,160 A 7,7 0 1,0 417,160 A 7,7 0 1,0 403,160 Z M 400,200 A 10,10 0 1,1 420,200 A 10,10 0 1,1 400,200 Z M 403,200 A 7,7 0 1,0 417,200 A 7,7 0 1,0 403,200 Z M 400,240 A 10,10 0 1,1 420,240 A 10,10 0 1,1 400,240 Z M 403,240 A 7,7 0 1,0 417,240 A 7,7 0 1,0 403,240 Z M 400,280 A 10,10 0 1,1 420,280 A 10,10 0 1,1 400,280 Z M 403,280 A 7,7 0 1,0 417,280 A 7,7 0 1,0 403,280 Z M 398,330 A 12,12 0 1,1 422,330 A 12,12 0 1,1 398,330 Z M 402,330 A 8,8 0 1,0 418,330 A 8,8 0 1,0 402,330 Z M 405,370 L 415,370 L 415,405.8500856756894 L 405,405.8500856756894 Z M 405,420.8500856756894 L 415,420.8500856756894 L 415,440 L 405,440 Z M 460,160 A 10,10 0 1,1 480,160 A 10,10 0 1,1 460,160 Z M 463,160 A 7,7 0 1,0 477,160 A 7,7 0 1,0 463,160 Z M 460,200 A 10,10 0 1,1 480,200 A 10,10 0 1,1 460,200 Z M 463,200 A 7,7 0 1,0 477,200 A 7,7 0 1,0 463,200 Z M 460,240 A 10,10 0 1,1 480,240 A 10,10 0 1,1 460,240 Z M 463,240 A 7,7 0 1,0 477,240 A 7,7 0 1,0 463,240 Z M 460,280 A 10,10 0 1,1 480,280 A 10,10 0 1,1 460,280 Z M 463,280 A 7,7 0 1,0 477,280 A 7,7 0 1,0 463,280 Z M 458,330 A 12,12 0 1,1 482,330 A 12,12 0 1,1 458,330 Z M 462,330 A 8,8 0 1,0 478,330 A 8,8 0 1,0 462,330 Z M 465,370 L 475,370 L 475,418.6470969850153 L 465,418.6470969850153 Z M 465,433.6470969850153 L 475,433.6470969850153 L 475,440 L 465,440 Z M 520,160 A 10,10 0 1,1 540,160 A 10,10 0 1,1 520,160 Z M 523,160 A 7,7 0 1,0 537,160 A 7,7 0 1,0 523,160 Z M 520,200 A 10,10 0 1,1 540,200 A 10,10 0 1,1 520,200 Z M 523,200 A 7,7 0 1,0 537,200 A 7,7 0 1,0 523,200 Z M 520,240 A 10,10 0 1,1 540,240 A 10,10 0 1,1 520,240 Z M 523,240 A 7,7 0 1,0 537,240 A 7,7 0 1,0 523,240 Z M 520,280 A 10,10 0 1,1 540,280 A 10,10 0 1,1 520,280 Z M 523,280 A 7,7 0 1,0 537,280 A 7,7 0 1,0 523,280 Z M 518,330 A 12,12 0 1,1 542,330 A 12,12 0 1,1 518,330 Z M 522,330 A 8,8 0 1,0 538,330 A 8,8 0 1,0 522,330 Z M 525,370 L 535,370 L 535,409.1090937037277 L 525,409.1090937037277 Z M 525,424.1090937037277 L 535,424.1090937037277 L 535,440 L 525,440 Z M 580,160 A 10,10 0 1,1 600,160 A 10,10 0 1,1 580,160 Z M 583,160 A 7,7 0 1,0 597,160 A 7,7 0 1,0 583,160 Z M 580,200 A 10,10 0 1,1 600,200 A 10,10 0 1,1 580,200 Z M 583,200 A 7,7 0 1,0 597,200 A 7,7 0 1,0 583,200 Z M 580,240 A 10,10 0 1,1 600,240 A 10,10 0 1,1 580,240 Z M 583,240 A 7,7 0 1,0 597,240 A 7,7 0 1,0 583,240 Z M 580,280 A 10,10 0 1,1 600,280 A 10,10 0 1,1 580,280 Z M 583,280 A 7,7 0 1,0 597,280 A 7,7 0 1,0 583,280 Z M 578,330 A 12,12 0 1,1 602,330 A 12,12 0 1,1 578,330 Z M 582,330 A 8,8 0 1,0 598,330 A 8,8 0 1,0 582,330 Z M 585,370 L 595,370 L 595,407.5357913436679 L 585,407.5357913436679 Z M 585,422.5357913436679 L 595,422.5357913436679 L 595,440 L 585,440 Z M 450,460 L 550,460 L 550,480 L 450,480 Z M 450,500 L 550,500 L 550,470 L 450,470 Z"/></svg>`;

const App = () => {
    const [mixer, setMixer] = useState<'HOME' | 'FLX4' | 'XDJ_AZ'>('HOME');

    if (mixer === 'FLX4') {
        return <AppFLX4 onBack={() => setMixer('HOME')} />;
    }

    if (mixer === 'XDJ_AZ') {
        return <AppXDJAZ onBack={() => setMixer('HOME')} />;
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-sans overflow-hidden p-8">
            <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">FluMix</h1>
            <p className="text-zinc-400 mb-12 max-w-md text-center">
                Selecciona tu controladora para empezar a mezclar. Cada interfaz está optimizada para tu hardware.
            </p>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-center max-w-4xl w-full">
                {/* FLX4 Card */}
                <button 
                    onClick={() => setMixer('FLX4')}
                    className="group flex flex-col items-center gap-6 p-9 bg-zinc-900/40 rounded-[28px] border border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900/80 transition-all hover:-translate-y-2 w-96 shadow-2xl"
                >
                    <div className="w-full aspect-[4/3] rounded-2xl flex items-center justify-center overflow-visible transition-transform duration-500 scale-[1.0] group-hover:scale-[1.1]">
                        <SVG3D
                          svg={flx4Svg}
                          smoothness={0.6}
                          color="#4f46e5"
                          animate="float"
                        />
                    </div>
                    <div className="flex flex-col items-center gap-2 mt-2">
                        <h2 className="text-2xl font-bold text-white group-hover:text-zinc-300 transition-colors">Pioneer FLX4</h2>
                        <span className="text-xs font-medium px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full group-hover:bg-zinc-700 transition-colors">
                            2 Canales • Beginner
                        </span>
                    </div>
                </button>

                {/* XDJ-AZ Card */}
                <button 
                    onClick={() => setMixer('XDJ_AZ')}
                    className="group flex flex-col items-center gap-6 p-9 bg-zinc-900/40 rounded-[28px] border border-zinc-800 hover:border-yellow-500/50 hover:bg-zinc-900/80 transition-all hover:-translate-y-2 w-96 shadow-2xl shadow-yellow-500/5"
                >
                    <div className="w-full aspect-[4/3] rounded-2xl flex items-center justify-center overflow-visible transition-transform duration-500 scale-[1.0] group-hover:scale-[1.1] mt-2">
                        <SVG3D
                          svg={xdjAzSvg}
                          smoothness={0.6}
                          color="#eab308"
                          animate="float"
                        />
                    </div>
                    <div className="flex flex-col items-center gap-2 mt-2">
                        <h2 className="text-2xl font-bold text-white group-hover:text-zinc-200 transition-colors">XDJ-AZ</h2>
                        <span className="text-xs font-medium px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full group-hover:bg-zinc-700 transition-colors">
                            4 Canales • Pro
                        </span>
                    </div>
                </button>
            </div>

            <div className="mt-16 text-zinc-600 text-sm font-medium flex flex-col items-center gap-1">
                <span>v1.0.0 • Audio Engine Ready</span>
                <span className="text-xs text-zinc-700">Created by Tosé</span>
            </div>
        </div>
    );
};

export default App;

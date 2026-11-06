
// 1. GRÁFICO DE PARTÍCULAS

const canvas = document.getElementById('constellationCanvas');
const ctx = canvas.getContext('2d');

let shapes = [];
const maxShapes = 45;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class GeometricalShape {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.9;
        this.vy = (Math.random() - 0.5) * 0.9;
        this.size = Math.random() * 8 + 6;
        this.type = Math.floor(Math.random() * 3);
        this.angle = Math.random() * Math.PI;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.angle += 0.005;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(204, 9, 47, 0.25)'; 

        if (this.type === 0) {
            ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else if (this.type === 1) {
            ctx.moveTo(0, -this.size / 2);
            ctx.lineTo(this.size / 2, this.size / 2);
            ctx.lineTo(-this.size / 2, this.size / 2);
            ctx.closePath();
            ctx.stroke();
        } else {
            ctx.moveTo(-this.size / 2, -this.size / 2);
            ctx.lineTo(0, 0);
            ctx.lineTo(this.size / 2, -this.size / 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}

for (let i = 0; i < maxShapes; i++) {
    shapes.push(new GeometricalShape());
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < shapes.length; i++) {
        for (let j = i + 1; j < shapes.length; j++) {
            let dist = Math.hypot(shapes[i].x - shapes[j].x, shapes[i].y - shapes[j].y);

            if (dist < 150) {
                ctx.beginPath();
                ctx.moveTo(shapes[i].x, shapes[i].y);
                ctx.lineTo(shapes[j].x, shapes[j].y);
                ctx.strokeStyle = `rgba(204, 9, 47, ${0.18 - dist / 150})`;
                ctx.lineWidth = 0.7;
                ctx.stroke();
            }
        }
    }

    shapes.forEach(s => {
        s.update();
        s.draw();
    });

    requestAnimationFrame(loop);
}
loop();

// ====================================================
// 2. SIMULAÇÃO DE INFRAESTRUTURA E AUTO-HEALING
// ====================================================
let autoHealingTimer = null;

function executarSimulacao(ambienteSaudavel) {
    const panel = document.getElementById('centralPanel');
    const terminal = document.getElementById('logTerminal');
    
    if (autoHealingTimer) clearTimeout(autoHealingTimer);

    if (!ambienteSaudavel) {
        panel.classList.add('alert-mode');
        
        document.getElementById('txtApi').innerText = "342 ms";
        document.getElementById('txtDb').innerText = "98 / 100";
        document.getElementById('txtCpu').innerText = "94 %";
        document.getElementById('txtMemory').innerText = "7.8 GB";

        terminal.innerHTML = `
            <p class="status-error">> [ALERTA CRÍTICO] Instabilidade severa detectada no ecossistema.</p>
            <p class="status-gray">> [MIND CORE] Correlacionando as 4 fontes de telemetria assíncrona...</p>
        `;

        autoHealingTimer = setTimeout(() => {
            terminal.innerHTML += `<p class="status-process">> [MIND AUTOMAÇÃO] Nível de Autonomia Alto detectado. Iniciando reciclagem de microsserviços...</p>`;
            
            autoHealingTimer = setTimeout(() => {
                executarSimulacao(true);
            }, 2500);
        }, 2000);

    } else {
        panel.classList.remove('alert-mode');
        
        document.getElementById('txtApi').innerText = "14 ms";
        document.getElementById('txtDb').innerText = "42 / 100";
        document.getElementById('txtCpu').innerText = "28 %";
        document.getElementById('txtMemory').innerText = "3.4 GB";

        terminal.innerHTML = `
            <p class="status-ok">> [SUCESSO] Rotina de Auto-healing concluída. Infraestrutura normalizada autonomamente.</p>
            <p class="status-gray">> [OK] Monitoramento ativo. Aguardando novos eventos de telemetria.</p>
        `;
    }
}

// Модель раздела «Эффективность обучения»: два ученика, 60 дней, разные стратегии занятий.
// Внутри это модель полива грядки (вода, влажность, корни), и каждая её механика
// соответствует принципу обучения — см. PRINCIPLES. Наружу выводим только учебные понятия.

const DAYS = 60;

// единица «воды» в модели — пять минут занятий
const UNIT_MINUTES = 5;

const TOOLS = {
    can: {name: 'Короткие занятия (до 25 мин)', cap: 5, infil: Infinity, trip: 0.4, conv: 0.1},
    bucket: {name: 'Уроки (до 50 мин)', cap: 10, infil: 8, trip: 1.0, conv: 0.25},
    barrel: {name: 'Марафоны (до 8 ч)', cap: 100, infil: 8, trip: 4, conv: 0.3},
};

const fmt = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');

// объём «воды» как время занятий
function fmtTime(units) {
    const minutes = Math.round(units * UNIT_MINUTES);
    const hours = Math.floor(minutes / 60);

    if (!hours) {
        return `${minutes} мин`;
    }

    return minutes % 60 ? `${hours} ч ${minutes % 60} мин` : `${hours} ч`;
}

// D — глубина корней (см), B — размер растения (0–100), H — здоровье (%),
// C — ёмкость корневой зоны (л), M — вода в ней (л), rot — дней подряд в заболоченной почве
function simulate(c) {
    let D = 10, B = 5, H = 80, C = 12, M = 0.6 * C, rot = 0, dead = false, last = 0, lastInt = 0;
    const zero = {poured: 0, root: 0, runoff: 0, drain: 0, effort: 0, outings: 0, stress: 0};
    const out = [{d: 0, D, B, H, m: M / C, W: 0, runoff: 0, drain: 0, toRoot: 0, effort: 0, dead, rot, ev: [], cum: {...zero}}];
    const cum = {...zero};

    for (let d = 1; d <= DAYS; d++) {
        C = 1.2 * D;
        const m0 = M / C;
        const ev = [];
        let W = 0, runoff = 0, drain = 0, toRoot = 0, effort = 0;

        let want = false;
        if (!dead && d >= c.start) {
            if (c.sched === 'interval') {
                want = (d - c.start) % Math.max(1, c.every) === 0;
            } else if (c.sched === 'weekends') {
                const w = d % 7;
                want = w === 6 || w === 0;
            } else {
                want = m0 * 100 < c.thr;
            }
        }
        if (want) {
            W = c.amount === 'fixed' ? c.liters : Math.max(0, (c.target / 100 - m0) * C);
            if (W < 0.3) W = 0;
        }

        if (W > 0) {
            const t = TOOLS[c.tool];
            const abs = Math.min(W, t.infil);
            runoff = W - abs;
            toRoot = Math.max(0, Math.min(abs, C - M));
            drain = abs - toRoot;
            M += toRoot;
            const trips = Math.ceil(W / t.cap);
            effort = 1 + trips * t.trip * (1 + t.conv * (trips - 1));
            cum.outings++;
            cum.poured += W;
            cum.root += toRoot;
            cum.runoff += runoff;
            cum.drain += drain;
            cum.effort += effort;
            ev.push(['water', `Занятие: ${fmtTime(W)}`]);
            if (runoff > 0.5) ev.push(['limit', `${fmtTime(runoff)} прошли мимо: за раз усваивается не больше ${fmtTime(t.infil)}`]);
            if (drain > 0.5) ev.push(['overload', `${fmtTime(drain)} впустую: материал и так был свежим`]);
            if (1 / effort > 0.55) ev.push(['setup', `Раскачка заняла ${Math.round(100 / effort)}% усилий этого занятия`]);
            if (last) {
                const iv = d - last;
                if (lastInt && iv > lastInt) ev.push(['spacing', `Перерыв между занятиями вырос до ${iv} дн.`]);
                lastInt = iv;
            }
            last = d;
        }

        const mA = M / C;
        const r = 0.177 * Math.sqrt(10 / D), up = dead ? 0 : 0.012 * B;
        M = Math.max(0, M - M * r - up);
        const mE = M / C, mid = (mA + mE) / 2;
        if (mid > 0.88) rot++; else rot = Math.max(0, rot - 1);

        const prevH = H;
        if (!dead) {
            if (rot >= 3) {
                H -= 9;
                ev.push(['overload', `Перегрузка ${rot}-й день подряд, начинается выгорание`]);
            } else if (mE < 0.15) {
                H -= 15;
                cum.stress++;
                ev.push(['forget', `Почти всё забыто: в памяти ${Math.round(mE * 100)}%`]);
            } else if (mE < 0.3) {
                H -= 5;
                cum.stress++;
                ev.push(['forget', `Знания тускнеют: в памяти ${Math.round(mE * 100)}%, учиться тяжело`]);
            } else {
                H = Math.min(100, H + 10);
                if (prevH < 50) ev.push(['savings', 'Подзабытое быстро вспоминается, интерес возвращается']);
            }
            if (H <= 0) {
                H = 0;
                dead = true;
                ev.push(['dead', 'Интерес потерян, учёба брошена. Занятия больше не помогут']);
            }
        }

        if (!dead && H > 40 && rot < 3) {
            let f = 0;
            if (mid >= 0.3 && mid <= 0.55) f = 1;
            else if (mid > 0.55 && mid <= 0.88) f = 0.35;
            else if (mid >= 0.2 && mid < 0.3) f = 0.5;
            const Dmax = Math.min(60, 8 + 0.55 * B), nd = Math.min(Dmax, D + 0.9 * f);
            if (f === 1 && nd > D + 0.05) ev.push(['difficulty', 'Материал слегка подзабылся, и повторение укрепило знания']);
            D = Math.max(D, nd);
            if (H > 50 && mid >= 0.3 && mid <= 0.88) B += (0.3 + 0.09 * B * (1 - B / 100)) * (H / 100);
        }

        out.push({d, D, B, H, m: mE, W, runoff, drain, toRoot, effort, dead, rot, ev, cum: {...cum}});
    }

    return out;
}

const BASE = {every: 1, thr: 40, target: 70, liters: 5, start: 1};

const PRESETS = {
    gardener: {
        name: 'Повторять, когда начал забывать',
        learn: 'Интервальное повторение: возвращаться к материалу, когда он начал забываться.',
        cfg: {...BASE, sched: 'threshold', thr: 40, amount: 'fill', target: 75, tool: 'can'},
    },
    daily: {
        name: 'Каждый день понемногу',
        learn: 'Ежедневное повторение, пока всё свежо. Надёжно, но дороже, и база получается мельче.',
        cfg: {...BASE, sched: 'interval', every: 1, amount: 'fill', target: 70, tool: 'can'},
    },
    barrel: {
        name: 'Раз в неделю на целый день',
        learn: 'Раз в неделю сесть на целый день. Почти всё проходит мимо.',
        cfg: {...BASE, sched: 'interval', every: 7, amount: 'fixed', liters: 80, tool: 'barrel'},
    },
    weekends: {
        name: 'Только по выходным',
        learn: 'Учёба рывками: за будни всё забывается.',
        cfg: {...BASE, sched: 'weekends', amount: 'fixed', liters: 10, tool: 'bucket'},
    },
    flood: {
        name: 'Каждый день больше, чем влезает',
        learn: 'Перегрузка: каждый день больше, чем можно усвоить.',
        cfg: {...BASE, sched: 'interval', every: 1, amount: 'fixed', liters: 15, tool: 'bucket'},
    },
    late: {
        name: 'Начал на 10-й день',
        learn: 'Начал поздно. Подзабытое восстановится, но упущенное время не вернуть.',
        cfg: {...BASE, sched: 'interval', every: 1, amount: 'fill', target: 70, tool: 'can', start: 10},
    },
    custom: {name: 'Своя стратегия', learn: 'Настройте параметры ниже.', cfg: null},
};

const PRINCIPLES = [
    {id: 'limit', name: 'Предел усвоения', learn: 'За одно занятие усваивается ограниченный объём. Остальное проходит мимо, сколько ни сиди.', color: '#2f7fbf'},
    {id: 'forget', name: 'Забывание', learn: 'Забывание идёт всегда. Без повторения знания тускнеют.', color: '#c9a227'},
    {id: 'overload', name: 'Перегрузка', learn: 'Перегрузка вредит сильнее недогрузки: выгорание губит и то, что уже было выучено.', color: '#b0413e'},
    {id: 'spacing', name: 'Интервалы растут', learn: 'Чем прочнее знание, тем реже нужны повторения.', color: '#5561d0'},
    {id: 'difficulty', name: 'Желательная трудность', learn: 'Повторять, когда уже слегка подзабыл, полезнее, чем когда всё свежо.', color: '#4c8b3a'},
    {id: 'savings', name: 'Эффект сбережения', learn: 'Подзабытое восстанавливается быстрее, чем учится новое.', color: '#8fa83a'},
    {id: 'setup', name: 'Цена входа', learn: 'Чтобы сесть и включиться, нужны усилия: слишком мелкие порции тонут в раскачке.', color: '#7c877e'},
    {id: 'dead', name: 'Брошенная учёба', learn: 'Упущенный фундамент не наверстать рывком, только строить заново.', color: '#6b6b6b'},
];

export {DAYS, UNIT_MINUTES, TOOLS, PRESETS, PRINCIPLES, simulate, fmt, fmtTime};

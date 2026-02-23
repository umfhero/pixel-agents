const F = '#555555';
const S = '#3A3A5C';
const B = '#6688CC';
const D = '#444444';
const _ = '';

const original = [
    [_, _, _, F, F, F, F, F, F, F, F, F, F, _, _, _],
    [_, _, _, F, S, S, S, S, S, S, S, S, F, _, _, _],
    [_, _, _, F, S, B, B, B, B, B, B, S, F, _, _, _],
    [_, _, _, F, S, B, B, B, B, B, B, S, F, _, _, _],
    [_, _, _, F, S, B, B, B, B, B, B, S, F, _, _, _],
    [_, _, _, F, S, B, B, B, B, B, B, S, F, _, _, _],
    [_, _, _, F, S, B, B, B, B, B, B, S, F, _, _, _],
    [_, _, _, F, S, B, B, B, B, B, B, S, F, _, _, _],
    [_, _, _, F, S, S, S, S, S, S, S, S, F, _, _, _],
    [_, _, _, F, F, F, F, F, F, F, F, F, F, _, _, _],
    [_, _, _, _, _, _, _, D, D, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, D, D, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, D, D, D, D, _, _, _, _, _, _],
    [_, _, _, _, _, D, D, D, D, D, D, _, _, _, _, _],
    [_, _, _, _, _, D, D, D, D, D, D, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

function rotateCW(m) {
    const res = [];
    for (let i = 0; i < m[0].length; i++) {
        const row = [];
        for (let j = m.length - 1; j >= 0; j--) {
            row.push(m[j][i]);
        }
        res.push(row);
    }
    return res;
}

const map = {
    [F]: 'F',
    [S]: 'S',
    [B]: 'B',
    [D]: 'D',
    [_]: '_'
};

function format(m) {
    return '  return [\n' + m.map(row => '    [' + row.map(v => map[v]).join(', ') + '],').join('\n') + '\n  ]';
}

const left = rotateCW(original);
const back = rotateCW(left);
const right = rotateCW(back);

console.log("export const PC_FRONT_SPRITE = (() => { const F = '#555555'; const S = '#3A3A5C'; const B = '#6688CC'; const D = '#444444';\n" + format(original) + "\n})();");
console.log("export const PC_LEFT_SPRITE = (() => { const F = '#555555'; const S = '#3A3A5C'; const B = '#6688CC'; const D = '#444444';\n" + format(left) + "\n})();");
console.log("export const PC_BACK_SPRITE = (() => { const F = '#555555'; const S = '#3A3A5C'; const B = '#6688CC'; const D = '#444444';\n" + format(back) + "\n})();");
console.log("export const PC_RIGHT_SPRITE = (() => { const F = '#555555'; const S = '#3A3A5C'; const B = '#6688CC'; const D = '#444444';\n" + format(right) + "\n})();");

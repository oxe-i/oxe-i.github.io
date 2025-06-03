const grid = document.querySelector("#grid");
const solution = createSolution();

const rows = Array.from({ length: 9 }, (_) => []);
const cols = Array.from({ length: 9 }, (_) => []);
const boxes = Array.from({ length: 9 }, (_) => []);

function getInitialRow(boxIdx) {
    const div = boxIdx / 3;
    return 3 * (div - (div % 1));
}

function getInitialCol(boxIdx) {
    return (boxIdx % 3) * 3;
}

function getAreaInBox(rowIdx, colIdx) {
    return ((colIdx % 3) + 1) + (rowIdx % 3) * 3;
}

function fillGrid() {
    Array.from({ length: 9 }, (_, idx) => idx).forEach(boxIdx => {
        const boxElem = document.createElement("div");
        
        boxElem.className = "box";
        boxElem.style.gridArea = `b${boxIdx + 1}`;
        
        const initialRow = getInitialRow(boxIdx);
        const initialCol = getInitialCol(boxIdx);

        for (let rowIdx = initialRow; rowIdx < initialRow + 3; ++rowIdx) {
            for (let colIdx = initialCol; colIdx < initialCol + 3; ++colIdx) {
                const cell = document.createElement("input");
                
                cell.type = "text";
                cell.inputMode = "numeric";
                cell.pattern = "[1-9]{1,1}";
                cell.className = "cell";

                cell.style.setProperty("--rowIdx", `${rowIdx}`);
                cell.style.setProperty("--colIdx", `${colIdx}`);
                cell.style.setProperty("--boxIdx", `${boxIdx}`);

                cell.style.gridArea = `c${getAreaInBox(rowIdx - initialRow, colIdx - initialCol)}`;

                cell.addEventListener("input", () => {
                    cell.value = cell.value.slice(0, 1).replace(/[^1-9]/, "");
                });

                boxElem.appendChild(cell);

                rows[rowIdx].push(cell);
                cols[colIdx].push(cell);
                boxes[boxIdx].push(cell);
            }
        }

        grid.appendChild(boxElem);
    });
}

function checkContainer(container) {
    return container.every(group => {
        return [1,2,3,4,5,6,7,8,9].every(digit => {
            return [...group].map(cell => Number(cell.value)).includes(digit);
        });
    });
}

function isEndGame() {
    return checkContainer(rows) && checkContainer(cols) && checkContainer(boxes);
}

function createSolution() {
    const rows = Array.from({ length: 9 }, (_) => { value: 0 });
    const cols = Array.from({ length: 9 }, (_) => { value: 0 });
    const boxes = Array.from({ length: 9 }, (_) => { value: 0 });

    
}

document.addEventListener("DOMContentLoaded", () => {
    fillGrid();

});
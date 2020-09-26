const puppeteer = require('puppeteer')

const rvatskaLetters = ['lj', 'nj', 'ž', 'ć', 'Č', 'đ', 'dž', 'š'].map(letter => letter.toUpperCase());
const letters = [...rvatskaLetters]
for (var i=97; i<123; i++) {
    letters.unshift(String.fromCharCode(i).toUpperCase())
}

const isValid = async (cell) => {
    const className = await cell.getProperty('className').then(handle => handle.jsonValue())

    return className.includes('input-ok')
}

let tries = {};

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.setViewport({
        width: 1280,
        height: 800
    })
    await page.goto(process.argv[2]);
    await page.waitForSelector(".is-crossword iframe")
    const elementHandle = await page.$('.is-crossword iframe');
    const frame = await elementHandle.contentFrame();
    await frame.waitForSelector('.cw-answer')
    const cells = await frame.$$('.cw-answer')

    checkLetter = async (index, cellIndex) => {
        if (cellIndex > cells.length - 1) {
            console.log('done')
            return
        }
        
        const cell = cells[cellIndex]
        await cell.click()
        await cell.evaluate(node => {
            node.textContent = ''
        })
        await cell.type(letters[index], { delay: 0 })

        if (!tries[cellIndex]) {
            tries[cellIndex] = []
        }

        tries[cellIndex].push(letters[index])

        if (rvatskaLetters.includes(letters[index])) {
            await (await frame.$('#cw-check')).click()
        }

        if (!(await isValid(cell))) {
            await checkLetter((index + 1) % letters.length, cellIndex)
        } else {
            await checkLetter(0, cellIndex + 1)
        }
    }
    checkLetter(0, 0)
  })();

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')


puppeteer.use(StealthPlugin())


background()


async function background() {
    try {
        console.log('Browser Start')

        browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome-stable',
            //headless: false,
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-skip-list',
                '--disable-dev-shm-usage'
            ]
        })
    
        page = (await browser.pages())[0]

        await page.goto('https://accounts.google.com/signup/v2/createaccount?continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&theme=glif&flowName=GlifWebSignIn&flowEntry=SignUp&hl=en', { waitUntil: 'load', timeout: 0 })

        console.log('Page Load Success')

        await page.screenshot({
            path: 'screenshot.jpg'
        })

        process.exit(0)
    } catch (error) {
        console.log(error)
    }
}
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const asciify = require('asciify-image')
const axios = require('axios')
const fs = require('fs')


let browser = null
let page = null

let mUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2dtYWlsLw==', 'base64').toString('ascii')

puppeteer.use(StealthPlugin())

browserStart()

async function browserStart() {

    try {
        console.log('Start Browser')

        browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome-stable',
            headless: false,
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-skip-list',
                '--disable-dev-shm-usage',
                '--user-agent='+mUserAgent
            ]
        })
    
        page = (await browser.pages())[0]

        await page.evaluateOnNewDocument((userAgent) => {
            Object.defineProperty(navigator, 'platform', { get: () => 'Win32' })
            Object.defineProperty(navigator, 'productSub', { get: () => '20100101' })
            Object.defineProperty(navigator, 'vendor', { get: () => '' })
            Object.defineProperty(navigator, 'oscpu', { get: () => 'Windows NT 10.0; Win64; x64' })

            let open = window.open

            window.open = (...args) => {
                let newPage = open(...args)
                Object.defineProperty(newPage.navigator, 'userAgent', { get: () => userAgent })
                return newPage
            }

            window.open.toString = () => 'function open() { [native code] }'

        }, mUserAgent)

        await page.setUserAgent(mUserAgent)

        page.on('console', msg => {
            let text = msg.text()
            if (text.startsWith('Click:')) {
                console.log(text)
            }
        })

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

        await getZagl('https://za.gl/V2PoW')

        console.log('----COMPLETED----', 1)

        await getFiveSecond('http://festyy.com/ehD5hw', 'span[class="skip-btn show"]', '#skip_button')

        console.log('----COMPLETED----', 2)

        await getFiveSecond('https://adfoc.us/84368198903866', '#showTimer[style="display: none;"]', '#showSkip > a')
 
        console.log('----COMPLETED----', 3)

        process.exit(0)
    } catch (error) {
        console.log(error)
    }
}

async function getZagl(url) {
    await page.goto(url, { waitUntil: 'load', timeout: 0 })
    console.log('Page Load Finish')
    await waitFor('#greendot')

    let mSuccess = false

    let timeout = 0

    while (true) {
        timeout++

        try {
            let base64 = await page.evaluate(() => {
                let root = document.querySelector('#greendot > img')
                if (root) {
                    return root.src
                }
                return null
            })
        
            let data = await page.evaluate(() => {
                let root = document.querySelector('#greendot')
                if (root) {
                    return { weight:root.scrollWidth, height:root.scrollHeight }
                }
                return null
            })

            console.log(data)
        
            fs.writeFileSync('image.png', base64.replace(/^data:image\/png;base64,/, ''), 'base64')
        
            let asciified = await getAsiified('image.png', data)
        
            let line = asciified.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,"").split('\n')
        
            let dataX = -1
            let dataY = -1
        
            for (let i = 0; i < line.length; i++) {
                try {
                    let word = line[i].split('')
                    for (let j = 0; j < word.length; j++) {
                        if (word[j] != '@') {
                            if (dataY < 0) {
                                dataY = i
                            }
                            if (dataX < 0) {
                                dataX = j
                            }
                            if (dataX > j) {
                                dataX = j
                            }
                        }
                    }
                } catch (error) {}
            }

            console.log(dataX/2, dataY)
        
            await page.evaluate((X, Y) => {
                let posX = X;
                let posY = Y;
                $(document).ready(function() {
                    $('#greendot').click(function(e) {
                        var imgWR = 300/$("#greendot")[0].offsetWidth;
                        var imgHR = 300/$("#greendot")[0].offsetHeight;
                        var offset = $(this).offset();
                        var X = (e.pageX - offset.left);
                        var Y = (e.pageY - offset.top);
                            X *= imgWR;
                            Y *= imgHR;
                        var newX = posX+25;
                        var newY = posY+25;
                        $('#x').val(newX)
                        $('#y').val(newY)
                    })
                })
            }, dataX/2, dataY)
        
            await page.click('#greendot')

            while (true) {
                try {
                    await page.bringToFront()

                    let error = await exists('div[class="alert alert-danger"]')

                    if (error) {
                        break
                    } else {
                        mSuccess = await page.evaluate(() => {
                            let root = document.querySelector('a[class="btn btn-success btn-lg get-link"]')
                            if (root) {
                                root.click()
                                return true
                            }
                            return false
                        })

                        if (mSuccess) {
                            break
                        }
                    }
                } catch (error) {}

                await delay(1000)
            }
        } catch (error) {}

        if (mSuccess) {
            break
        }

        if(timeout > 4) {
            break
        }

        await delay(1000)
    }
    
    await delay(1000)
    await closeAllPage()

    console.log('Success')
}

async function getFiveSecond(url, first, second) {
    await page.goto(url, { waitUntil: 'load', timeout: 0 })
    console.log('Page Load Finish')

    let _timeout = 0

    while (true) {
        await delay(1000)
        let timeout = 0
        _timeout++

        while (true) {
            timeout++
            try {
                let skip = await exists(first)
    
                if (skip) {
                    timeout = 0
                    break
                }
            } catch (error) {}
    
            if (timeout > 10) {
                timeout = 99
                break
            }
            await delay(1000)
        }
    
        if (timeout == 99) {
            await page.goto(url, { waitUntil: 'load', timeout: 0 })
        } else {
            timeout = 0
            while (true) {
                timeout++
                try {
                    let skip = await exists(second)
        
                    if (skip) {
                        await page.bringToFront()
                        await delay(250)
                        await page.click(second)
                    } else {
                        timeout = 0
                        break
                    }
                } catch (error) {
                    timeout = 0
                    break
                }

                if (timeout > 10) {
                    timeout = 99
                    break
                }
        
                await delay(500)
            }

            if (timeout == 99) {
                await page.goto(url, { waitUntil: 'load', timeout: 0 })
            } else {
                break
            }
        }

        if (_timeout > 3) {
            break
        }
    }

    await delay(1000)
    await closeAllPage()
    console.log('Load Success')
}

async function getOuo(url) {
    await page.goto(url, { waitUntil: 'load', timeout: 0 })
    console.log('Page Load Finish')

    await delay(2000)


    let frames = await page.frames()
    let challenge = frames.find(frame => frame.url().includes('challenges.cloudflare.com'))
    
    if (challenge) {
        await delay(2000)
        let vetify = await challenge.$('input[type="checkbox"]')
        await vetify.click()
        console.log('Click')           
    } else {
        console.log('Frame Null')
    }

    let _timeout = 0

    // await delay(1000)
    // await closeAllPage()
    console.log('Load Success')
}

async function getAsiified(path, data) {
    return new Promise(function(resolve) {
        asciify(path, {
            fit: 'box',
            width: data['weight'],
            height: data['height']
        }).then(function (asciified) {
            try {
                fs.unlinkSync(path)
            } catch (error) {}

            resolve(asciified)
        }).catch(function (err) {
            resolve(null)
        })
    })
}

async function closeAllPage() {
    let pages =  await browser.pages()

    await pages[0].goto('about:blank')

    for (let i = 1; i < pages.length; i++) {
        try {
            await pages[i].goto('about:blank')
            await delay(500)
            await pages[i].close()
        } catch (error) {}
    }
}

async function waitFor(element) {
    while (true) {
        await delay(1000)

        try {
            let has = await exists(element)

            if (has) {
                break
            }
        } catch (error) {}
    }
}

async function exists(element) {
    return await page.evaluate((element) => {
        let root = document.querySelector(element)
        if (root) {
            return true
        }
        return false
    }, element)
}


function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}

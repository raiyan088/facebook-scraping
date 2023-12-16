const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')
const fs = require('fs')


let browser = null
let page = null
let IP = null

let mUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2dtYWlsLw==', 'base64').toString('ascii')

puppeteer.use(StealthPlugin())

startWork()

async function startWork() {
    try {
        let api = await getAxios('http://ip-api.com/json')
        let data = api.data
        IP = data['query']
        console.log('------'+data['countryCode']+'-------')
        
        let key = IP.replace(/[.]/g, '_')
        let mIP = await getAxios(BASE_URL+'ip/'+key+'.json')

        if (mIP.data && mIP.data != 'null') {
            if (mIP.data['time'] < parseInt(new Date().getTime()/1000)) {
                browserStart()
            } else {
                console.log('---IP-CHANGE---')
                process.exit(0)
            }
        } else {
            browserStart()
        }
    } catch (error) {
        console.log('-----ERROR-----')
        process.exit(0)
    }
}

async function browserStart() {

    try {
        console.log('-----START-----')

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

        // page.on('console', async (msg) => {
        //     const txt = msg.text()
        //     console.log(txt)
        // })

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

        await page.goto('https://www.google.com/recaptcha/api2/demo', { waitUntil: 'load', timeout: 0 })
        await delay(500)

        let status = await solveRecaptchas()

        console.log(status)

        process.exit(0)
    } catch (error) {
        console.log(error)
        console.log('-----ERROR-----')
        process.exit(0)
    }
}

async function solveRecaptchas() {

    try {
        let frames = await page.frames()
        let mSecend = false
        const recaptchaFrame = frames.find(frame => frame.url().includes('api2/anchor'))
        
        const checkbox = await recaptchaFrame.$('#recaptcha-anchor')
        await checkbox.click()
        let hasBframe = false

        for(let i=0; i<10; i++) {
            await delay(500)
            const value = await page.evaluate(() => {
                return document.querySelector('iframe[src*="api2/bframe"]')
            })
            if(value) {
                i = 10
                hasBframe = true
            }
        }

        if(hasBframe) {
            frames = await page.frames()
            const imageFrame = frames.find(frame => frame.url().includes('api2/bframe'))
            let hasAudioButton = false

            for(let i=0; i<10; i++) {
                await delay(500)
                const value = await imageFrame.evaluate(() => {
                    var audio = document.querySelector('#recaptcha-audio-button')
                    if(audio) {
                        audio.click()
                        return true
                    } else {
                        return null
                    }
                })
                
                if(value) {
                    i = 10
                    hasAudioButton = true
                }
            }

            if(hasAudioButton) {
                while (true) {
                    const audioLink = await imageFrame.evaluate(() => {
                        let root = document.querySelector('#audio-source')
                        if (root) {
                            return root.src
                        }
                        return null
                    })
                    
                    if(audioLink) {
                        const audioBytes = await imageFrame.evaluate(audioLink => {
                            return (async () => {
                                const response = await window.fetch(audioLink)
                                const buffer = await response.arrayBuffer()
                                return Array.from(new Uint8Array(buffer))
                            })()
                        }, audioLink)

                        const response = await axios({
                            mode: 'cors',
                            method: 'post',
                            url: 'https://api.wit.ai/speech?v=20221114',
                            data: new Uint8Array(audioBytes).buffer,
                            headers: {
                                Authorization: 'Bearer JVHWCNWJLWLGN6MFALYLHAPKUFHMNTAC',
                                'Content-Type': 'audio/mpeg3'
                            }
                        })

                        let audioTranscript = null
                  
                        try{
                            let list = response.data.match(/"text": "(.*)",/g)
                            try {
                                if (list.length > 0) {
                                    let match = list[list.length-1].match('"text": "(.*)"')
                                    audioTranscript = match[1]
                                }
                            } catch (error) {}

                            if (audioTranscript == null) {
                                audioTranscript = response.data.match('"text": "(.*)",')[1].trim()
                            }
                        } catch(e) {
                            const reloadButton = await imageFrame.$('#recaptcha-reload-button')
                            await reloadButton.click()
                            continue
                        }

                        const input = await imageFrame.$('#audio-response')
                        await input.click()
                        await input.type(audioTranscript)
                  
                        const verifyButton = await imageFrame.$('#recaptcha-verify-button')
                        await verifyButton.click()

                        try {
                            let success = false

                            for (let i = 0; i < 3; i++) {
                                await delay(500)
                                success = await page.evaluate(() => {
                                    let root = document.querySelector('#g-recaptcha-response')
                                    if (root && root.value.length > 10) {
                                        return true
                                    }
                                    return false
                                })

                                if (success) {
                                    i = 3
                                }
                            }

                            if(success) {
                                return 'success'
                            } else {
                                continue
                            }
                        } catch (e) {
                            return 'success'
                        }
                    } else {
                        await delay(500)
                        const block = await imageFrame.evaluate(() => {
                            return document.querySelector('div[class="rc-doscaptcha-header"]')
                        })
                        if(block) {
                            return 'block'
                        } else {
                            continue
                        }
                    }
                }
            } else {
                return 'error'
            }
        } else {
            return 'success'
        }
    } catch (e) {
        return 'error'
    }
}

async function saveData() {
    try {
        let key = IP.replace(/[.]/g, '_')
        let value = {
            time: parseInt(new Date().getTime()/1000)+21600,
            add: 0
        }

        await patchAxios(BASE_URL+'ip/'+key+'.json', JSON.stringify(value), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    } catch (error) {
        console.log('-----ERROR-----')
    }
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

async function getAxios(url) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            responce = await axios.get(url, {
                timeout: 10000
            })
            break
        } catch (error) {
            loop++

            if (loop >= 5) {
                break
            } else {
                await delay(3000)
            }
        }
    }
    return responce
}

async function patchAxios(url, body, data) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            data.timeout = 10000
            responce = await axios.patch(url, body, data)
            break
        } catch (error) {
            loop++

            if (loop >= 5) {
                break
            } else {
                await delay(3000)
            }
        }
    }
    return responce
}


function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}

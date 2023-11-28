const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')
const fs = require('fs')


let NUMBER = false
let FIVE_NUMBER_FIRST = false
let TARGET = 10


let mDomain = 'outlook'
//let mDomain = 'yahoo'
let NAME = 'english'


let mName = []
let page = null
let mAddAccount = 0
let mRecovery = []
let mGmail = []
let IP = null
let mError = 0
let mUserError = 0
let COUNTRY = null
let USER = null
let BYPASS = true
let SERVER = 'regular'

if (NUMBER) {
    SERVER = 'customise'
} else if (FIVE_NUMBER_FIRST) {
    SERVER = 'five'
}

let mUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'

let mStart = new Date().getTime()+90000

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2dtYWlsLw==', 'base64').toString('ascii')

puppeteer.use(StealthPlugin())

setInterval(async() => {
    if (mStart < new Date().getTime()) {                                    
        try {
            await page.close()
            await delay(1000)

            mStart = new Date().getTime()+30000
            
            if (mAddAccount < TARGET) {
                browserStart()
            } else {
                console.log('|*|-IP CHANGE-')
                process.exit(0)
            }
        } catch (error) {
            console.log('|*|---ERROR---')
            process.exit(0)
        }
    }
}, 20000)

console.log('|R|---START---|R|')
console.log('|X|---'+getStringTime()+'---')

startWork()

async function startWork() {
    try {
        mRecovery = JSON.parse(fs.readFileSync('recovery.json'))

        mName = await getNameList()

        if (NUMBER) {
            mGmail = await getGmailList()
        }

        if (mName.length > 0) {
            try {
                let api = await getAxios('http://ip-api.com/json')
                let data = api.data
                IP = data['query']

                COUNTRY = data['countryCode']

                console.log('|T|----'+COUNTRY+'-----')
                
                let key = IP.replace(/[.]/g, '_')
                let mIP = await getAxios(BASE_URL+'ip/'+key+'.json')

                if (mIP.data && mIP.data != 'null') {
                    if (mIP.data['time'] < parseInt(new Date().getTime()/1000)) {
                        mAddAccount = 0
                    } else {
                        mAddAccount = mIP.data['add']
                    }
                } else {
                    mAddAccount = 0
                }

                if (mAddAccount < TARGET) {
                    browserStart()
                } else {
                    console.log('|*|-IP CHANGE-')
                    process.exit(0)
                }
            } catch (error) {
                console.log('|*|---ERROR---')
                process.exit(0)
            }
        } else {
            console.log('|*|--N: NULL--')
            process.exit(0)
        }
    } catch (error) {
        console.log('|*|---ERROR---')
        process.exit(0)
    }
}


async function browserStart() {

    try {
        mStart = new Date().getTime()+90000

        let browser = await puppeteer.launch({
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

        await page.setRequestInterception(true);

        page.on('request', (request) => {
            if (BYPASS) {
                if (request.url().startsWith('https://accounts.google.com/_/signup/validatepassword')) {
                    BYPASS = false
                    setTimeout(async() => {
                        await setPasswordResponse(request)
                    }, 0)
                } else {
                    request.continue()
                }
            } else {
                request.continue()
            }
        })

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

        await createAccount()
        
    } catch (error) {
        console.log('|*|---ERROR---')
        process.exit(0)
    }
}

async function createAccount() {
    console.log('|*|-START: '+getAccountSize(1)+'-')

    if(mName.length == 0) {
        mName = await getNameList()
    }

    USER = await getUserName(mName[0].toLowerCase().replace(/[^a-z]/g, ''), getRandomNumber(2,4), true)
    if (NUMBER) {
        USER = mGmail[0].replace('@gmail.com', '').toString()
    } else if (FIVE_NUMBER_FIRST) {
        USER = await getUserName(mName[0].toLowerCase().replace(/[^a-z]/g, ''), getRandomNumber(5,5), false)
    }

    mUserError = 0
    BYPASS = true

    let recovery = mRecovery[Math.floor((Math.random() * mRecovery.length))]
    let name = mName[0].split(' ')
    let map = {}
    map['password'] = getRandomPassword()
    map['recovery'] = recovery+'@'+mDomain+'.com'
    map['create'] = parseInt(new Date().getTime()/1000)

    await page.goto('https://accounts.google.com/signup/v2/createaccount?continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&theme=glif&flowName=GlifWebSignIn&flowEntry=SignUp&hl=en', { waitUntil: 'load', timeout: 0 })
    await delay(500)
    await page.type('#firstName', name[0])
    await delay(500)
    await page.type('#lastName', name[1])
    await delay(500)
    await page.click('#collectNameNext')
    let success = await waitForPage(1)
    if (success) {
        let year = getRandomYear()
        let month = getRandomMonth()
        let day = getRandomDay()
        let next = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]'
        let input = 'input[class="whsOnd zHQkBf"]'
        await delay(1000)
        await page.select('#month', month)
        await delay(500)
        await page.type('#day', day)
        await delay(500)
        await page.type('#year', year)
        await delay(500)
        await page.select('#gender', '1')
        await delay(500)
        await page.click(next)
        success = await waitForPage(2)
        if (success) {
            let custom = await exists('div[data-value="custom"]')
            if (custom) {
                await page.click('div[data-value="custom"]')
                await delay(500)
            }
            await page.type(input, USER)
            await delay(500)
            await page.click(next)
            success = await waitForUser()
            if (success) {
                await page.type('input[name="Passwd"]', map['password'])
                await delay(500)
                await page.type('input[name="PasswdAgain"]', map['password'])
                await delay(500)
                await page.click(next)
                success = await waitForPage(3)
                if (success) {
                    let button = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-INsAgc VfPpkd-LgbsSe-OWXEXe-dgl2Hf Rj2Mlf OLiIxf PDpWxe P62QJc LQeN7 xYnMae TrZEUc lw1w4b"]'
                    await delay(500)
                    await page.type('#recoveryEmailId', map['recovery'])
                    await delay(500)
                    await page.click(button)
                    success = await waitForPage(4)
                    if (success) {
                        await delay(500)
                        await waitForSkip()
                        success = await waitForPage(5)
                        if (success) {
                            await page.click(next)
                            await page.waitForNavigation({ waitUntil: ['load'] })
                            success = await waitForConfirm()
                            if (success) {
                                await delay(500)
                                await page.click(next)
                                await delay(1000)
                                await dialogConfirm()
                                success = await waitForPage(7)
                                if (success) {
                                    await delay(1000)
                                    await page.goto('https://myaccount.google.com/phone', { waitUntil: 'load', timeout: 0 })
                                    await saveData(USER, map)
                                    await delay(1000)
                                    await page.close()
                                    await delay(1000)

                                    mStart = new Date().getTime()+30000

                                    console.log('|*|--END: '+getAccountSize(0)+'--')
                                    console.log('|*|---'+getStringTime()+'---')

                                    mError = 0
                                    
                                    try {
                                        if (mAddAccount < TARGET) {
                                            browserStart()
                                        } else {
                                            console.log('|*|-IP CHANGE-')
                                            process.exit(0)
                                        }
                                    } catch (error) {
                                        console.log('|*|---ERROR---')
                                        process.exit(0)
                                    }
                                } else {
                                    console.log('|*|-TIMEOUT:9-')
                                    await errorHandling()
                                }
                            } else {
                                console.log('|*|-TIMEOUT:8-')
                                await errorHandling()
                            }
                        } else {
                            console.log('|*|-TIMEOUT:7-')
                            await errorHandling()
                        }
                    } else {
                        console.log('|*|-TIMEOUT:6-')
                        await errorHandling()
                    }
                } else {
                    console.log('|*|-TIMEOUT:5-')
                    await errorHandling()
                }
            } else {
                console.log('|*|-TIMEOUT:4-')
                await errorHandling()
            }
        } else {
            console.log('|*|-TIMEOUT:3-')
            await errorHandling()
        }
    } else {
        console.log('|*|-TIMEOUT:2-')
        await errorHandling()
    }
}

async function errorHandling() {
    try {
        await errorCapture()
        mError++

        if (mError > 3 || (NUMBER && mGmail.length == 0)) {
            console.log('|*|-IP CHANGE-')
            process.exit(0)
        } else {
            await page.close()
            await delay(1000)
    
            mName.shift()
            mAddAccount++
            if (NUMBER) {
                mGmail.shift()
            }
    
            if (mAddAccount < TARGET) {
                browserStart()
            } else {
                console.log('|*|-IP CHANGE-')
                process.exit(0)
            }
        }
    } catch (error) {
        console.log('|*|---ERROR---')
        process.exit(0)
    }
}

async function waitForPage(type) {
    let timeout = 0

    while (true) {
        timeout++
        await delay(1000)
        try {
            let url = await page.url()
            if (type == 0 && url.startsWith('https://accounts.google.com/lifecycle/steps/signup/name')) {
                let data = await exists('#firstName')
                if (data) {
                    timeout = 0
                    break
                }
            } else if (type == 1 && url.startsWith('https://accounts.google.com/lifecycle/steps/signup/birthdaygender') || url.startsWith('https://accounts.google.com/signup/v2/birthdaygender')) {
                let data = await exists('#gender')
                if (data) {
                    timeout = 0
                    break
                }
            } else if (type == 2 && url.startsWith('https://accounts.google.com/signup/v2/createusername')) {
                let data = await exists('#domainSuffix')
                if (data) {
                    timeout = 0
                    break
                }
            } else if (type == 3 && url.startsWith('https://accounts.google.com/signup/v2/addrecoveryemail')) {
                let data = await exists('#recoveryEmailId')
                if (data) {
                    timeout = 0
                    break
                }
            } else if (type == 4 && url.startsWith('https://accounts.google.com/signup/v2/phonecollection')) {
                let data = await exists('#phoneNumberId')
                if (data) {
                    timeout = 0
                    break
                }
            } else if ((type == 4 || type == 5) && url.startsWith('https://accounts.google.com/signup/v2/confirmation')) {
                let data = await exists('div[class="wLBAL"]')
                if (data) {
                    timeout = 0
                    break
                }
            } else if(type == 6 && url.startsWith('https://accounts.google.com/lifecycle/steps/signup/termsofservice')) {
                let data = await exists('#headingText')
                if (data) {
                    timeout = 0
                    break
                }
            } else if(type == 7) {
                timeout++
                await delay(1000)

                if (url.startsWith('https://myaccount.google.com/phone')) {
                    timeout = 0
                    break
                } else {
                    try {
                        let OSID = 0
                        let cookies = await page.cookies()
        
                        for (let i = 0; i < cookies.length; i++) {
                            if (cookies[i]['name'] == 'SSID') {
                                OSID++
                            } else if (cookies[i]['name'] == 'HSID') {
                                OSID++
                            } else if (cookies[i]['name'] == 'APISID') {
                                OSID++
                            }
                        }
        
                        if (OSID == 3) {
                            timeout = 0
                            break
                        }
                    } catch (error) {}
                }
            } else if (type == 8 && url.startsWith('https://accounts.google.com/lifecycle/steps/signup/expresssettings')) {
                let data = await exists('#headingText')
                if (data) {
                    timeout = 0
                    break
                }
            } else if (type == 9 && url.startsWith('https://accounts.google.com/lifecycle/steps/signup/confirmpersonalizationsettings')) {
                let data = await exists('#headingText')
                if (data) {
                    timeout = 0
                    break
                }
            }

            if (timeout >= 30) {
                timeout = 99
                break
            }
        } catch (error) {}
    }
    await delay(1000)

    return timeout == 0
}

async function waitForUser() {
    let timeout = 0

    while (true) {
        timeout++
        await delay(1000)
        try {
            let url = await page.url()
            if (url.startsWith('https://accounts.google.com/signup/v2/createpassword')) {
                let data = await exists('input[name="Passwd"]')
                if (data) {
                    timeout = 0
                    break
                }
            } else {
                let error = await exists('div[class="o6cuMc Jj6Lae"]')
                if (error) {
                    let next = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]'
                    let input = 'input[class="whsOnd zHQkBf"]'
                    if (NUMBER) {
                        timeout = 0
                        mGmail.shift()
                        if (mGmail.length > 0) {
                            mStart = new Date().getTime()+80000
                            USER = mGmail[0].replace('@gmail.com', '').toString()
                            let input = 'input[class="whsOnd zHQkBf"]'
                            await page.focus(input)
                            await page.keyboard.down('Control')
                            await page.keyboard.press('A')
                            await page.keyboard.up('Control')
                            await page.keyboard.press('Backspace')
                            await delay(200)
                            await page.keyboard.type(USER)
                            await delay(500)
                            await page.click(next)
                        } else {
                            timeout = 99
                            break
                        }
                    } else {
                        mUserError++
                        if (mUserError > 3) {
                            mUserError = 3
                        }

                        if (FIVE_NUMBER_FIRST) {
                            USER = await getUserName(mName[0].toLowerCase().replace(/[^a-z]/g, ''), getRandomNumber(5,5), false)
                        } else {
                            USER = await getUserName(mName[0].toLowerCase().replace(/[^a-z]/g, ''), getRandomNumber(2+mUserError,4+mUserError), true)
                        }

                        mStart = new Date().getTime()+80000
                        await page.focus(input)
                        await page.keyboard.down('Control')
                        await page.keyboard.press('A')
                        await page.keyboard.up('Control')
                        await page.keyboard.press('Backspace')
                        await delay(200)
                        await page.keyboard.type(USER)
                        await delay(500)
                        await page.click(next)
                    }
                }
            }

            if (timeout >= 30) {
                timeout = 99
                break
            }
        } catch (error) {}
    }
    await delay(1000)

    return timeout == 0
}

async function waitForConfirm() {
    let timeout = 0

    while (true) {
        timeout++
        await delay(1000)
        try {
            let url = await page.url()
            if(url.startsWith('https://accounts.google.com/lifecycle/steps/signup/termsofservice')) {
                let data = await exists('#headingText')
                if (data) {
                    timeout = 1
                    break
                }
            } else if (url.startsWith('https://accounts.google.com/lifecycle/steps/signup/personalizationchoice')) {
                let data = await exists('#headingText')
                if (data) {
                    timeout = 2
                    break
                }
            }

            if (timeout >= 30) {
                timeout = 99
                break
            }
        } catch (error) {}
    }

    if (timeout == 1) {
        await delay(1000)
        return true
    } else if (timeout == 99) {
        return false
    } else if (timeout == 2) {
        await page.click('div[class="zJKIV y5MMGc sD2Hod"]')
        await delay(500)
        await page.click('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]')
        let success = await waitForPage(8)
        if (success) {
            await page.evaluate(() => {
                try {
                    let root = document.querySelectorAll('[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-INsAgc VfPpkd-LgbsSe-OWXEXe-dgl2Hf Rj2Mlf OLiIxf PDpWxe P62QJc LQeN7 xYnMae TrZEUc lw1w4b"]')
                    if(root && root.length > 0) {
                        root[root.length-1].click()
                    }
                } catch (error) {}
            })

            success = await waitForPage(9)
            if (success) {
                await page.evaluate(() => {
                    try {
                        let root = document.querySelectorAll('[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-INsAgc VfPpkd-LgbsSe-OWXEXe-dgl2Hf Rj2Mlf OLiIxf PDpWxe P62QJc LQeN7 xYnMae TrZEUc lw1w4b"]')
                        if(root && root.length > 0) {
                            root[root.length-1].click()
                        }
                    } catch (error) {}
                })

                return await waitForPage(6)
            }
        }
    }

    return false
}


async function setPasswordResponse(request) {

    let body = request.postData()

    if (body.includes('null%2Cnull%2C0%2C1%2C0%2C0%5D')) {
        body = body.replace('null%2Cnull%2C0%2C1%2C0%2C0%5D', 'null%2cnull%2c0%2c0%2c0%2c0%5d')
    }

    await page.evaluate((url, body) => {
        fetch(url, {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
                "google-accounts-xsrf": "1",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-client-data": "CKCPywE=",
                "x-same-domain": "1"
            },
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": body,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        }).then((response) => response.text()).then((text) => {
            document.response = JSON.stringify({ 
                ok:true,
                body: text
            })
        }).catch((error) => {
            document.response = JSON.stringify({ ok:false })
        })
    }, request.url(), body)

    let mOutput = ''

    while (true) {
        try {
            let data = await page.evaluate(() => document.response)
            
            if (data) {
                let json = JSON.parse(data)
                if (json['ok']) {
                    mOutput = json['body']
                }
                break
            }
        } catch (error) {}
        await delay(500)
    }

    let contentType = 'application/json; charset=utf-8'

    request.respond({
        ok: true,
        status: 200,
        contentType,
        body: mOutput,
    })
}

async function waitForSkip() {
    await page.evaluate(() => {
        try {
            let root = document.querySelectorAll('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-INsAgc VfPpkd-LgbsSe-OWXEXe-dgl2Hf Rj2Mlf OLiIxf PDpWxe P62QJc LQeN7 xYnMae TrZEUc lw1w4b"]')
            if (root && root.length > 0) {
                root[root.length-1].click()
            }
        } catch (error) {}
    })
}

async function dialogConfirm() {
    let data = await exists('div[class="XfpsVe J9fJmf"]')
    if (data) {
        await page.click('div[class="XfpsVe J9fJmf"] > div[data-id="ssJRIf"]')
    }
}

async function exists(evement) {
    let loading = await page.evaluate(() => {
        let root = document.querySelector('#initialView[aria-busy="true"]')
        if (root) {
            return true
        }
        return false
    })

    if (loading) {
        return false
    }
    
    return await page.evaluate((evement) => {
        let root = document.querySelector(evement)
        if (root) {
            return true
        }
        return false
    }, evement)
}

async function saveData(user, map) {
    try {
        mName.shift()
        mAddAccount++
        let key = IP.replace(/[.]/g, '_')
        let value = null

        if (COUNTRY != 'US' && COUNTRY != 'us') {
            value = {
                time: parseInt(new Date().getTime()/1000)+21600,
                add: mAddAccount
            }
        } else {
            value = {
                time: parseInt(new Date().getTime()/1000)+86400,
                add: mAddAccount
            }
        }

        await patchAxios(BASE_URL+SERVER+'/'+user+'.json', JSON.stringify(map), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        await patchAxios(BASE_URL+'ip/'+key+'.json', JSON.stringify(value), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        fs.writeFileSync('temp_name.json', JSON.stringify(mName))

        if (NUMBER) {
            mGmail.shift()
            fs.writeFileSync('temp_gmail.json', JSON.stringify(mGmail))
        }
    } catch (error) {
        console.log('|*|---ERROR---')
    }
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

async function getNameList() {
    let output = []
    try {
        output = JSON.parse(fs.readFileSync('temp_name.json'))
    } catch (error) {}

    if (output.length > 0) {
        return output
    }

    let response = await getAxios(BASE_URL+'name/'+NAME+'.json?orderBy=%22list%22&limitToLast=20&print=pretty')

    try {
        let list = []
        for (let key of Object.keys(response.data)) {
            list.push(key)
        }
        let name =  list[Math.floor((Math.random() * list.length))]
        try {
            await axios.delete(BASE_URL+'name/'+NAME+'/'+name+'.json')
        } catch (error) {}

        output = response.data[name]['list']

        fs.writeFileSync('temp_name.json', JSON.stringify(output))
    } catch (error) {}

    if (output.length > 0) {
        return output
    }

    await delay(30000)
    console.log('|*|--N-ERROR--')

    return await getNameList()
}

async function getGmailList() {
    let output = []
    try {
        output = JSON.parse(fs.readFileSync('temp_gmail.json'))
    } catch (error) {}

    if (output.length > 0) {
        return output
    }

    let response = await getAxios(BASE_URL+'number.json?orderBy=%22list%22&limitToFirst=20&print=pretty')

    try {
        let list = []
        for (let key of Object.keys(response.data)) {
            list.push(key)
        }
        let name =  list[Math.floor((Math.random() * list.length))]
        try {
            await axios.delete(BASE_URL+'number/'+name+'.json')
        } catch (error) {}

        output = response.data[name]['list']

        fs.writeFileSync('temp_gmail.json', JSON.stringify(output))
    } catch (error) {}

    if (output.length > 0) {
        return output
    }

    await delay(30000)
    console.log('|*|--G-ERROR--')

    return await getGmailList()
}

async function errorCapture() {
    try {
        await page.screenshot({
            path: 'screenshot.jpg'
        })
        let content = await page.content()
        fs.writeFileSync('timeout', content)
    } catch (error) {}
}

async function getUserName(name, number, noChange) {
    if (noChange) {
        if (name.length > 11) {
            return name.substring(0, 11)+number
        }
        return name+number
    }
    return number+name
}


function getRandomNumber(start, end) {
    let N = ['0','1','2','3','4','5','6','7','8','9']
    let user = ''

    let random = Math.floor((Math.random() * ((end-start)+1)))+start

    for (let i = 0; i < random; i++) {
        user += N[Math.floor((Math.random() * 10))]
    }
    
    return user
}

function getRandomPassword() {
    let C = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9']
    
    let random = Math.floor((Math.random() * 5))+8
    let pass = ''

    for (let i = 0; i < random; i++) {
        pass += C[Math.floor((Math.random() * C.length))]
    }

    return pass
}

function getRandomYear() {
    let N = ['1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999', '2000', '2001', '2002']
    return  N[Math.floor((Math.random() * 15))]
}

function getRandomMonth() {
    return  (Math.floor((Math.random() * 11))+1).toString()
}

function getRandomDay() {
    return  (Math.floor((Math.random() * 28))+1).toString()
}

function getStringTime() {
    var d = new Date(),
        hour = ''+d.getHours(),
        minute = ''+d.getMinutes()

    if (hour.length < 2) 
        hour = '0' + hour
    if (minute.length < 2) 
        minute = '0' + minute

    return [hour, minute].join(':')
}

function getAccountSize(add) {
    let size = ''+(mAddAccount+add)
    if (size.length == 1) {
        return '0'+size
    }
    return size
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}

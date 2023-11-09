const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')
const fs = require('fs')


let browser = null
let page = null
let mName = []
let mAddAdmin = {}
let mFBdata = {}
let cookies = null
let mCookies = {}
let mHeaders = {}
let mPostData = {}
let m = []
let mLogStart = false

let USER = null
let mPicture = true

let PASSWORD = null

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2dtYWlsLw==', 'base64').toString('ascii')


puppeteer.use(StealthPlugin())


try {
    mName = JSON.parse(fs.readFileSync('fb_name.json'))
    try {
        mFBdata = JSON.parse(fs.readFileSync('fb_data.json')) 
    } catch (error) {
        mFBdata = {}
    }
    browserStart()
} catch (e) {
    console.log(e)
}

async function browserStart() {

    try {
        console.log('Browser Start')

        browser = await puppeteer.launch({
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

        page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

        await createFacebook()
        
    } catch (error) {
       console.log(error)
    }
}


async function createFacebook2() {

    let cookie = mFBdata['panding']
    if (cookie) {
        cookie = cookie['cookies']
    }

    if (cookie) {
        await page.setCookie(...cookie)
    } else {
        let name = mName[0].split(' ')
        let password = getRandomPassword()
        //let gmail = mList[18]
        let gmail = mName[0].toLowerCase().replace(/[^a-z]/g, '')+getRandomNumber()
                
        let value = getRandomDay()+'%7C'+getRandomMonth()+'%7C'+getRandomYear()+'%7C2%7C'+encodeURIComponent(gmail+'@1secmail.com')+'%7C'+encodeURIComponent(name[0])+'%7C'+encodeURIComponent(name[1])+'%7C'+encodeURIComponent(name[0])+'+'+encodeURIComponent(name[1])
        await page.setCookie(...[{"name":"rs","value":value,"domain":".facebook.com","path":"/","expires":1729430232.044431,"size":value.length,"httpOnly":true,"secure":true,"session":false,"sameSite":"None","sameParty":false,"sourceScheme":"Secure","sourcePort":443}])
        await page.goto('https://facebook.com', { waitUntil: 'load', timeout: 0 })

        
        console.log(gmail, password)
        console.log('xxx');


        await page.click('a[data-testid="open-registration-form-button"]')
        await waitForBox()
        await delay(500)
        await page.type('#password_step_input', password)
        await delay(500)
        await page.click('button[name="websubmit"]')
        let status = await waitForCreate()
        console.log(status)
        if (status == 1 || status == 2) {
            console.log('Create Success')

            let cookies = await page.cookies()
            let time = parseInt(new Date().getTime()/1000)

            mFBdata['panding'] = {
                user: gmail,
                pass: password,
                time: time,
                cookies: cookies
            }

            fs.writeFileSync('fb_data.json', JSON.stringify(mFBdata))

        }
    }
}

async function createFacebook() {

    await page.setUserAgent('Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36')

    let cookie = mFBdata['panding']
    if (cookie) {
        cookie = cookie['cookies']
    }

    if (cookie) {
        await page.setCookie(...cookie)
    } else {
        await page.goto('https://mbasic.facebook.com/reg/', { waitUntil: 'load', timeout: 0 })

        let name = mName[0].split(' ')
        let password = getRandomPassword()
        let gmail = mName[0].toLowerCase().replace(/[^a-z]/g, '')+getRandomNumber()
        console.log(gmail, password)

        await delay(500)
        await page.type('input[name="firstname"]', name[0])
        await delay(500)
        await page.type('input[name="lastname"]', name[1])
        await delay(500)
        await page.type('#contactpoint_step_input', gmail+'@vjuum.com')
        await delay(500)
        await page.click('#sex[value="2"]')
        await delay(500)
        await page.select('#day', getRandomDay())
        await delay(500)
        await page.select('#month', getRandomMonth())
        await delay(500)
        await page.select('#year', getRandomYear())
        await delay(500)
        await page.type('#password_step_input', password)
        await delay(500)
        await page.click('#signup_button')
        let status = await waitForCreate()
        if (status == 1 || status == 2) {
            console.log('Create Success')

            let cookies = await page.cookies()
            let time = parseInt(new Date().getTime()/1000)

            mFBdata['panding'] = {
                user: gmail,
                pass: password,
                time: time,
                cookies: cookies
            }

            fs.writeFileSync('fb_data.json', JSON.stringify(mFBdata))

            await delay(1000000)

            if (status == 1) {
                await waitForSaveDevice()

                let cookies = await page.cookies()

                mFBdata['panding'] = {
                    user: '',
                    pass: password,
                    time: time,
                    cookies: cookies
                }

                fs.writeFileSync('fb_data.json', JSON.stringify(mFBdata))
            }


            time = parseInt(new Date().getTime()/1000)
            let mAddNew = false
            let mError = false

            if (mFBdata['panding']['time'] < time) {
                mAddNew = true
            } else {
                await page.goto('https://mbasic.facebook.com/confirmemail.php', { waitUntil: 'load', timeout: 0 })

                let url = await page.url()

                if (url.startsWith('https://mbasic.facebook.com/confirmemail.php')) {
                    let _gmail = await page.evaluate(() => {
                        try {
                            return document.querySelector('#m_conf_cliff_root_id').querySelector('strong').innerText
                        } catch (error) {}
                        return ''
                    })
            
                    if (mFBdata['panding']['user']+'@1secmail.com' != _gmail) {
                        mAddNew = true
                    } else {
                        console.log('Already Add')
                    }
                } else {
                    mError = true
                }
            }

            if (mAddNew) {
                await page.goto('https://mbasic.facebook.com/changeemail', { waitUntil: 'load', timeout: 0 })

                let url = await page.url()

                if (url.startsWith('https://mbasic.facebook.com/changeemail')) {
                    let gmail = mName[0].toLowerCase().replace(/[^a-z]/g, '')+getRandomNumber()
                
                    await delay(500)
                    await page.type('input[name="new"]', gmail+'@1secmail.com')
                    await delay(500)
                    await page.click('input[name="submit"]')
                    await waitForConfirmemail(gmail+'@1secmail.com')
            
                    mFBdata['panding']['user'] = gmail
                    mFBdata['panding']['time'] = parseInt(parseInt(new Date().getTime()/1000)+1200)
            
                    fs.writeFileSync('fb_data.json', JSON.stringify(mFBdata))
            
                    console.log('Check Mail')
                } else {
                    mError = true
                }
            }

            if (mError) {
                console.log('Account Disable. Please Change Your Ip Adress')

                delete mFBdata['panding']

                mName.shift()
                fs.writeFileSync('fb_name.json', JSON.stringify(mName))
                fs.writeFileSync('fb_data.json', JSON.stringify(mFBdata))
            } else {
                while (true) {
                    await delay(1000)

                    let remove = await page.evaluate(() => {
                        let root = document.querySelector('form[method="post"]')
                        if (root) {
                            root = document.querySelector('form[method="post"] > input[value="Remove"]')
                            if (root) {
                                let size = document.querySelectorAll('form[method="post"] > input[value="Remove"]')
                                root.click()
                                return size.length
                            }
                            return 0
                        }
                        return -1
                    })

                    if (remove == 0) {
                        break
                    }

                    await delay(1000)
                }

                console.log('Read OTP')

                let user = mFBdata['panding']['user']
                let pass = mFBdata['panding']['pass']
                let cookies = mFBdata['panding']['cookies']

                let otp = await readFacebookOTP(user, mFBdata['panding']['time'])

                for (let i = 0; i < cookies.length; i++) {
                    if (cookie[i]['name'] == 'c_user') {
                        USER = cookie[i]['value']
                    }
                }

                await page.type('input[type="number"]', otp)
                await delay(500)
                await page.click('input[type="submit"]')

                mFBdata[USER] = {
                    user: user,
                    pass: pass,
                    cookies: cookies
                }

                delete mFBdata['panding']

                mName.shift()
                fs.writeFileSync('fb_name.json', JSON.stringify(mName))
                fs.writeFileSync('fb_data.json', JSON.stringify(mFBdata))

                console.log(otp)
    }
        } else if (status == 3) {
            console.log('Account Disable. Please Change Your Ip Adress')

            mName.shift()
            fs.writeFileSync('fb_name.json', JSON.stringify(mName))
        } else {
            console.log(status)
        }
    }
}

async function readFacebookOTP(gmail, time) {

    let otp = null

    while (true) {
        try {
            let responce = await getAxios('https://www.1secmail.com/api/v1/?action=getMessages&login='+gmail+'&domain=1secmail.com', {
                maxRedirects: 0,
                validateStatus: null
            })

            let list = responce.data
            for (let i = 0; i < list.length; i++) {
                try {
                    let _time = parseInt(new Date(list[i]['date']).getTime()/1000)+15820
                    if (time < _time) {
                        if (list[i]['from'] == 'registration@facebookmail.com') {
                            let temp = list[i]['subject'].substring(list[i]['subject'].indexOf('FB-')+3, list[i]['subject'].length)
                            otp = temp.substring(0, temp.indexOf(' '))
                        }
                    } 
                } catch (error) {}
            }
        } catch (error) {}

        if (otp) {
            break
        } else {
            await delay(5000)
        }
    }

    return otp
}


async function waitForCreate() {

    let status = 0

    while (true) {
        await delay(2000)

        let url = await page.url()

        if (url.startsWith('https://mbasic.facebook.com/login/save-device/')) {
            status = 1
            break
        } else if (url.startsWith('https://mbasic.facebook.com/confirmemail.php') || url.startsWith('https://www.facebook.com/confirmemail.php')) {
            status = 2
            break
        } else if (url.startsWith('https://mbasic.facebook.com/checkpoint/') || url.startsWith('https://www.facebook.com/checkpoint/')) {
            status = 3
            break
        } else if (url.startsWith('https://mbasic.facebook.com/recover/code/') || url.startsWith('https://www.facebook.com/recover/code/')) {
            status = 4
            break
        }
        
    }

    return status
}

async function waitForSaveDevice() {

    while (true) {
        await delay(2000)

        let save = await page.evaluate(() => {
            let root = document.querySelector('input[value="OK"]')
            if (root) {
                root.click()
                return true
            }
            return false
        })

        if (save) {
            break
        }
    }

    while (true) {
        await delay(2000)

        let url = await page.url()

        if (url.startsWith('https://mbasic.facebook.com/confirmemail.php')) {
            break
        }
    }
}

async function waitForConfirmemail(gmail) {

    while (true) {
        await delay(2000)

        let url = await page.url()

        if (url.startsWith('https://mbasic.facebook.com/confirmemail.php')) {
            let _gmail = await page.evaluate(() => {
                try {
                    return document.querySelector('#m_conf_cliff_root_id').querySelector('strong').innerText
                } catch (error) {}
                return ''
            })

            if (gmail == _gmail) {
                break
            }
        }
    }
}

async function waitForBox() {
    while (true) {
        await delay(2000)

        try {
            let box = await page.evaluate(() => {
                let root = document.querySelector('#reg_box')
                if (root) {
                    return true
                }
                return false
            })

            if (box) {
                break
            }
        } catch (error) {}
    }
}

async function waitForCookies(i_user, status) {

    let completed = false
    let check = false

    while (true) {
        await delay(3000)

        if (!completed) {
            let _cookie = await page.cookies() 

            for (let i = 0; i < _cookie.length; i++) {
                if (_cookie[i]['name'] == 'i_user') {
                    if (_cookie[i]['value'] == i_user) {
                        completed = true
                    }
                }
            }
        }

        if (status == 1) {
            check = await page.evaluate(() => {
                let root = document.querySelector('div[aria-label="Welcome to your new Page!"]')
                if (root) {
                    return true
                }
                return false
            })
        } else {
            check = true
        }

        if (completed && check) {
            break
        }
    }

    return status == 1
}

async function waitForProfile() {

    while (true) {
        await delay(2000)

        try {
            let url = await page.url()

            if (url.startsWith('https://mbasic.facebook.com/profile.php')) {
                break
            }
        } catch (error) {}
    }
}

async function getPageId() {

    let id = null

    while (true) {
        await delay(1000)

        try {
            let url = await page.url()

            if (url.startsWith('https://www.facebook.com/profile.php?id=')) {
                id = url.substring(url.indexOf('id=')+3, url.length)
            }
        } catch (error) {}

        if (id) {
            break
        }
    }

    return id
}

async function addAdmin(id) {
    let timeout = 0

    while (true) {
        await delay(2000)
        timeout++

        try {
            let click = await page.evaluate((id, click) => {
                let root = document.querySelector(id)
                if (root) {
                    document.querySelector(click).click()
                    return true
                }
                return false
            },'li[id="'+id+'"]', 'li[id="'+id+'"]  > div > div')

            if (click) {
                timeout = 0
                break
            }
        } catch (error) {}

        if (timeout >= 5) {
            timeout = 99
            //break
        }
    }

    return timeout == 0
}

async function waitForConfirm(id) {

    let user = 0
     
    while (true) {
        await delay(2000)

        try {
            user = await page.evaluate(() => {
                let root = document.querySelectorAll('[class="x1n2onr6 x1ja2u2z x9f619 x78zum5 xdt5ytf x2lah0s x193iq5w"]')
                if (root) {
                    return root.length
                }
                return 0
            })

            if (user > id) {
                break
            }
        } catch (error) {}
    }

    return user
}

async function waitForLogin() {

    let user = null

    while (true) {
        await delay(3000)

        let _cookie = await page.cookies() 

        for (let i = 0; i < _cookie.length; i++) {
            if (_cookie[i]['name'] == 'c_user') {
                user = _cookie[i]['value']
            }
        }

        if (user) {
            break
        }
    }

    return user
}

async function getPostData(id) {
    mPostData['fb_api_req_friendly_name'] = 'ProfilePlusCoreAppAdminInviteMutation'
    mPostData['variables'] = encodeURIComponent('{"input":{"additional_profile_id":"'+mPostData['av']+'","admin_id":"'+id+'","admin_visibility":"Unspecified","grant_full_control":true,"actor_id":"'+mPostData['av']+'","client_mutation_id":"1"}}')
    mPostData['doc_id'] = '5707097792725637'

    let data = ''

    for (let [key, value] of Object.entries(mPostData)) {
        data += key+'='+value+'&'
    }

    return data
}

async function setPostData(data) {
    try {
        let split = data.split('&')
        for (let i = 0; i < split.length; i++) {
            let key = split[i].split('=')
            if (key.length == 2) {
                mPostData[key[0]] = key[1]
            }
        }
    } catch (error) {}
}


async function getAxios(url, data) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            data.timeout = 10000
            responce = await axios.get(url, data)
            break
        } catch (error) {
            loop++
            console.log('Responce Error: '+loop)

            if (loop >= 5) {
                break
            } else {
                await delay(3000)
            }
        }
    }
    return responce
}

async function postAxios(url, body, data) {
    let loop = 0
    let responce = null
    while (true) {
        try {
            data.timeout = 10000
            responce = await axios.post(url, body, data)
            break
        } catch (error) {
            loop++
            console.log('Responce Error: '+loop)

            if (loop >= 5) {
                break
            } else {
                await delay(3000)
            }
        }
    }
    return responce
}

function getHeaders(addHeader, cookies) {

    let cookie = ''

    for (let i = 0; i < cookies.length; i++) {
        cookie += cookies[i]['name']+'='+cookies[i]['value']+'; '
    }

    let headers = {
        'authority': 'www.facebook.com',
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': cookie,
        'dpr': '1.8',
        'origin': 'https://www.facebook.com',
        'referer': 'https://www.facebook.com/settings/?tab=profile_access',
        'sec-ch-prefers-color-scheme': 'dark',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        'viewport-width': '481',
        'x-asbd-id': '129477',
        'x-fb-friendly-name': 'ProfilePlusCoreAppAdminInviteMutation',
        'x-fb-lsd': 'SW6LMBN334cabOCTmZoaKG'
    }

    for (let [key, value] of Object.entries(addHeader)) {
        headers[key] = value
    }

    return headers
}

function getRandomNumber() {
    let N = ['0','1','2','3','4','5','6','7','8','9']
    
    let pass = N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    
    return pass
}

function getRandomPassword() {
    let C = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
    let S = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
    let N = ['0','1','2','3','4','5','6','7','8','9']
    let U = ['#','$','@']
    
    let pass = C[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += S[Math.floor((Math.random() * 26))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += N[Math.floor((Math.random() * 10))]
    pass += U[Math.floor((Math.random() * 3))]
    pass += U[Math.floor((Math.random() * 3))]
    
    return pass
}

function getRandomYear() {
    let N = ['1996','1997','1998','1999', '2000', '2001', '2002']
    return  N[Math.floor((Math.random() * 7))]
}

function getRandomMonth() {
    return  (Math.floor((Math.random() * 11))+1).toString()
}

function getRandomDay() {
    return  (Math.floor((Math.random() * 28))+1).toString()
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
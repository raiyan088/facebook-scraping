const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const axios = require('axios')
const md5 = require('md5')
const fs = require('fs')


let browser = null
let page = null
let mList = []
let mData = {}
let mSave = {}
let cookies = JSON.parse('[{"name":"xs","value":"1%3A0hkY87MoyAOyjg%3A2%3A1698047180%3A-1%3A-1","domain":".facebook.com","path":"/","expires":1729583181.617654,"size":47,"httpOnly":true,"secure":true,"session":false,"sameSite":"None","sameParty":false,"sourceScheme":"Secure","sourcePort":443},{"name":"c_user","value":"61552341915198","domain":".facebook.com","path":"/","expires":1729583181.617642,"size":20,"httpOnly":false,"secure":true,"session":false,"sameSite":"None","sameParty":false,"sourceScheme":"Secure","sourcePort":443},{"name":"wd","value":"1019x408","domain":".facebook.com","path":"/","expires":1698651964,"size":10,"httpOnly":false,"secure":true,"session":false,"sameSite":"Lax","sameParty":false,"sourceScheme":"Secure","sourcePort":443},{"name":"m_pixel_ratio","value":"1.8000000715255737","domain":".facebook.com","path":"/","expires":-1,"size":31,"httpOnly":false,"secure":true,"session":true,"sameParty":false,"sourceScheme":"Secure","sourcePort":443},{"name":"fr","value":"0xiFRnonoe4S7PQqu.AWVGbTqiGVuA5L0GNy4sMcdqDBw.BlNiS6.Iq.AAA.0.0.BlNiTL.AWXXUTlxozc","domain":".facebook.com","path":"/","expires":1705823181.617565,"size":84,"httpOnly":true,"secure":true,"session":false,"sameSite":"None","sameParty":false,"sourceScheme":"Secure","sourcePort":443},{"name":"sb","value":"uiQ2ZSH7apKFDwLrl1Prrxp8","domain":".facebook.com","path":"/","expires":1732607181.617625,"size":26,"httpOnly":true,"secure":true,"session":false,"sameSite":"None","sameParty":false,"sourceScheme":"Secure","sourcePort":443},{"name":"datr","value":"uiQ2ZVxeCOqznrIgyjnG7eRu","domain":".facebook.com","path":"/","expires":1732607163.021049,"size":28,"httpOnly":true,"secure":true,"session":false,"sameSite":"None","sameParty":false,"sourceScheme":"Secure","sourcePort":443}]')

let BASE_URL = Buffer.from('aHR0cHM6Ly9kYXRhYmFzZTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4L2dtYWlsLw==', 'base64').toString('ascii')

puppeteer.use(StealthPlugin())

try {
    mSave = JSON.parse(fs.readFileSync('save_data.json'))
} catch (e) {}

try {
    browserStart()
} catch (e) {
    console.log(e)
}

async function browserStart() {

    try {
        let response = await getAxios(BASE_URL+'url.json')

        mData = response.data

        mList = []

        for(let key of Object.keys(mData)) {
            mList.push(key)
        }

        shuffleArray(mList)

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

        await page.setCookie(...cookies)

        await page.setUserAgent('Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36')

        downloadImage()
        
    } catch (error) {
       console.log(error)
    }
}

function downloadImage() {
    console.log(mList.length)

    let url = mData[mList[0]]
    axios({
        url,
        responseType: 'stream',
      }).then(response =>
        response.data.pipe(fs.createWriteStream('image.jpg')).on('finish', () => {
            try {
                photoUpload()
            } catch (error) {
                console.log(error)
            }
        }).on('error', e => {
            console.log('error')
        })
      )
}

async function photoUpload() {
    await page.goto('https://mbasic.facebook.com/profile.php?v=timeline', { waitUntil: 'load', timeout: 0 })
    await delay(500)
    await page.click('input[value="Post"]')
    let id = await getCSID()
    await page.goto('https://mbasic.facebook.com/composer/mbasic/?csid='+id+'&view_photo', { waitUntil: 'load', timeout: 0 })
    await delay(500)
    const upload = await page.$('input[type="file"]')
    upload.uploadFile('image.jpg')
    await delay(500)
    await page.click('input[value="Preview"]')
    await waitForPost()
    await page.goto('https://mbasic.facebook.com/composer/mbasic/?csid='+id+'&priv_expand=intermediate_hidden&view_privacy', { waitUntil: 'load', timeout: 0 })
    await delay(500)
    await page.evaluate(() => document.querySelector('input[id="286958161406148"]').click())
    await delay(500)
    await page.click('input[value="Done"]')
    await waitForPost()
    let data = await page.evaluate(() => {
        let map = {}
        let root = document.querySelectorAll('input[type="hidden"]')
        if (root && root.length > 0) {
            for (let i = 0; i < root.length; i++) {
                map[root[i].name] = root[i].value
            }
        }
        return map
    })

    let url = await page.evaluate(() => document.querySelector('form[method="post"]').action)
    data['page_url'] = url

    let post = data['photo_ids[]']
    
    await patchAxios(BASE_URL+'nude/'+md5(post)+'.json', JSON.stringify({ id:post }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })

    mSave[md5(id)] = data

    fs.writeFileSync('save_data.json', JSON.stringify(mSave))
    
    await axios.delete(BASE_URL+'url/'+mList[0]+'.json')

    mList.shift()
    
    downloadImage()
}


async function getCSID() {

    let id = null

    while (true) {
        await delay(1000)

        try {
            let url = await page.url() 

            if (url.startsWith('https://mbasic.facebook.com/composer/mbasic')) {
                let temp = url.substring(url.indexOf('csid=')+5, url.length)
                id = temp.substring(0, temp.indexOf('&'))
            }

            if (id) {
                break
            }
        } catch (error) {}
    }

    return id
}

async function waitForPost() {
    while (true) {
        await delay(1000)
        try {
            let post = await page.evaluate(() => {
                let root = document.querySelector('input[name="view_post"]')
                if (root) {
                    return true
                }
                return false
            })

            if (post) {
                break
            }
        } catch (error) {}
    }
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

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1))
        var temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
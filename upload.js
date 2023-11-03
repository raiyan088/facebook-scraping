const axios = require('axios')
const fs = require('fs')

let mSave = {}
let mList = []

try {
    mSave = JSON.parse(fs.readFileSync('save_data.json'))

    mList = []

    for(let key of Object.keys(mSave)) {
        mList.push(key)
    }

    if (mList.length > 0) {
        background()
    } else {
        console.log('Data Not Found')
    }
} catch (e) {
    console.log(e)
}

//\r\n\r\n

async function background() {
    let postData = '------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="fb_dtsg"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="jazoest"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="at"\r\n\r\n\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="target"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="csid"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="c_src"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="referrer"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="ctype"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="cver"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="users_with"\r\n\r\n\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="album_id"\r\n\r\n\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="waterfall_source"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="privacyx"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="appid"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="photo_ids[]"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="return_uri"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="return_uri_error"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="waterfall_id"\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="xc_message"\r\n\r\n\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5\r\nContent-Disposition: form-data; name="view_post"\r\n\r\nPost\r\n------WebKitFormBoundaryByXmnh8NcyUxSEt5--\r\n'

    console.log(mList.length)
    try {
        for (let [key, value] of Object.entries(mSave[mList[0]])) {
            if (value.length > 0) {
                if (postData.includes(key)) {
                    postData = postData.replace(key+'"', key+'"'+'\r\n\r\n'+value)
                }
            }
        }
        
        const response = await axios.post(mSave[mList[0]]['page_url'],
            postData,
            {
              maxRedirects: 0,
                validateStatus: null,
              headers: {
                'authority': 'mbasic.facebook.com',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'max-age=0',
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryByXmnh8NcyUxSEt5',
                'cookie': 'xs=1%3A0hkY87MoyAOyjg%3A2%3A1698047180%3A-1%3A-1; c_user=61552341915198; m_pixel_ratio=1.8000000715255737; fr=0xiFRnonoe4S7PQqu.AWVGbTqiGVuA5L0GNy4sMcdqDBw.BlNiS6.Iq.AAA.0.0.BlNiTL.AWXXUTlxozc; sb=uiQ2ZSH7apKFDwLrl1Prrxp8; datr=uiQ2ZVxeCOqznrIgyjnG7eRu; m_page_voice=61552341915198',
                'origin': 'https://mbasic.facebook.com',
                'sec-ch-prefers-color-scheme': 'dark',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36',
                'viewport-width': '481'
              }
            }
        )

        console.log(response.headers['location'])
        console.log(response.data.length)
    } catch (error) {
        console.log(error)
    }

    delete mSave[mList[0]]
    mList.shift()

    fs.writeFileSync('save_data.json', JSON.stringify(mSave))

    if (mList.length > 0) {
        await background()
    } else {
        console.log('Data Not Found')
    }
}
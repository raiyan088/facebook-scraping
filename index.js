const { exec } = require('child_process')

let SIZE = 0

let load02 = true
let load03 = true
let load04 = true
let load05 = true

let process01 = null
let process02 = null
let process03 = null
let process04 = null
let process05 = null


let mLog1 = [ '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------' ]
let mLog2 = [ '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------' ]
let mLog3 = [ '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------' ]
let mLog4 = [ '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------' ]
let mLog5 = [ '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------', '-----------' ]

let mMsg = [ [], [], [], [], [] ]
let mCheck = [ false, false, false, false, false ]

let update = 0


process.argv.slice(2).forEach(function (data, index) {
    try {
        let size = parseInt(data)
        
        SIZE = (size-1)*5

        connect01()
    } catch (error) {
        console.log('Index Error:', error)
    }
})

async function connect01() {
    process01 = exec('node server.js '+(SIZE+1))

    process01.stdout.on('data', (data) => {
        setLog(data.toString().trim(), mLog1, 0)
        writeLog(mLog1, mLog2, mLog3, mLog4, mLog5)
        if(data.toString().includes('||---EXIT----')) {
            connect01()
        }
        if (load02) {
            if (data.toString().includes('||---LOAD----')) {
                load02 = false
                connect02()
            }
        }
    })
}

async function connect02() {
    process02 = exec('node server.js '+(SIZE+2))

    process02.stdout.on('data', (data) => {
        setLog(data.toString().trim(), mLog2, 1)
        writeLog(mLog1, mLog2, mLog3, mLog4, mLog5)
        if(data.toString().includes('||---EXIT----')) {
            connect02()
        }
        if (load03) {
            if (data.toString().includes('||---LOAD----')) {
                load03 = false
                connect03()
            }
        }
    })
}

async function connect03() {
    process03 = exec('node server.js '+(SIZE+3))

    process03.stdout.on('data', (data) => {
        setLog(data.toString().trim(), mLog3, 2)
        writeLog(mLog1, mLog2, mLog3, mLog4, mLog5)
        if(data.toString().includes('||---EXIT----')) {
            connect03()
        }
        if (load04) {
            if (data.toString().includes('||---LOAD----')) {
                load04 = false
                connect04()
            }
        }
    })
}

async function connect04() {
    process04 = exec('node server.js '+(SIZE+4))

    process04.stdout.on('data', (data) => {
        setLog(data.toString().trim(), mLog4, 3)
        writeLog(mLog1, mLog2, mLog3, mLog4, mLog5)
        if(data.toString().includes('||---EXIT----')) {
            connect04()
        }
        if (load05) {
            if (data.toString().includes('||---LOAD----')) {
                load05 = false
                connect05()
            }
        }
    })
}

async function connect05() {
    process05 = exec('node server.js '+(SIZE+5))

    process05.stdout.on('data', (data) => {
        setLog(data.toString().trim(), mLog5, 4)
        writeLog(mLog1, mLog2, mLog3, mLog4, mLog5)
        if(data.toString().includes('||---EXIT----')) {
            connect05()
        }
    })
}

function setLog(msg, list, position) {
    try {
        let line = msg.split('\n')
        for (let i = 0; i < line.length; i++) {
            try {
                let data = line[i]
                if (data.startsWith('||')) {
                    mMsg[position] = []
                    if (mCheck[position]) {
                        mCheck[position] = false
                        list[1] = '-----------'
                        list[2] = '-----------'
                        list[3] = '-----------'
                        list[4] = '-----------'
                        list[5] = '-----------'
                        list[6] = '-----------'
                        list[7] = '-----------'
                        list[8] = '-----------'
                        list[9] = '-----------'
                    }

                    if (data.length >= 13) {
                        list[0] = data.substring(2, 13)
                    }
                } else if (data.startsWith('|X|')) {
                    mMsg[position] = []
                    if (data.length >= 14) {
                        mCheck[position] = true
                        list[1] = data.substring(3, 14)
                    }
                } else if (data.startsWith('|T|')) {
                    mMsg[position] = []
                    if (data.length >= 14) {
                        mCheck[position] = true
                        list[2] = data.substring(3, 14)
                    }
                } else if (data.startsWith('|*|')) {
                    if (data.length >= 14) {
                        mMsg[position].push(data.substring(3, 14))

                        if (mMsg[position].length > 7) {
                            mMsg[position].shift()
                        }

                        for (let j = 0; j < mMsg[position].length; j++) {
                            list[(3+j)] = mMsg[position][j]
                        }
                    }
                }
            } catch (error) {}
        }
    } catch (error) {}
}

function writeLog(log1, log2, log3, log4, log5) {
    
    let now = new Date().getTime()
    if (update < now) {
        console.clear()

        for (let i = 0; i < 10; i++) {
            console.log(log1[i]+'|'+log2[i]+'|'+log3[i]+'|'+log4[i]+'|'+log5[i])
        }

        update = now+2000
    }
}
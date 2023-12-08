
console.log('Start')

process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            console.log('Data: '+data)
        }
    } catch (error) {}
})
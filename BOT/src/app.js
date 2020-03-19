var auth = require('./auth.json')
var User = require('./user.js')
var Admin = require('./admin.js')
var Auction = require('./auction.js')
var Bid = require('./bid.js')
var logger = require('winston')
var { Client, Attachment, Permissions, RichEmbed} = require('discord.js')
var mysql = require('mysql')

logger.remove(logger.transports.Console)
logger.add(new logger.transports.Console, {
    colorize: true
})
logger.level = 'debug'

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "auction_bot",
});


var bot = new Client()
con.connect()
bot.login(auth.token)


bot.on('ready', function(evt) {
    logger.info('Connected')
    logger.info('Logged in as: ')
    logger.info(bot.username + ' - (' + bot.id + ')')
})

bot.on('message', (message) =>  {
    const args = message.content.slice(1).trim().split(' ')
    const cmd = args.shift().toLowerCase()
    const client = message.mentions._client;

    console.log(cmd)
    switch(cmd) {
        case 'register':
            User.register(message, con, logger)
            break

        case 'rep':
            User.rep(message, con, logger)
            break

        case 'balance':
            User.balance(message, con, logger)
            break

        case 'newauction':
            Auction.newauction(message, con, logger)
            break

        case 'editauction':
            Auction.editauction(message, args, con, logger)
            break

        case 'showauction':
            Auction.showAuction(message.channel, args[0], con, logger)
            break

        case 'saveauction':
            Auction.saveAuction(message, args[0], con, logger)
            break

        case 'adminregister':
            Admin.adminRegister(message, con, logger)
            break

        case 'listadmins':
            Admin.listAdmins(message,con, logger)
            break

        case 'addcredits':
            const userid = args[0]
            const credits = args[1]
            Admin.addCredits(message, credits, userid, con, logger)
            break

        case 'judgeadmin':
            status = 'DECLINE'
            if (args[1] == 'accept')
                status = 'ACCEPT'
            Admin.judgeAdmin(message, args[0], status, con, logger)
            break

        case 'getid':
            message.reply(message.author.id)
            break

        case 'approveauction':
            Admin.approveAuction(message, con, logger)
            break

        case 'bid':
            const auctionId = args[0]
            const amount = args[1]
            const userId = message.author.id
            Bid.bid(auctionId, amount, userId, auctionId, message, con, logger)
            break

        default:
            console.log('NOPE!')
            message.reply('Didn\'t quite catch that bro!')
            break
    }
})
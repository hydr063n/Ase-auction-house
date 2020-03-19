var auth = require('./config/auth.json')
var User = require('./src/user.js')
var Admin = require('./src/admin.js')
var Auction = require('./src/auction.js')
var Bid = require('./src/bid.js')
var logger = require('winston')
var { Client, Attachment, Permissions, RichEmbed } = require('discord.js')
var mysql = require('mysql')
var cron = require('cron')

logger.remove(logger.transports.Console)
logger.add(new logger.transports.Console, {
    colorize: true
})
logger.level = 'debug'

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "auctionbot",
});


var bot = new Client()
con.connect()
bot.login(auth.token)

function help(message) {
    const txt = '!rep - check your rep.\n' + 
                '!giverep [USER ID] - give user id your rep.\n' + 
                '!getid - check your ID.\n' + 
                '!balance - check your balance.\n' + 
                '!register - create user account.\n' + 
                '!sendcredits [USER ID] [AMOUNT] - Send credits to another user\n\n' + 
                '!newauction - create new auction\n' + 
                '!showauction [AUCTION ID] - Show auction\n' + 
                '!editauction [AUCTION ID] title [YOUR TITLE HERE] - Set Title:\n' + 
                '!editauction [AUCTION ID] description [YOUR DESCRIPTION HERE] - Set Description\n' +
                '!editauction [AUCTION ID] delivery [LINK/CONTACT] - Delivery (Link to service/Contact details)\n' +
                '!editauction [AUCTION ID] prize [YOUR PRIZE LINK OR CONTACT DETAILS] - Prize\n' + 
                '!editauction [AUCTION ID] expiry [2h42 (Maximum: 3 hours Minimum: 15 minutes)] - Expire Time\n' +
                '!saveauction [AUCTION ID] - Save Auction\n\n' +
                '!bid [AUCTION ID] [AMOUNT] - Bid on auction\n\n' +
                '!adminregister - Register as admin\n' +
                '!listadmins - show all admins\n' +
                '!addcredits [USER ID] [AMOUNT] - add credits to user\n' + 
                '!judgeadmin [ADMIN ID] [accept/decline] - add credits to user\n' +
                '!approveauction [AUCTION ID] - Approve Auction\n' +
                '!endauction [AUCTION ID] - Approve Auction\n' +
                '!transfertax [PERCENTAGE] - Set transfer tax\n'
                

    const embed = new RichEmbed()
        .setColor('#0099ff')
        .setAuthor('Auction bot', 'https://i.imgur.com/wSTFkRM.png', 'https://discord.js.org')
        .setTitle('Help Menu')
        .setDescription(txt)
        .setTimestamp()
        .setFooter('Best Auction Channel', 'https://i.imgur.com/wSTFkRM.png')

    message.reply(embed)
}


bot.on('ready', function(evt) {
    logger.info('Connected')
    logger.info('Logged in as: ')
    logger.info(bot.username + ' - (' + bot.id + ')')
})

bot.on('message', (message) =>  {
    const args = message.content.slice(1).trim().split(' ')
    const cmd = args.shift().toLowerCase()
    const client = message.mentions._client;
    console.log(message.content)

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
            if (args[0])
                Auction.showAuction(message.channel, args[0], con, logger)
            else
                message.reply('What about the AUCTION ID bro?')
            break

        case 'saveauction':
            if (args[0])
                Auction.saveAuction(message, args[0], con, logger)
            else
                message.reply('What about the AUCTION ID bro?')
            break

        case 'adminregister':
            Admin.adminRegister(message, con, logger)
            break

        case 'listadmins':
            Admin.listAdmins(message,con, logger)
            break

        case 'addcredits':
            if (args[0] && args[1])
            {
                const userid = args[0]
                const credits = args[1]
                Admin.addCredits(message, credits, userid, con, logger)
            } 
            else
                message.reply('Did you type that bro?')
            
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
            if (args[0])
                Auction.approveAuction(message, args[0], con, logger)
            else
                message.reply('I need the AUCTION ID bro!')
            break

        case 'help':
            help(message)
            break

        case 'sendcredits':
            if (args[0] && args[1])
            {
                const _userid = args[0]
                const _amount = args[1]
                User.sendCredits(message, _amount, _userid, con, logger)
            }
            else
                message.reply('Didn\'t add enough arguements bro')
            break

        case 'transfertax':
            if (args[0])
                Admin.updateTransferTax(message, args[0], con, logger)
            else
                message.reply('How much tax bro?')
            break

        case 'endauction':
            if (args[0])
                Auction.endAuction(message, args[0], con, logger)
            else   
                message.reply('AUCTION ID bro?')
            break

        case 'giverep':
            if (args[0])
                User.giveRep(message, args[0], con, logger)
            else   
                message.reply('USER ID bro?')
            break

        case 'bid':
            if (args[0] && args[1])
            {
                const auctionId = args[0]
                const amount = args[1]
                Bid.bid(auctionId, amount, message.author.id, message, con, logger)
            }
            else
                message.reply('Need more info man. See !help')
            break
    }
})
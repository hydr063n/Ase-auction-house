var {RichEmbed} = require('discord.js')

module.exports.updateItem = function(message, item, data, auctionId, con, logger) {
    con.query('update auctions set ' + item + ' = "' + data + '" where id = ' + auctionId, function (error, results, fields) {
        if (error) {
            logger.error(error.message)
            message.reply('Does this auction exist?')
        } else
            message.reply('The auction ' + item + ' has been updated!')
    })
}

module.exports.newauction = function(message, con, logger) {
    con.query('insert into auctions (title, user_id) values ("New Auction", "'+message.author.id+'")', function (error, results, fields) {
        if (error) {
            logger.error(error.message)
            message.reply('Couldn\'t store this auction. Please contact admin.')
        } else {
            logger.info(results.insertId)
            con.query('select * from auctions where id = ' + results.insertId, function (error, res, fields) {
                if (error) {
                    logger.error(error.message)
                    message.reply('Couldn\'t get this auction. Please contact admin.')
                } else {
                    console.log(res)
                    const auction = res[0]
                    message.channel.send({embed: module.exports.auctionEmbed(auction, null)})
                }
            })

        }
    })
}

module.exports.editauction = function(message, args, con, logger) {
    if (args.length < 3) {
        logger.info("Not enough arguements")
        return
    }
        
    var auctionId = args[0]
    var editCmd = args[1]
    var data = ""

    for (var i = 2; i < args.length; i++) {
        data = data + args[i] + " ";
    }

    // logger
    var txt = 'AuctionID: ' + auctionId + '\nEditCmd: ' + editCmd + '\nData: ' + data;
    logger.info(txt)

    if (editCmd == 'expiry') {
        var time = data
        var bits = time.split('h')
        var hours = parseInt(bits[0])
        var minutes = parseInt(bits[1])
        var totalMinutes = (hours * 60) + minutes
        
        con.query('update auctions set expire_time = ' + totalMinutes + ' where id = ' + auctionId, function (error, results, fields) {
            if (error) 
                message.reply(error.message)
            else
                message.channel.send('Expiry time updated.')
        })
        module.exports.showAuction(message.channel, auctionId, con, logger)
    } else if (editCmd == 'start_fee') {
        ret = con.query('select count(*) as auctionExists from auctions where id = ' + auctionId + ' limit 1', function (error, results, fields) {
            if (error)
                message.reply(error.message)
            else {
                if (results[0].auctionExists == 0) {
                    message.channel.send('This auction doesn\'t exist. Please create an auction first!')
                } else {
                    message.channel.send('Setting the start fee for this auction!')
                    module.exports.updateItem(message, 'start_fee', data, auctionId, con, logger)
                }

            }
        });
    } else {
        module.exports.updateItem(message, editCmd, data, auctionId, con, logger)
        module.exports.showAuction(message.channel, auctionId, con, logger)
    }
}

module.exports.approveAuctionDB = function(message, auctionId, con, logger) {
    con.query('update auctions set status = "ACCEPT",\
                    start_date = CURRENT_TIMESTAMP, \
                    end_date = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL expire_time MINUTE) \
                    where id = ' + auctionId, 
                    function (error, results, fields) {
                if (error) 
                    message.reply(error.message)
                else {
                    message.channel.send('Auction approved.')
                    module.exports.showAuction(message.channel, auctionId, con, logger)
                    const channelName = 'auctions'
                    const channel = message.mentions._client.channels.find('name', channelName)
                    channel.send('New auction ready for bids.')
                    module.exports.showAuction(channel, auctionId, con, logger)
                }
            })
}

module.exports.saveAuction = function(message, auctionId, con, logger) {
    con.query('update auctions set status = "PENDING" where id = ' + auctionId, function (error, results, fields) {
        if (error) 
            message.reply(error.message)
        else
        {
            message.channel.send('Auction saved.')
            module.exports.showAuction(message.channel, auctionId, con, logger)
            const channelName = 'auction_verification'
            const channel = message.mentions._client.channels.find('name', channelName)
            module.exports.showAuction(channel, auctionId, con, logger)
        }
    })
    
}

module.exports.approveAuction = function(message, auctionId, con, logger) {
    con.query('select count(*) as userExists from admins where id = ' + message.author.id + ' and status = \'ACCEPT\' limit 1', function (error, results, fields) {
        if (error)
            message.reply(error.message)
        else {
            console.log(results)
            if (results[0].userExists == 1) {
                module.exports.approveAuctionDB(message, auctionId, con, logger)
            } else {
                message.channel.send('Only Admin role can run this command!')
            }

        }
    })
}

module.exports.endAuctionDB = function(message, auctionId, con, logger) {
    con.query('select * from auctions where id = ' + auctionId, function (error, results, fields) {
        if (error) 
            message.reply(error.message)
        else {
            const auction = results[0]
    
            con.query('select * from bids where auction_id = ' + auctionId, function (error, res, fields) {
                if (error) 
                    message.reply(error.message)
                else {
                    const bid = res[0]
                    var winner = message.mentions._client.users.get(bid.user_id)
        
                    con.query('select * from settings where id = 1 limit 1;', function (error, results, fields) {
                        if (error) 
                            message.reply(error.message)
                        else {
        
                            var transfer_tax = parseInt(results[0].transfer_tax)
                            var tax = bid.amount * transfer_tax / 100;
                            var afterTaxValue = bid.amount - tax
            
                            // add to vault
                            con.query('update settings set balance = balance + ' + tax + ' where id = 1', function (error, results, fields) {
                                if (error) 
                                    message.reply(error.message);
                                logger.info('Tax vault has gained ' + tax)
                                
                            })
            
                            con.query('update users set balance = balance + ' + afterTaxValue + ' where id = "' + auction.user_id + '"', function (error, results, fields) {
                                if (error) 
                                    message.reply(error.message)
            
                                //var owner = message.mentions._client.users.get(auction.user_id)
                                logger.info('Your auction has ended. You have received ' + bid.amount)
                                //module.exports.showAuction(owner, auctionId, con, logger)*/
                            })
            
                            winner.send('You are highest bidder of Auction ID: ' + auctionId + ', here is your prize: ' + auction.prize +
                                            '\n\nrun !giverep ' + auction.user_id)
            
                            module.exports.showAuction(winner, auctionId, con, logger)
                        }
                    })
                }
            })
        }
    })
}

module.exports.giveRep = function(message, auctionId, con, logger) {
    // add to rcpt
    con.query('update auctions set rep = rep + 1 where auction_id = ' + auctionId, function (error, results, fields) {
        if (error) 
            message.reply(error.message)
        else {
            logger.info('Auction ' + auctionId + ' has gained  rep!')
            message.reply('Auction ' + auctionId + ' has gained rep!')
        }
    })
}

module.exports.endAuction = function(message, auctionId, con, logger) {
    con.query('select count(*) as userExists from admins where id = ' + message.author.id + ' and status = \'ACCEPT\' limit 1', function (error, results, fields) {
        if (error)
            message.reply(error.message)
        else {
            console.log(results)
            if (results[0].userExists == 1) {
                module.exports.endAuctionDB(message, auctionId, con, logger)
            } else {
                message.channel.send('Only Admin role can run this command!')
            }

        }
    })
}

module.exports.auctionEmbed = function(auction, bid) {
    var bidAmount = 0
    if (bid) {
        bidAmount = bid.amount
    }
    const exampleEmbed = new RichEmbed()
        .setColor('#0099ff')
        .setAuthor('Some name', 'https://i.imgur.com/wSTFkRM.png', 'https://discord.js.org')
        .setTitle(auction.title)
        .setDescription(auction.description)
        .setImage(auction.image)
        .addField('Status', auction.status, true)
        .addField('Start Bid', auction.start_fee, true)
        .addField('ID', auction.id, true)
        .addField('Highest Bid', bidAmount + ' credits', true)
        .addField('End date', auction.end_date, true)
        .addField('Delivery', auction.delivery, true)
        .setTimestamp()
        .setFooter('Best Auction Channel', 'https://i.imgur.com/wSTFkRM.png')
        return exampleEmbed
}

module.exports.showAuction = function(message, auctionId, con, logger) {
    con.query('select * from auctions where id = ' + auctionId + ' limit 1', function (error, results, fields) {
        if (error) 
            message.send(error.message)
        else {
            con.query('select * from bids where auctionId = ' + auctionId + ' limit 1', function (err, res, flds) {
                if (err) {
                    message.send(err.message);
                } else {
                    console.log(results)
                    console.log(res)
                    const auction = results[0]
                    const bid = res[0]
                    if (results[0]) 
                        message.send(module.exports.auctionEmbed(auction, bid))
                    else
                        message.send('Auction not found.')
                }
            })
        }
    })
}
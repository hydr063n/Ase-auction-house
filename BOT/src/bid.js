
module.exports.makeNewBid = function(auctionId, userId, amount, message, con, logger) {
    con.query('insert into bids (auction_id, user_id, amount) values (' + auctionId + ', ' + userId + ', ' + amount + ')', function (error, results, fields) {
        if (error){
            logger.error(error.message)
            message.reply('Something went wrong. Please contact admin.')
        } else {
            msg = 'You have successfully made a bid\n' + msg
            logger.info(msg)
            message.reply('NEW BID!')
        }
    })
}

module.exports.makeBid = function(bid, auction, userId, auctionId, amount, message, con, logger) {
    console.log(bid)
    if (amount <= bid.amount) {
        message.reply("Bid too small")
    } else {
        // query auction if still alive
        const date = new Date()
        if (date > auction.end_date) {
            console.log("Auction is over. Please bid on another auction")
            message.reply("Auction is over. Please bid on another auction")
        } else {
            console.log("Auction is still running")
            // query current bidder balance
            con.query('select * from users where id = ' + userId + ' limit 1', function (error, results, fields) {
                if (error)
                    message.reply(error.message)
                else {
                    const user = results[0]
                    console.log(user)
                    if (user.balance > bid.amount && user.balance >= amount) {
                        message.channel.send('WITHDRAW!')

                        // send tokens back to previous bidder
                        con.query('update users set balance = balance + ' + bid.amount + ' where id = ' + bid.user_id, function (error, results, fields) {
                            if (error) 
                                message.reply(error.message)
                            else
                                message.channel.send('<@!' + bid.user_id + '> has lost bid ' + bid.amount)
                        })
                            
                        // take tokens from current bidder
                        con.query('update users set balance = balance - ' + amount + ' where id = ' + userId, function (error, results, fields) {
                            if (error) 
                                message.reply(error.message);
                            else
                                message.channel.send('<@!' + userId + ' has gained bid ' + amount)
                        })

                        // update highest bidder
                        con.query('update bids set amount = ' + amount + ', user_id = ' + userId + ' where auction_id = ' + auctionId, function (error, results, fields) {
                            if (error) 
                                message.reply(error.message);
                            else
                                message.channel.send('Highest bidder <@!' + userId + '> has bid ' + amount)
                        })

                    } else {
                        message.channel.send('You have insufficient credits in your balance!')
                    }
                }
                
            })
        }
    }
}

module.exports.bid = function(auctionId, amount, userId, message, con, logger) {
    con.query('select * from auctions where id = ' + auctionId + ' limit 1', function (error, results, fields) {
        if (error) 
            message.reply(error.message);
        const auction = results[0]

        var msg = "Auction ID: " + auctionId + 
                    "\nAmount: " + amount + 
                    "\nuserID: " + userId + 
                    "\nstart_fee: " + auction.start_fee

        console.log(msg)

        con.query('select * from bids where auction_id = ' + auctionId + ' limit 1', function (error, results, fields) {
            if (error)
                message.reply(error.message);
            if (results.length == 0) {
                module.exports.makeNewBid(auctionId, userId, amount, message, con, logger)
            } else {
                var bid = results[0]
                module.exports.makeBid(bid, auction, userId, auctionId, amount, message, con, logger)
            }
        });
    })
}
var logger = require('winston')


module.exports.giveRep = function(message, userid, con, logger) {
    var cleanUserid = userid

    console.log(cleanUserid)

    var cleanUserid = cleanUserid.replace('<@!','')
    var cleanUserid = cleanUserid.replace('>','')

    console.log('Clean userid: ', cleanUserid)
    con.query('select count(*) as userExists from users where id = ' + cleanUserid + ' limit 1', function (error, results, fields) {
        if (error)
            message.reply(error.message)
        if (results[0].userExists == 0) {
            message.reply('You need to register first!')
        } else {
            con.query('update users set rep = rep + 1 where id = ' + cleanUserid, function (error, results, fields) {
                if (error) 
                    message.reply(error.message);
                message.channel.send('Some rep was given to <@!' + cleanUserid + '>')
            })
        }
    })
}

module.exports.rep = function(message, con, logger) {
    con.query('select rep from users where id = ' +  message.author.id + ' limit 1', function (error, results, fields) {
        if (error) {
            logger.error(error.message)
            message.reply('Have you registered bro? Try !register')
        } else {
            if (results.length < 1) {
                message.reply('Have you registered bro? Try !register')
            } else {
                logger.info(results[0].rep)
                message.reply('Current Reputation: ' + results[0].rep)
            }
        }
    })
}

module.exports.balance = function(message, con, logger) {
    if (message.channel.type == "dm") {
        con.query('select balance from users where id = ' +  message.author.id + ' limit 1', function (error, results, fields) {
            if (error) {
                logger.error(error.message)
                message.reply('Have you registered bro?')
            }
            else {
                logger.info(results[0].balance)
                message.reply('Balance: ' + results[0].balance)
            }
        })
    } else {
        message.reply('This command is only available in dm.')
    }
}

module.exports.register = function(message, con, logger) {
    con.query('select count(*) as userExists from users where id = ' + message.author.id + ' limit 1', function (error, results, fields) {
        if (error)
            message.reply(error.message);
        else {
            if (results[0].userExists == 0) {
                con.query('insert into users (id, rep, balance) values (' + message.author.id + ', 0, 0)', function (error, results, fields) {
                    if (error) {
                        logger.error(error.message)
                        message.reply('Something went wrong. Please contact admin')
                    } else {
                        logger.info('You have successfully registered')
                        message.reply('You have successfully registered')
                    }
                })
            } else {
                logger.warn("You have already registered")
                message.reply('You have already registered')
            }

        }
    });
}


module.exports.sendCredits = function(message, amount, rcptId, con, logger) {
    con.query('select count(*) as userExists from users where id = ' + message.author.id + ' limit 1', function (error, results, fields) {
        if (error)
            message.reply(error.message)
        else {
            if (results[0].userExists == 0) {
                logger.warn('User does not exist')
                message.reply('User does not exist')
            } else {
                con.query('select balance from users where id = ' + message.author.id, function (error, results, fields) {
                    if (error) {
                        logger.error(error.message)
                        message.reply('Can\'t find this user.')

                    } else {
                        const balance = results[0].balance
    
                        if (balance >= amount) {
                            con.query('select * from settings where id = 1 limit 1;', function (error, results, fields) {
                                if (error) 
                                    message.reply(error.message);
        
                                var transfer_tax = parseInt(results[0].transfer_tax)
                                var tax = amount * transfer_tax / 100;
                                var afterTaxValue = amount - tax
        
                                // add to vault
                                con.query('update settings set balance = balance + ' + tax + ' where id = 1', function (error, results, fields) {
                                    if (error) 
                                        message.reply(error.message);
                                    logger.info('Tax vault has gained ' + tax)
                                    message.reply('Tax vault has gained ' + tax)
                                })
        
                                // add to rcpt
                                con.query('update users set balance = balance + ' + afterTaxValue + ' where id = "' + rcptId + '"', function (error, results, fields) {
                                    if (error) 
                                        message.reply(error.message);
                                    logger.info('User <@!' + rcptId + '> has gained ' + afterTaxValue)
                                    message.reply('User <@!' + rcptId + '> has gained ' + afterTaxValue)
                                })
        
                                // remove from sender
                                con.query('update users set balance = balance - ' + afterTaxValue + ' where id = "' + message.author.id + '"', function (error, results, fields) {
                                    if (error) 
                                        message.reply(error.message);
                                    logger.info('User <@!' + message.author.id + '> has lost ' + afterTaxValue)
                                    message.reply('User <@!' + message.author.id + '> has lost ' + afterTaxValue)
                                })
                            })
        
                            
                        } else {
                            message.reply('Sorry you don\'t have enough credits to send to another user.')
                        }
                    }
                })
            }
        }
        
    });
}
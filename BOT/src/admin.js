module.exports.adminRegister = function(message, con, logger) {
    con.query('select count(*) as userExists from admins where id = ' + message.author.id + ' limit 1', function (error, results, fields) {
        if (error) {
            message.reply(error.message)
        } else {
            if (results[0].userExists == 0) {
                con.query('insert into admins (id) values (' + message.author.id + ')', function (error, results, fields) {
                    if (error) message.reply(error.message);
                    const msg = 'You have successfully registered as admin. Please await verification!'
                    logger.info(msg)
                    message.reply(msg)
                })
            } else {
                const msg = "You have already registered"
                logger.warn(msg)
                message.reply(msg)
            }
        }
    });
}

module.exports.listAdmins = function(message, con, logger) {
    con.query('select * from admins', function (error, results, fields) {
        if (error) 
            message.reply(error.message);
        else {
            console.log(results.length)
            for (var i = 0; i < results.length; i++) {
                const msg = "ID: <@" + results[i].id + "> STATUS: " + results[i].status;
                console.log(msg)
                message.reply(msg)
            }
        }
    })
}


// TODO  remove
module.exports.judgeAdmin = function(message, adminId, data, con, logger) {
    con.query('update admins set status = "' + data + '" where id = ' + adminId, function (error, results, fields) {
        if (error) 
            message.reply(error.message)
        else
            message.reply('The admin has been judged!')
    })
}


// Update to handle discord id
module.exports.addCredits = function(message, credits, userid, con, logger) {
    con.query('select count(*) as userExists from admins where id = ' + message.author.id + ' and status = "ACCEPT" limit 1', function (error, results, fields) {
        if (error)
            message.reply(error.message)
        if (results[0].userExists == 0) {
            message.reply('Only admin role can run this command!')
        } else {
            con.query('update users set balance = ' + credits + ' where id = ' + userid, function (error, results, fields) {
                if (error) 
                    message.reply(error.message);
                message.channel.send(credits + ' added to user <@!' + userid + '>')
            })
        }
    });
}

module.exports.updateTransferTax = function(message, amount, con, logger) {
    con.query('select count(*) as userExists from admins where id = ' + message.author.id + ' and status = "ACCEPT" limit 1', function (error, results, fields) {
        if (error)
            message.reply(error.message)
        if (results[0].userExists == 0) {
            message.reply('Only admin role can run this command!')
        } else {
            con.query('update settings set transfer_tax = ' + amount + ' where id = 1', function (error, results, fields) {
                if (error) 
                    message.reply(error.message);
                message.reply('The transfer tax has been changed to: ' + amount + '!')
            })
        }
    })
}

/*
module.exports.checkAdmin = function(message, authorid) {
    var ret;
    ret = con.query('select count(*) as userExists from admins where id = ' + authorid + ' and status = "ACCEPT" limit 1', function (error, results, fields) {
        if (error)
            message.reply(error.message)
        if (results[0].userExists == 0) {
            ret = false
        } else {
            ret = true
        }
    });
    return ret
}*/
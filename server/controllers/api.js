const totp = require('notp').totp;
const base32 = require('thirty-two');
const request = require('request');
const CronJob = require('cron').CronJob;
const config = require('../controllers/config');
const TelegramBot = require('node-telegram-bot-api');
const telegram = new TelegramBot(config.telegram.APIKEY, { polling: true });
var marked_price = 154.20;
let balance;

exports.show = function(req, res) {
    res.render('api', {
        title: 'Bitskins API BOT'
    })
}

// Declaration of my API and Secret
var code = totp.gen(base32.decode(config.bitskins.code));
console.log(totp.gen(base32.decode(config.bitskins.code)));
var api_key = config.bitskins.api_key;

// get my balance
request({url: 'https://bitskins.com/api/v1/get_account_balance/?api_key='+api_key+'&code='+code, json: true}, function(err, res, json) {
  if (err) {
    throw err;
  }
  balance = json['data']['available_balance'];
  console.log('Welcome back sir, Kenneth. Your account balance is ' + json['data']['available_balance']);
//   console.log(json);
});

// get specific inventory on sale using Cron (reloads every 5 seconds)
exports.inventory = function (req,res){
    var itemname = req.body.mhn;
    var prefprice = req.body.maxprice;
    var orderby = req.body.order;
    var tradedelay = req.body.delayed;

    var MHN = encodeURI(itemname).replace("(", "%28").replace(")", "%29");
    const job = new CronJob('*/5 * * * * *', function(){
        request.post({url: 'https://bitskins.com/api/v1/get_inventory_on_sale/?api_key='+api_key+'&sort_by=price&order='+orderby+'&max_price='+prefprice+'&market_hash_name='+MHN+'&has_stickers=-1&is_stattrak=-1&is_souvenir=-1&per_page=30&show_trade_delayed_items='+tradedelay+'&code='+code, json:true}, function(err, res, json){
        if (err) {
            throw err;
        }
        
        //   console.log(json);
        //   console.log(json['data']['items']);

        // if there are no items
        if(json['data']['items'].length == 0){
            console.log('There are no items')
            job.stop();
        }

        // if item hits exactly on or below marked price
        for (var i = 0; i < json['data']['items'].length; i++){
            if(json['data']['items'][i]['price'] <= marked_price){
                telegram.sendPhoto(config.telegram.myChatID, json['data']['items'][i]['image'],{caption: 'Item name: '+json['data']['items'][i]['market_hash_name']+'\nItem ID: '+json['data']['items'][i]['item_id']+'\nPrice: ' +json['data']['items'][i]['price']+ '\nFloat: '+json['data']['items'][i]['float_value'] } );
                // console.log('There are items that is below or equals to your marked price!');
                // console.log('item id is: '+json['data']['items'][i]['item_id']);
                // console.log('price is: '+json['data']['items'][i]['price']);
                // console.log("JOB STOPPED");
                console.log('A total of '+ (i+1) +' items have been sent to telegram!');
                job.stop();
            }
        }
        i++;
    });
    });
    job.start();
};

// Purchase item with Telegram bot
telegram.onText(/\/buy (.+)/, (msg,match) => {
    const chatid = msg.chat.id;
    const itemid = match[1];

    telegram.sendMessage(chatid, 'Making purchase right now for Item ID: ' + itemid);

    request.post({url:'https://bitskins.com/api/v1/buy_item/?api_key='+api_key+'&item_ids='+itemid.toString()+'&app_id=730&allow_trade_delayed_purchases=true&prices=150&code='+code, json:true}, function(err, res, json){
    if (err) {
        throw err;
    }

    // if purchase fail, send why
    if (json['status'] == 'fail'){
        telegram.sendMessage(config.telegram.myChatID,json['data']['error_message']);
        telegram.sendMessage(config.telegram.myChatID,'Your current balance: ' + balance);
        console.log('Your current balance: ' + balance);
    } 
    // sent success
    else {
        telegram.sendMessage(config.telegram.myChatID, 'Successfully purchased the item.')
        telegram.sendMessage(config.telegram.myChatID,'Your current balance: ' + balance);
        console.log('Your current balance: ' + balance);
    }

});
});

// err checking
// telegram.on("polling_error", (err) => console.log(err));

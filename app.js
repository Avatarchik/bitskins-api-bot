// Declaration of framework
const express = require('express')
const app = express()
const port = 3000
const totp = require('notp').totp;
const base32 = require('thirty-two');
const request = require('request');
const CronJob = require('cron').CronJob;
const config = require('./config');
var i = 0;

// Some Express stuff
app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// Declaration of my API and Secret
var code = totp.gen(base32.decode(config.bitskins.code));
console.log(totp.gen(base32.decode(config.bitskins.code)));
var api_key = config.bitskins.api_key;

// get my balance
request({url: 'https://bitskins.com/api/v1/get_account_balance/?api_key='+api_key+'&code='+code, json: true}, function(err, res, json) {
  if (err) {
    throw err;
  }
  console.log('Welcome back sir, Kenneth. Your account balance is ' + json['data']['available_balance']);
  console.log(json);
});

// get specific inventory on sale using Cron (reloads every 5 seconds)
const job = new CronJob('*/5 * * * * *', function(){
    request.post({url: 'https://bitskins.com/api/v1/get_inventory_on_sale/?api_key='+api_key+'&sort_by=price&order=asc&market_hash_name=%E2%98%85%20M9%20Bayonet&min_price=100&max_price=150&has_stickers=-1&is_stattrak=-1&is_souvenir=-1&per_page=150&show_trade_delayed_items=1&code='+code, json:true}, function(err, res, json){
    if (err) {
        throw err;
    }
      
      console.log(json);
      console.log(json['data']['items']);
      console.log(json['data']['items'][0]['price']);
    
      console.log('count: ' + i);

      if(json['data']['items'].length == 0){
        console.log('No items')
    }

    // if hit exact price
    if(json['data']['items'][0]['price'] == '145.00'){
        // stop cron job, execute buying orders and etc.
        job.stop();
        console.log('JOB STOPPED!')
    }
    i++;
});
});
job.start();
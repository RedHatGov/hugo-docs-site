require('dotenv').config()
require('shelljs/global');
const prependFile = require('prepend-file');
const GitHubApi   = require("github");
const moment      = require('moment');
const got         = require('got'); 
const fs          = require('fs');

// Call GitHub API
var github = new GitHubApi({
    // optional 
    debug: false,
    protocol: "https",
    host: "api.github.com",
    headers: {
        "user-agent": "Public-Sector-Importer" // GitHub is happy with a unique user agent 
    },
    Promise: require('bluebird'),
    followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects 
    timeout: 5000
});

github.authenticate({
    type: "basic",
    username: process.env.GH_USERNAME,
    password: process.env.GH_PASSWORD
});



github.search.code({ 
    
    q: "rh_workshop_public_sector"

}, function(err, res) {
        
        // console.log(res); // res = Object
        // console.log(res['items']); // Returns Array of Objects
        // console.log(res['items'][itemKey]); // Returns just the Objects from the Array

        var resArray = []; 

        for (var itemKey in res['items']) {

            var resObj = {}; // Create a Object to be pushed onto array

            var item       = res['items'][itemKey]; // Returns just the Objects from the Array
            var repo       = item['repository']     // 2nd level: Object with lots more feilds

             resObj['file_url']   = item['html_url'];
             resObj['file_name']  = item['name'];          // 1st level: Code file name
             resObj['sha']        = item['sha'];
             resObj['repo_name']  = repo.name;
             resObj['repo_id']    = repo.id
             resObj['repo_owner'] = repo.owner.login


             resArray.push(resObj);

        }
        // console.log(resArray);
        // console.log(resArray.length);

        resArray.forEach(function (ws) {

            if (ws.repo_owner == 'RedHatGov') {

                // console.log('Writing: ' + 'https://raw.githubusercontent.com/RedHatGov/' +  ws.repo_name + '/master/' + ws.file_name + ' to /content/workshops/imported');

                got('https://raw.githubusercontent.com/RedHatGov/' +  ws.repo_name + '/master/' + ws.file_name)
                   
                   .then(response => {

                    var hugo_markup = [
                          '+++' + '\n',
                          'title ="' + ws.repo_name.toUpperCase() + '"' + '\n',
                          'date = "' + moment().format() + '"' + '\n',
                          'tags = ["' + ws.repo_name + '"]' + '\n',
                          'categories = ["' + ws.repo_name + '"]' + '\n',
                          'banner = "img/banners/banner-1.jpg"' + '\n',
                          '+++' + '\n',
                          ' ' + '\n',
                        ].join('')

                    fs.writeFile( '../content/workshops/imported/' + ws.repo_id + '-' + ws.file_name, hugo_markup + response.body);
                    
                    })

                    .catch(error => {
                        console.log(error.response.body);
                    }); 
                }

        });
        
});























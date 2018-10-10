var http = require('http')
var url = require('url')
var low = require('lowdb')
var fs = require('fs')
const FileSync = require('lowdb/adapters/FileSync')
const Memory = require('lowdb/adapters/Memory')
var util = require('util')                                                       
var querystring = require('querystring')
const shortid = require('shortid')

var adapter = new FileSync('db.json')
//var adapter = new Memory()
const db = low(adapter);
db.defaults({ req: [] }).write();
var server = http.createServer(function (req, res) {
    var newurl = url.parse(req.url, true)
    if(newurl.pathname == "/favicon.ico"){ 
        return;
    }
    else if(newurl.pathname == "/print"){
        fs.readFile('print.html',function(err,buffer){
            res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
            res.end(buffer);
        })
    }
    else if(newurl.pathname == "/data"){
        var arr = db.get('req').sortBy('date').value();
        arr = arr.reverse();
        res.writeHead(200, { 'Content-Type': 'application/json;charset=utf-8' });
        res.end( JSON.stringify(arr) );
        return ;
    }
    else if(newurl.pathname == "/delete"){
        var arr = db.get('req').remove({id: newurl.query.id }).write();
        res.writeHead(200,{'Content-Type':"text/plain"});
        res.end("1");
        return ;
    }
    else if (newurl.pathname == "/print1") {

        var arr = db.get('req').sortBy('date').value();
        arr = arr.reverse();
        console.log(arr);
        var trs =[];
        for(var item of arr){
            var tr = "<tr>"
            tr += "<td>"+new Date(item['date'])+"</td>";
            tr += "<td>"+item['method']+"</td>";
            tr += "<td>"+item['pathname']+"</td>";
            tr += "<td>"+item['query']+"</td>";
            tr += "<td>"+item['content-type']+"</td>";
            tr += "<td>"+item['post']+"</td>";
            tr += "</tr>"
            trs.push(tr);
        }
        var html = "<table border='1' width='100%'>"+trs.join('')+"</table>";
        res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
        res.end(html);
    } else {
        //pathname  query
        var data = {
            "id": shortid.generate(),
            "date": new Date().valueOf(),
            "method": req.method,
            "pathname": newurl.pathname,
            "query": newurl.search,
            "content-type":req.headers["content-type"],
            "post":null
        };
        if (req.method == "POST") {
            var post = '';
            req.on('data', function (chunk) { post += chunk; })
            req.on('end', function () {
                data.post = post;
                insert(data);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('success');
            })
        } else {
            data.post = null;
            insert(data);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('success');
        }
    }
});

function insert(data){
    db.get('req').push(
             data   
    ).write()
}

server.listen(3001, function () {
    console.log('server start at 3001 port');
});